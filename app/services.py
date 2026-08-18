from __future__ import annotations

import io
import json
import math
import os
import re
import uuid
from pypdf import PdfReader

from .models import Chunk, Deck, Document, Slide, Source


class DocumentStore:
    def __init__(self) -> None:
        self.documents: dict[str, Document] = {}
        self.decks: dict[str, Deck] = {}

    def add(self, document: Document) -> None:
        self.documents[document.id] = document

    def get(self, document_id: str) -> Document:
        if document_id not in self.documents:
            raise KeyError(document_id)
        return self.documents[document_id]


def _clean(text: str) -> str:
    text = re.sub(r"[\t\r]+", " ", text)
    text = re.sub(r" +", " ", text)
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def _split_page(text: str, page: int, start_index: int) -> list[Chunk]:
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    chunks: list[Chunk] = []
    buffer = ""
    for paragraph in paragraphs:
        if len(buffer) + len(paragraph) < 900:
            buffer = f"{buffer}\n{paragraph}".strip()
        else:
            if buffer:
                chunks.append(Chunk(buffer, page, start_index + len(chunks)))
            buffer = paragraph
    if buffer:
        chunks.append(Chunk(buffer, page, start_index + len(chunks)))
    if not chunks and text.strip():
        chunks.append(Chunk(text[:1200], page, start_index))
    return chunks


def parse_pdf(content: bytes, filename: str) -> Document:
    reader = PdfReader(io.BytesIO(content))
    if reader.is_encrypted:
        try:
            reader.decrypt("")
        except Exception as exc:
            raise ValueError("無法讀取加密的 PDF") from exc

    chunks: list[Chunk] = []
    for page_number, page in enumerate(reader.pages, 1):
        text = _clean(page.extract_text() or "")
        chunks.extend(_split_page(text, page_number, len(chunks)))
    if not chunks:
        raise ValueError("PDF 沒有可擷取的文字；掃描檔請先執行 OCR")
    return Document(
        id=uuid.uuid4().hex[:12],
        name=filename,
        pages=len(reader.pages),
        chunks=chunks,
        size_bytes=len(content),
    )


