from __future__ import annotations

import io
import json
import math
import os
import re
import uuid
from collections import Counter
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


DEMO_TEXT = [
    (1, "生成式人工智慧會根據大量資料學習機率分布，並依提示產生新的文字、圖片或聲音。它不是資料庫查詢，而是逐步預測最可能的內容。"),
    (2, "大型語言模型的核心是 Transformer。注意力機制讓模型衡量不同詞彙之間的關係，因此能在長篇文字中掌握上下文。"),
    (3, "提示工程包含明確任務、背景脈絡、輸出格式與範例。好的提示能降低歧義，但不能完全消除幻覺。"),
    (4, "檢索增強生成（RAG）先從可信文件找出相關片段，再把片段交給模型回答。這能提升可追溯性，並讓知識容易更新。"),
    (5, "負責任使用 AI 需要留意偏誤、隱私、著作權與資訊正確性。重要決策應保留人工覆核，並清楚揭露 AI 的使用。"),
    (6, "評估 AI 系統時，可觀察答案正確率、來源忠實度、回應時間與成本。持續蒐集真實使用情境，才能改善系統。"),
]


def demo_document() -> Document:
    chunks = [Chunk(text=t, page=p, index=i) for i, (p, t) in enumerate(DEMO_TEXT)]
    return Document(id=uuid.uuid4().hex[:12], name="生成式 AI 入門教材.pdf", pages=6, chunks=chunks, size_bytes=1_840_000)


def _tokens(text: str) -> list[str]:
    latin = re.findall(r"[a-zA-Z0-9]{2,}", text.lower())
    chinese = re.findall(r"[\u4e00-\u9fff]", text)
    bigrams = ["".join(chinese[i : i + 2]) for i in range(max(0, len(chinese) - 1))]
    return latin + bigrams


def _cosine_counter(a: Counter[str], b: Counter[str]) -> float:
    shared = set(a) & set(b)
    numerator = sum(a[k] * b[k] for k in shared)
    da = math.sqrt(sum(v * v for v in a.values()))
    db = math.sqrt(sum(v * v for v in b.values()))
    return numerator / (da * db) if da and db else 0.0