class AIService:
    def __init__(self) -> None:
        self.provider = os.getenv("AI_PROVIDER", "ollama").strip().lower()
        if self.provider not in {"openai", "ollama"}:
            raise ValueError("AI_PROVIDER 必須是 openai 或 ollama")

        self.openai = None
        self.ollama = None
        self._embedder = None
        self.api_key = os.getenv("OPENAI_API_KEY", "").strip()
        if self.provider == "openai":
            if not self.api_key:
                raise ValueError("AI_PROVIDER=openai 時必須設定 OPENAI_API_KEY")
            from openai import OpenAI

            self.model = os.getenv("OPENAI_MODEL", "gpt-5-mini")
            self.embedding_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
            self.openai = OpenAI(api_key=self.api_key)
        else:
            from ollama import Client

            self.model = os.getenv("OLLAMA_MODEL", "qwen3:4b")
            self.embedding_model = os.getenv(
                "HUGGINGFACE_EMBEDDING_MODEL",
                "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
            )
            self.ollama = Client(host=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"))

    @property
    def info(self) -> dict[str, str]:
        label = "Ollama + Hugging Face" if self.provider == "ollama" else "OpenAI"
        return {
            "provider": self.provider,
            "provider_label": label,
            "generation_model": self.model,
            "embedding_model": self.embedding_model,
        }

    def _embed(self, texts: list[str], *, query: bool = False) -> list[list[float]]:
        if self.provider == "openai":
            response = self.openai.embeddings.create(model=self.embedding_model, input=texts)
            return [item.embedding for item in response.data]

        try:
            if self._embedder is None:
                from sentence_transformers import SentenceTransformer

                self._embedder = SentenceTransformer(self.embedding_model)
            method_name = "encode_query" if query and hasattr(self._embedder, "encode_query") else "encode_document"
            method = getattr(self._embedder, method_name, self._embedder.encode)
            vectors = method(texts, normalize_embeddings=True, show_progress_bar=False)
            return vectors.tolist() if hasattr(vectors, "tolist") else [list(vector) for vector in vectors]
        except Exception as exc:
            raise RuntimeError(f"Hugging Face embedding 模型載入或推論失敗：{exc}") from exc

    def index(self, document: Document) -> None:
        document.vectors = self._embed([chunk.text for chunk in document.chunks])

    def retrieve(self, document: Document, query: str, limit: int = 4) -> list[tuple[Chunk, float]]:
        if not document.vectors:
            raise RuntimeError("文件尚未建立 embedding 索引，請重新上傳")
        query_vector = self._embed([query], query=True)[0]
        ranked = []
        for chunk, vector in zip(document.chunks, document.vectors):
            dot = sum(a * b for a, b in zip(query_vector, vector))
            denom = math.sqrt(sum(a * a for a in query_vector)) * math.sqrt(sum(b * b for b in vector))
            ranked.append((chunk, dot / denom if denom else 0.0))
        ranked.sort(key=lambda pair: pair[1], reverse=True)
        return ranked[:limit]

    def _text_response(self, system: str, prompt: str) -> str:
        if self.provider == "openai":
            response = self.openai.responses.create(
                model=self.model, instructions=system, input=prompt, store=False
            )
            return response.output_text.strip()
        try:
            response = self.ollama.chat(
                model=self.model,
                messages=[{"role": "system", "content": system}, {"role": "user", "content": prompt}],
                stream=False,
                options={"temperature": 0.1},
            )
            message = response.message if hasattr(response, "message") else response["message"]
            return (message.content if hasattr(message, "content") else message["content"]).strip()
        except Exception as exc:
            raise RuntimeError(
                f"Ollama 回應失敗；請確認服務已啟動且已執行 `ollama pull {self.model}`：{exc}"
            ) from exc

    def _structured_response(self, system: str, prompt: str, schema: dict) -> dict:
        if self.provider == "openai":
            response = self.openai.responses.create(
                model=self.model,
                instructions=system,
                input=prompt,
                text={"format": {"type": "json_schema", "name": "lesson_deck", "strict": True, "schema": schema}},
                store=False,
            )
            return json.loads(response.output_text)
        try:
            response = self.ollama.chat(
                model=self.model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt + "\n\n請嚴格依照指定 JSON schema 輸出。"},
                ],
                format=schema,
                stream=False,
                options={"temperature": 0},
            )
            message = response.message if hasattr(response, "message") else response["message"]
            content = message.content if hasattr(message, "content") else message["content"]
            
            # 清理與容錯解析 JSON (相容 thinking 標籤與 markdown 程式碼區塊)
            content_clean = content.strip()
            content_clean = re.sub(r"<think>.*?</think>", "", content_clean, flags=re.DOTALL).strip()
            match = re.search(r"```(?:json)?\s*(\{.*\}|\[.*\])\s*```", content_clean, re.DOTALL)
            if match:
                content_clean = match.group(1).strip()
            else:
                match_obj = re.search(r"(\{.*\})", content_clean, re.DOTALL)
                if match_obj:
                    content_clean = match_obj.group(1).strip()
                    
            return json.loads(content_clean)
        except Exception as exc:
            raise RuntimeError(
                f"Ollama 結構化輸出失敗；請確認模型 `{self.model}` 可用：{exc}"
            ) from exc

    def ask(self, document: Document, question: str) -> tuple[str, list[Source], str]:
        matches = self.retrieve(document, question)
        sources = [
            Source(page=c.page, excerpt=c.text[:180] + ("…" if len(c.text) > 180 else ""), score=max(0, min(1, round(s, 2))))
            for c, s in matches
        ]
        context = "\n\n".join(f"[第 {c.page} 頁]\n{c.text}" for c, _ in matches)
        answer = self._text_response(
            "你是嚴謹的繁體中文教學助理。只能根據提供的教材片段回答。"
            "若教材沒有答案，直接說教材未提及。回答清楚、精簡，並以（第 X 頁）標示依據。",
            f"教材片段：\n{context}\n\n學生問題：{question}",
        )
        return answer, sources, self.provider

    def generate_deck(self, document: Document, audience: str, tone: str, slide_count: int, duration: int) -> Deck:
        sampled = document.chunks[: min(30, len(document.chunks))]
        context = "\n\n".join(f"[第 {c.page} 頁] {c.text}" for c in sampled)
        
        if self.provider == "openai":
            schema = {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "subtitle": {"type": "string"},
                    "slides": {
                        "type": "array",
                        "minItems": slide_count,
                        "maxItems": slide_count,
                        "items": {
                            "type": "object",
                            "properties": {
                                "title": {"type": "string"},
                                "bullets": {"type": "array", "items": {"type": "string"}, "minItems": 2, "maxItems": 5},
                                "speaker_notes": {"type": "string"},
                                "source_pages": {"type": "array", "items": {"type": "integer"}},
                            },
                            "required": ["title", "bullets", "speaker_notes", "source_pages"],
                            "additionalProperties": False,
                        },
                    },
                },
                "required": ["title", "subtitle", "slides"],
                "additionalProperties": False,
            }
        else:
            # 專為 Ollama 相容設計之 Schema (去除 minItems/maxItems/additionalProperties)
            schema = {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "subtitle": {"type": "string"},
                    "slides": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "title": {"type": "string"},
                                "bullets": {"type": "array", "items": {"type": "string"}},
                                "speaker_notes": {"type": "string"},
                                "source_pages": {"type": "array", "items": {"type": "integer"}},
                            },
                            "required": ["title", "bullets", "speaker_notes"],
                        },
                    },
                },
                "required": ["title", "subtitle", "slides"],
            }

        payload = self._structured_response(
            "你是資深教學設計師。只使用教材內容，以繁體中文設計投影片與自然、可直接朗讀的逐頁講稿。",
            f"對象：{audience}\n語氣：{tone}\n總時長：{duration} 分鐘\n投影片：{slide_count} 頁\n\n教材：\n{context}",
            schema,
        )

        slides = []
        for item in payload.get("slides", []):
            raw_bullets = item.get("bullets") or item.get("content") or item.get("points") or []
            if isinstance(raw_bullets, str):
                bullets = [b.strip("•- ").strip() for b in raw_bullets.split("\n") if b.strip()]
            else:
                bullets = list(raw_bullets) if raw_bullets else ["重點說明"]
                
            speaker_notes = item.get("speaker_notes") or item.get("script") or item.get("notes") or ""
            source_pages = item.get("source_pages") or ([item["page"]] if "page" in item else [1])
            
            slides.append(Slide(
                title=item.get("title", "未命名投影片"),
                bullets=bullets,
                speaker_notes=speaker_notes,
                source_pages=source_pages,
            ))

        title = payload.get("title") or (slides[0].title if slides else "簡報教案")
        subtitle = payload.get("subtitle") or f"{audience} · {tone}語氣"

        deck = Deck(
            id=uuid.uuid4().hex[:12], document_id=document.id, title=title, subtitle=subtitle,
            slides=slides, duration=duration, mode=self.provider,
        )
        return deck


def make_pptx(deck: Deck) -> bytes:
    from pptx import Presentation
    from pptx.dml.color import RGBColor
    from pptx.enum.text import PP_ALIGN
    from pptx.util import Inches, Pt

    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    for index, item in enumerate(deck.slides):
        slide = prs.slides.add_slide(prs.slide_layouts[6])
        bg = slide.background.fill
        bg.solid()
        bg.fore_color.rgb = RGBColor(247, 247, 242)
        accent = slide.shapes.add_shape(1, Inches(0), Inches(0), Inches(0.18), Inches(7.5))
        accent.fill.solid(); accent.fill.fore_color.rgb = RGBColor(222, 91, 55); accent.line.fill.background()
        number = slide.shapes.add_textbox(Inches(11.9), Inches(0.48), Inches(0.7), Inches(0.4))
        p = number.text_frame.paragraphs[0]; p.text = f"{index + 1:02d}"; p.font.size = Pt(15); p.font.bold = True; p.font.color.rgb = RGBColor(222, 91, 55); p.alignment = PP_ALIGN.RIGHT
        title_box = slide.shapes.add_textbox(Inches(0.85), Inches(0.72), Inches(10.8), Inches(1.15))
        p = title_box.text_frame.paragraphs[0]; p.text = item.title; p.font.name = "Noto Sans TC"; p.font.size = Pt(30); p.font.bold = True; p.font.color.rgb = RGBColor(27, 35, 32)
        body = slide.shapes.add_textbox(Inches(1.05), Inches(2.05), Inches(10.9), Inches(4.5))
        tf = body.text_frame; tf.word_wrap = True
        for bullet_index, bullet in enumerate(item.bullets):
            p = tf.paragraphs[0] if bullet_index == 0 else tf.add_paragraph()
            p.text = bullet; p.font.name = "Noto Sans TC"; p.font.size = Pt(21); p.font.color.rgb = RGBColor(55, 65, 61); p.space_after = Pt(18); p.level = 0
        notes = slide.notes_slide.notes_text_frame
        notes.text = item.speaker_notes + (f"\n\n資料來源頁碼：{', '.join(map(str, item.source_pages))}" if item.source_pages else "")
    output = io.BytesIO(); prs.save(output); return output.getvalue()


def make_script(deck: Deck) -> str:
    lines = [f"# {deck.title}", "", deck.subtitle, ""]
    for i, slide in enumerate(deck.slides, 1):
        lines.extend([f"## {i}. {slide.title}", "", slide.speaker_notes, "", f"> 教材頁碼：{', '.join(map(str, slide.source_pages)) or '—'}", ""])
    return "\n".join(lines)