class AIService:
    def __init__(self) -> None:
        self.api_key = os.getenv("OPENAI_API_KEY", "").strip()
        self.model = os.getenv("OPENAI_MODEL", "gpt-5-mini")
        self.embedding_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
        self.client = None
        if self.api_key:
            from openai import OpenAI

            self.client = OpenAI(api_key=self.api_key)

    @property
    def enabled(self) -> bool:
        return self.client is not None

    def index(self, document: Document) -> None:
        if not self.client:
            return
        response = self.client.embeddings.create(
            model=self.embedding_model,
            input=[chunk.text for chunk in document.chunks],
        )
        document.vectors = [item.embedding for item in response.data]

    def retrieve(self, document: Document, query: str, limit: int = 4) -> list[tuple[Chunk, float]]:
        if self.client and document.vectors:
            query_vector = self.client.embeddings.create(model=self.embedding_model, input=[query]).data[0].embedding
            ranked = []
            for chunk, vector in zip(document.chunks, document.vectors):
                dot = sum(a * b for a, b in zip(query_vector, vector))
                denom = math.sqrt(sum(a * a for a in query_vector)) * math.sqrt(sum(b * b for b in vector))
                ranked.append((chunk, dot / denom if denom else 0.0))
        else:
            query_terms = Counter(_tokens(query))
            ranked = [(chunk, _cosine_counter(query_terms, Counter(_tokens(chunk.text)))) for chunk in document.chunks]
        ranked.sort(key=lambda pair: pair[1], reverse=True)
        selected = ranked[:limit]
        if selected and selected[0][1] == 0:
            selected = [(chunk, 0.12) for chunk, _ in selected]
        return selected

    def ask(self, document: Document, question: str) -> tuple[str, list[Source], str]:
        matches = self.retrieve(document, question)
        sources = [
            Source(page=c.page, excerpt=c.text[:180] + ("…" if len(c.text) > 180 else ""), score=max(0, min(1, round(s, 2))))
            for c, s in matches
        ]
        context = "\n\n".join(f"[第 {c.page} 頁]\n{c.text}" for c, _ in matches)
        if self.client:
            response = self.client.responses.create(
                model=self.model,
                instructions=(
                    "你是嚴謹的繁體中文教學助理。只能根據提供的教材片段回答。"
                    "若教材沒有答案，直接說教材未提及。回答清楚、精簡，並以（第 X 頁）標示依據。"
                ),
                input=f"教材片段：\n{context}\n\n學生問題：{question}",
                store=False,
            )
            return response.output_text.strip(), sources, "ai"

        if not matches:
            return "目前的教材中找不到足夠資訊回答這個問題。", sources, "local"
        best, _ = matches[0]
        answer = (
            f"依教材第 {best.page} 頁，{best.text[:260]}"
            + ("…" if len(best.text) > 260 else "")
            + "\n\n目前為本機檢索模式；設定 API Key 後可獲得整合多段內容的生成式回答。"
        )
        return answer, sources, "local"

    def generate_deck(self, document: Document, audience: str, tone: str, slide_count: int, duration: int) -> Deck:
        if self.client:
            sampled = document.chunks[: min(30, len(document.chunks))]
            context = "\n\n".join(f"[第 {c.page} 頁] {c.text}" for c in sampled)
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
            response = self.client.responses.create(
                model=self.model,
                instructions="你是資深教學設計師。只使用教材內容，以繁體中文設計投影片與自然、可直接朗讀的逐頁講稿。",
                input=f"對象：{audience}\n語氣：{tone}\n總時長：{duration} 分鐘\n投影片：{slide_count} 頁\n\n教材：\n{context}",
                text={"format": {"type": "json_schema", "name": "lesson_deck", "strict": True, "schema": schema}},
                store=False,
            )
            payload = json.loads(response.output_text)
            slides = [Slide(**item) for item in payload["slides"]]
            mode = "ai"
            title, subtitle = payload["title"], payload["subtitle"]
        else:
            slides = self._local_slides(document, slide_count, duration)
            title = re.sub(r"\.pdf$", "", document.name, flags=re.I)
            subtitle = f"{audience}｜{duration} 分鐘教學設計"
            mode = "local"

        deck = Deck(
            id=uuid.uuid4().hex[:12], document_id=document.id, title=title, subtitle=subtitle,
            slides=slides, duration=duration, mode=mode,
        )
        return deck

    def _local_slides(self, document: Document, count: int, duration: int) -> list[Slide]:
        chunks = document.chunks
        slides: list[Slide] = []
        title = re.sub(r"\.pdf$", "", document.name, flags=re.I)
        slides.append(Slide(title=title, bullets=["課程重點與學習路徑", f"預計時間：{duration} 分鐘"], speaker_notes=f"歡迎來到「{title}」。這堂課會從核心概念開始，逐步連結到實際應用。", source_pages=[1]))
        for i in range(1, count - 1):
            chunk = chunks[min(len(chunks) - 1, round((i - 1) * (len(chunks) - 1) / max(1, count - 3)))]
            sentences = [s.strip() for s in re.split(r"(?<=[。！？])", chunk.text) if len(s.strip()) > 8]
            bullets = [(s[:52] + ("…" if len(s) > 52 else "")) for s in sentences[:4]] or [chunk.text[:70]]
            heading = re.sub(r"[，。；：].*", "", bullets[0])[:22] or f"核心概念 {i}"
            slides.append(Slide(title=heading, bullets=bullets, speaker_notes=f"這一頁聚焦在「{heading}」。{chunk.text[:300]}", source_pages=[chunk.page]))
        slides.append(Slide(title="重點回顧", bullets=["用自己的話說明核心概念", "連結教材內容與真實情境", "提出一個仍想深入探索的問題"], speaker_notes="最後，請回想今天最重要的三個觀念。試著用自己的話重述，並思考它能如何應用在真實情境中。", source_pages=sorted({c.page for c in chunks[-2:]})))
        return slides


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
