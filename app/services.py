from __future__ import annotations

import io
import json
import logging
import math
import os
import re
import uuid
from concurrent.futures import ThreadPoolExecutor
from pypdf import PdfReader
from typing import Any, Optional

from pydantic import TypeAdapter
from .models import Chunk, Deck, Document, Handout, HandoutSection, QuizQuestion, QuizSheet, Slide, Source
from .workflows import build_deck_graph, build_qa_graph, build_quiz_graph


class DiskDict(dict):
    """具備磁碟持久化特性的字典，啟動時自動載入，賦值時自動非同步/同步寫入 JSON 檔案。"""
    def __init__(self, directory: str, model_cls: type, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self.directory = directory
        self.adapter = TypeAdapter(model_cls)
        os.makedirs(self.directory, exist_ok=True)
        self._load_all()

    def _load_all(self) -> None:
        try:
            for fname in os.listdir(self.directory):
                if fname.endswith(".json"):
                    fpath = os.path.join(self.directory, fname)
                    try:
                        with open(fpath, "rb") as f:
                            content = f.read()
                        obj = self.adapter.validate_json(content)
                        key = getattr(obj, "id", fname[:-5])
                        super().__setitem__(key, obj)
                    except Exception as err:
                        logging.getLogger(__name__).warning("無法載入持久化檔案 %s: %s", fpath, err)
        except Exception as err:
            logging.getLogger(__name__).warning("掃描持久化目錄 %s 失敗: %s", self.directory, err)

    def __setitem__(self, key: str, value: typing.Any) -> None:
        super().__setitem__(key, value)
        try:
            fpath = os.path.join(self.directory, f"{key}.json")
            json_bytes = self.adapter.dump_json(value, indent=2)
            with open(fpath, "wb") as f:
                f.write(json_bytes)
        except Exception as err:
            logging.getLogger(__name__).warning("寫入持久化檔案 %s 失敗: %s", key, err)

    def __delitem__(self, key: str) -> None:
        super().__delitem__(key)
        try:
            fpath = os.path.join(self.directory, f"{key}.json")
            if os.path.exists(fpath):
                os.remove(fpath)
        except Exception as err:
            logging.getLogger(__name__).warning("刪除持久化檔案 %s 失敗: %s", key, err)


class DocumentStore:
    def __init__(self, base_dir: Optional[str] = None) -> None:
        if base_dir is None:
            base_dir = os.getenv("DOCUMENT_STORE_DIR", os.path.join(os.path.dirname(__file__), "data", "store"))
        self.base_dir = base_dir
        self.documents: dict[str, Document] = DiskDict(os.path.join(base_dir, "documents"), Document)
        self.decks: dict[str, Deck] = DiskDict(os.path.join(base_dir, "decks"), Deck)
        self.quizzes: dict[str, QuizSheet] = DiskDict(os.path.join(base_dir, "quizzes"), QuizSheet)
        self.handouts: dict[str, Handout] = DiskDict(os.path.join(base_dir, "handouts"), Handout)

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


MATH_INDICATORS = {
    "\\int", "\\sum", "\\sqrt", "\\frac", "\\lim", "\\alpha", "\\beta", "\\gamma",
    "\\theta", "\\pi", "\\sigma", "\\infty", "\\partial", "\\matrix", "\\begin",
    "\\over", "\\vec", "\\cdot", "\\times", "\\div", "\\pm", "\\mp", "\\neq",
    "\\leq", "\\geq", "\\approx", "\\equiv", "\\propto", "\\in", "\\notin",
    "\\subset", "\\cup", "\\cap", "\\forall", "\\exists",
    "±", "∓", "≠", "≤", "≥", "≈", "≡", "∞", "∫", "∑", "∏", "√", "∛", "∜", "∂",
    "∇", "∈", "∉", "⊂", "⊆", "∪", "∩", "∧", "∨", "¬", "⇒", "⇔", "→", "↑", "↓",
    "°", "℃", "℉", "Å", "μ", "Ω", "π", "θ", "λ", "Δ", "α", "β", "γ", "δ", "ε",
    "ζ", "η", "κ", "μ", "ν", "ξ", "ρ", "σ", "τ", "φ", "χ", "ψ", "ω"
}


def _page_needs_vision(page: typing.Any, text: str) -> bool:
    """判斷 PDF 頁面是否包含圖片、掃描內容、表格結構或數學公式/符號，從而需要 VLM 多模態 Vision 解析。"""
    try:
        if hasattr(page, "get_images") and callable(page.get_images):
            if len(page.get_images()) > 0:
                return True
    except Exception:
        pass

    clean_text = text.strip()

    # 1. 若文字量極少 (例如圖片/掃描頁面)，需走 Vision 解析
    if len(clean_text) < 40:
        return True

    # 2. 檢查是否包含數學/理化公式符號
    if any(indicator in clean_text for indicator in MATH_INDICATORS):
        return True

    # 3. 檢查是否包含表格結構特徵 (如 Markdown 表格豎線 `|` 或連續 Tab 分離)
    if clean_text.count("|") >= 2 or "\t\t" in clean_text:
        return True

    return False


def parse_pdf(
    content: bytes,
    filename: str,
    ai_service: Optional[AIService] = None,
    enable_multimodal: Optional[bool] = None,
) -> Document:
    chunks: list[Chunk] = []
    total_pages = 0

    # 1. 嘗試使用 PyMuPDF + Vision (方案 A) 進行多模態直解 (含 LaTeX 與圖說)
    if enable_multimodal is None:
        enable_multimodal = os.getenv("ENABLE_MULTIMODAL_PARSING", "false").lower() in ("true", "1", "yes")
    enable_smart_routing = os.getenv("ENABLE_SMART_ROUTING", "true").lower() in ("true", "1", "yes")

    if enable_multimodal and ai_service is not None:
        try:
            import pymupdf  # PyMuPDF
            doc = pymupdf.open(stream=content, filetype="pdf")
            total_pages = len(doc)
            dpi = int(os.getenv("MULTIMODAL_DPI", "200"))
            
            max_workers = int(os.getenv("MULTIMODAL_MAX_WORKERS", "10"))
            pages_list = [(page_idx, page) for page_idx, page in enumerate(doc, 1)]

            def _process_page(item: tuple[int, pymupdf.Page]) -> tuple[int, str]:
                page_idx, page = item
                text = _clean(page.get_text() or "")

                # 頁面級智慧分流：若未開啟或判定需要 Vision，走 Vision 管道；否則直接使用本機擷取之純文字
                if enable_smart_routing and not _page_needs_vision(page, text):
                    logging.getLogger(__name__).info("第 %d 頁判定為純文字頁面，走極速本機解析管道", page_idx)
                    return page_idx, text

                try:
                    pix = page.get_pixmap(dpi=dpi)
                    img_bytes = pix.tobytes("png")
                    page_markdown = ai_service._vision_page_to_markdown(img_bytes)
                    if page_markdown and page_markdown.strip():
                        return page_idx, page_markdown
                except Exception as page_exc:
                    logging.getLogger(__name__).warning("第 %d 頁 Vision 解析失敗：%s", page_idx, page_exc)
                return page_idx, text

            actual_workers = max(1, min(max_workers, len(pages_list)))
            with ThreadPoolExecutor(max_workers=actual_workers) as executor:
                page_results = list(executor.map(_process_page, pages_list))

            page_results.sort(key=lambda x: x[0])
            for page_idx, page_markdown in page_results:
                if page_markdown and page_markdown.strip():
                    chunks.extend(_split_page(page_markdown, page_idx, len(chunks)))
        except Exception as exc:
            logging.getLogger(__name__).warning("PyMuPDF 多模態直解失敗，將自動平滑降級為 pypdf 文字模式：%s", exc)
            chunks = []

    # 2. 若多模態模式未啟動、失敗或傳回空資料，自動降級為 pypdf 文字擷取
    if not chunks:
        reader = PdfReader(io.BytesIO(content))
        if reader.is_encrypted:
            try:
                reader.decrypt("")
            except Exception as exc:
                raise ValueError("無法讀取加密的 PDF") from exc

        total_pages = len(reader.pages)
        for page_number, page in enumerate(reader.pages, 1):
            text = _clean(page.extract_text() or "")
            chunks.extend(_split_page(text, page_number, len(chunks)))

    if not chunks:
        raise ValueError("PDF 沒有可擷取的文字與影像內容；請確認檔案正常且未毀損")

    return Document(
        id=uuid.uuid4().hex[:12],
        name=filename,
        pages=total_pages,
        chunks=chunks,
        size_bytes=len(content),
    )


def parse_text(content: str, filename: str = "AI_教案教材.md") -> Document:
    clean_text = _clean(content)
    if not clean_text:
        raise ValueError("教材內容不可為空")

    pages_list = [p.strip() for p in re.split(r"\n(?=# |\n---\n)", clean_text) if p.strip()]
    if not pages_list:
        pages_list = [clean_text]

    chunks: list[Chunk] = []
    for page_idx, page_text in enumerate(pages_list, 1):
        chunks.extend(_split_page(page_text, page_idx, len(chunks)))

    return Document(
        id=uuid.uuid4().hex[:12],
        name=filename,
        pages=len(pages_list),
        chunks=chunks,
        size_bytes=len(content.encode("utf-8")),
    )


def _prepare_openai_strict_schema(schema: dict) -> dict:
    """遞迴轉換 JSON Schema 以符合 OpenAI Strict Structured Output 的語義要求 (如包含 additionalProperties: False 與 required 欄位)。"""
    if not isinstance(schema, dict):
        return schema

    cleaned = {}
    unsupported_keys = {"minItems", "maxItems", "minimum", "maximum", "minLength", "maxLength", "pattern", "format", "default"}

    for key, value in schema.items():
        if key in unsupported_keys:
            continue
        if key == "properties" and isinstance(value, dict):
            cleaned_props = {}
            for prop_name, prop_schema in value.items():
                cleaned_props[prop_name] = _prepare_openai_strict_schema(prop_schema)
            cleaned["properties"] = cleaned_props
        elif key == "items" and isinstance(value, dict):
            cleaned["items"] = _prepare_openai_strict_schema(value)
        else:
            cleaned[key] = value

    if cleaned.get("type") == "object" or "properties" in cleaned:
        cleaned["type"] = "object"
        cleaned["additionalProperties"] = False
        if "properties" in cleaned and isinstance(cleaned["properties"], dict):
            cleaned["required"] = list(cleaned["properties"].keys())

    return cleaned


def _clean_and_load_json(json_str: str) -> dict:
    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        # 修復 LaTeX 數學公式中未正確轉義的反斜線 (如 \frac, \alpha, \sum 等)
        repaired = re.sub(r'\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})', r'\\\\', json_str)
        try:
            return json.loads(repaired)
        except Exception:
            # 二次積極修復：修復除了雙引號與反斜線外的所有孤立反斜線
            repaired2 = re.sub(r'\\(?![\\"])', r'\\\\', json_str)
            return json.loads(repaired2)


def _parse_json_response(content: str) -> dict:
    content_clean = content.strip()
    # 處理 reasoning/thinking 標籤 (包含未閉合的 <think>)
    if "</think>" in content_clean:
        content_clean = content_clean.split("</think>")[-1].strip()

    match = re.search(r"```(?:json)?\s*(\{.*\}|\[.*\])\s*```", content_clean, re.DOTALL)
    if match:
        return _clean_and_load_json(match.group(1).strip())

    start_idx = content_clean.find("{")
    end_idx = content_clean.rfind("}")
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        json_str = content_clean[start_idx : end_idx + 1]
        try:
            return _clean_and_load_json(json_str)
        except Exception:
            pass

def _search_web_for_context(query_str: str) -> str:
    clean_q = re.sub(r"[：:｜|—\-_【】\[\]\(\)（）？?！!，,。.]", " ", query_str)
    clean_q = re.sub(r"\s+", " ", clean_q).strip()[:50] or query_str[:50]
    try:
        from duckduckgo_search import DDGS
        results = list(DDGS(timeout=10).text(clean_q, max_results=3))
        if results:
            formatted = []
            for item in results:
                formatted.append(f"標題：{item.get('title', '')}\n摘要：{item.get('body', '')}")
            return "\n\n".join(formatted)
    except Exception as exc:
        logging.getLogger(__name__).warning("DuckDuckGo 網路搜尋補充失敗：%s", exc)
    return ""


class AIService:
    def __init__(self) -> None:
        self.openai = None
        self.gemini_client = None
        self.ollama = None
        self._embedder = None
        self.api_key = os.getenv("OPENAI_API_KEY", "").strip()
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.qa_graph = build_qa_graph()
        self.deck_graph = build_deck_graph()
        self.quiz_graph = build_quiz_graph()

        initial_provider = os.getenv("AI_PROVIDER", "gemini").strip().lower()
        valid_providers = {"openai", "gemini", "ollama", "ollama_cloud", "ollama_local"}
        self.set_provider(initial_provider if initial_provider in valid_providers else "gemini")

    def set_provider(self, provider: str) -> dict[str, str]:
        from dotenv import load_dotenv
        load_dotenv(override=True)
        provider = provider.strip().lower()
        if provider == "ollama":
            base_url = os.getenv("OLLAMA_BASE_URL", "")
            provider = "ollama_local" if "localhost" in base_url or "127.0.0.1" in base_url else "ollama_cloud"

        if provider not in {"openai", "gemini", "ollama_cloud", "ollama_local"}:
            raise ValueError("AI_PROVIDER 必須是 gemini, openai, ollama_cloud 或 ollama_local")

        if provider == "gemini":
            if self.gemini_client is None and self.gemini_api_key:
                try:
                    from google import genai
                    self.gemini_client = genai.Client(api_key=self.gemini_api_key)
                except Exception as exc:
                    logging.getLogger(__name__).warning("Gemini Client 初始化失敗：%s", exc)
            self.model = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
            self.embedding_model = os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-2")

        elif provider == "openai":
            if not self.api_key:
                raise ValueError("未設定 OPENAI_API_KEY，無法切換至 OpenAI")
            if self.openai is None:
                from openai import OpenAI

                self.openai = OpenAI(api_key=self.api_key)
            self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
            self.embedding_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")

        elif provider == "ollama_local":
            from ollama import Client
            local_url = os.getenv("OLLAMA_LOCAL_URL", "http://localhost:11434")
            local_client = Client(host=local_url)
            try:
                local_client.list()
            except Exception as exc:
                raise ValueError(f"未偵測到 Ollama 本機服務，請確認已安裝並啟動 Ollama ({local_url})。") from exc

            self.ollama = local_client
            self.model = os.getenv("OLLAMA_LOCAL_MODEL", os.getenv("OLLAMA_MODEL", "qwen2.5:3b"))
            self.embedding_model = os.getenv(
                "HUGGINGFACE_EMBEDDING_MODEL",
                "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
            )

        elif provider == "ollama_cloud":
            from ollama import Client
            cloud_url = os.getenv("OLLAMA_BASE_URL", "https://api.ollama.com")
            ollama_key = os.getenv("OLLAMA_API_KEY", "").strip()
            headers = {"Authorization": f"Bearer {ollama_key}"} if ollama_key else {}
            self.ollama = Client(host=cloud_url, headers=headers)
            self.model = os.getenv("OLLAMA_MODEL", "deepseek-v4-flash:0731")
            self.embedding_model = os.getenv("OLLAMA_EMBEDDING_MODEL", "bge-m3")

        self.provider = provider
        return self.info

    @property
    def info(self) -> dict[str, str]:
        labels = {
            "gemini": "Gemini 雲端 API",
            "openai": "OpenAI 雲端 API",
            "ollama_cloud": "Ollama 雲端 API",
            "ollama_local": "Ollama 本機服務",
        }
        label = labels.get(self.provider, "Ollama")
        return {
            "provider": self.provider,
            "provider_label": label,
            "generation_model": self.model,
            "embedding_model": self.embedding_model,
        }

    def _vision_page_to_markdown(self, img_bytes: bytes) -> str:
        """使用 VLM 進行 Vision-Native 多模態頁面直解 (提取表格、LaTeX 公式與觀念圖說)"""
        prompt = (
            "你是一個專業的教材文件 Vision-to-Markdown 解析專家。請分析這張教材頁面圖片，將其轉譯為標準 Markdown 格式：\n"
            "1. 數學公式與理化符號：請將所有單行或獨立公式轉譯為標準 LaTeX 語法（例如 `$E=mc^2$` 或 `$$\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$`）。\n"
            "2. 表格：請轉為標準 Markdown 表格格式。\n"
            "3. 圖片與圖表：請插入 `![圖說描述](fig)` 並詳細說明圖片呈現的觀念、數據與實驗結果。\n"
            "4. 保持原本的章節標題階層 (#, ##, ###) 與排版順序。"
        )

        import base64
        b64_str = base64.b64encode(img_bytes).decode("utf-8")

        if self.provider == "gemini" and self.gemini_client is not None:
            try:
                from google.genai import types
                response = self.gemini_client.models.generate_content(
                    model=self.model,
                    contents=[
                        types.Part.from_bytes(data=img_bytes, mime_type="image/png"),
                        prompt,
                    ],
                )
                return (response.text or "").strip()
            except Exception as exc:
                logging.getLogger(__name__).warning("Gemini Vision 解析失敗：%s", exc)

        elif self.provider == "openai" and self.openai is not None:
            try:
                response = self.openai.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64_str}"}},
                            ],
                        }
                    ],
                    max_tokens=2000,
                )
                return (response.choices[0].message.content or "").strip()
            except Exception as exc:
                logging.getLogger(__name__).warning("OpenAI Vision 解析失敗：%s", exc)

        elif self.provider in ("ollama_cloud", "ollama_local") and self.ollama is not None:
            try:
                vision_model = os.getenv("OLLAMA_CLOUD_VISION_MODEL" if self.provider == "ollama_cloud" else "OLLAMA_LOCAL_VISION_MODEL", "qwen2-vl:7b")
                response = self.ollama.chat(
                    model=vision_model,
                    messages=[{"role": "user", "content": prompt, "images": [b64_str]}],
                )
                message = response.message if hasattr(response, "message") else response["message"]
                return (message.content if hasattr(message, "content") else message["content"]).strip()
            except Exception as exc:
                logging.getLogger(__name__).warning("Ollama Vision 解析失敗：%s", exc)

        return ""

    def _embed(self, texts: list[str], *, query: bool = False) -> list[list[float]]:
        if self.provider == "gemini" and self.gemini_client is not None:
            try:
                from google.genai import types
                vectors = []
                batch_size = 50
                for i in range(0, len(texts), batch_size):
                    batch = texts[i : i + batch_size]
                    contents = [types.Content(parts=[types.Part.from_text(text=t)]) for t in batch]
                    res = self.gemini_client.models.embed_content(
                        model=self.embedding_model,
                        contents=contents,
                    )
                    if hasattr(res, "embeddings") and res.embeddings:
                        for emb in res.embeddings:
                            vectors.append(emb.values if hasattr(emb, "values") else list(emb))
                if vectors:
                    return vectors
            except Exception as exc:
                logging.getLogger(__name__).warning("Gemini Embedding 計算失敗：%s", exc)

        if self.provider == "openai" and self.openai is not None:
            response = self.openai.embeddings.create(model=self.embedding_model, input=texts)
            return [item.embedding for item in response.data]

        if self.provider == "ollama_cloud" and self.ollama is not None:
            try:
                # 嘗試呼叫 Ollama 原生 embed API
                if hasattr(self.ollama, "embed"):
                    res = self.ollama.embed(model=self.embedding_model, input=texts)
                    embeddings = res.embeddings if hasattr(res, "embeddings") else res.get("embeddings", [])
                    if embeddings:
                        return embeddings
            except Exception as exc:
                logging.getLogger(__name__).warning("Ollama Cloud embed API 呼叫失敗，將降級為本地模型：%s", exc)

        # 延遲載入 (Lazy Loading) 本地 Hugging Face Embedding 模型 (避免在雲端模式下浪費 GB 級 RAM)
        try:
            if self._embedder is None:
                from sentence_transformers import SentenceTransformer
                hf_model = os.getenv("HUGGINGFACE_EMBEDDING_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
                self._embedder = SentenceTransformer(hf_model)
            method_name = "encode_query" if query and hasattr(self._embedder, "encode_query") else "encode_document"
            method = getattr(self._embedder, method_name, self._embedder.encode)
            vectors = method(texts, normalize_embeddings=True, show_progress_bar=False)
            return vectors.tolist() if hasattr(vectors, "tolist") else [list(vector) for vector in vectors]
        except Exception as exc:
            raise RuntimeError(f"Embedding 模型載入或推論失敗：{exc}") from exc

    def index(self, document: Document) -> None:
        document.vectors = self._embed([chunk.text for chunk in document.chunks])

    def retrieve(self, document: Document, query: str, limit: int = 4) -> list[tuple[Chunk, float]]:
        if not document.vectors:
            self.index(document)
        query_vector = self._embed([query], query=True)[0]
        if document.vectors and len(document.vectors[0]) != len(query_vector):
            self.index(document)
        ranked = []
        for chunk, vector in zip(document.chunks, document.vectors):
            dot = sum(a * b for a, b in zip(query_vector, vector))
            denom = math.sqrt(sum(a * a for a in query_vector)) * math.sqrt(sum(b * b for b in vector))
            ranked.append((chunk, dot / denom if denom else 0.0))
        ranked.sort(key=lambda pair: pair[1], reverse=True)
        return ranked[:limit]

    def _text_response(self, system: str, prompt: str) -> str:
        last_exc = None
        if self.provider == "gemini" and self.gemini_client is not None:
            import time
            for attempt in range(2):
                try:
                    from google.genai import types
                    response = self.gemini_client.models.generate_content(
                        model=self.model,
                        contents=prompt,
                        config=types.GenerateContentConfig(system_instruction=system, temperature=0.1),
                    )
                    return (response.text or "").strip()
                except Exception as exc:
                    last_exc = exc
                    if "429" in str(exc) or "RESOURCE_EXHAUSTED" in str(exc):
                        logging.getLogger(__name__).warning("Gemini 遭遇 429 速率限制，等待 1.5 秒後進行重試...")
                        time.sleep(1.5)
                        continue
                    logging.getLogger(__name__).warning("Gemini 文字生成失敗：%s", exc)
                    break

        if self.provider == "openai" and self.openai is not None:
            try:
                response = self.openai.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.1,
                )
                return (response.choices[0].message.content or "").strip()
            except Exception as exc:
                logging.getLogger(__name__).warning("OpenAI 文字生成失敗：%s", exc)
                raise RuntimeError(f"OpenAI 生成失敗：{exc}") from exc

        # 嘗試 Ollama (作為主提供商或備援提供商)
        ollama_client = self.ollama
        ollama_model = self.model
        if ollama_client is None:
            try:
                from ollama import Client
                local_url = os.getenv("OLLAMA_LOCAL_URL", "http://localhost:11434")
                test_client = Client(host=local_url)
                test_client.list()
                ollama_client = test_client
                ollama_model = os.getenv("OLLAMA_LOCAL_MODEL", os.getenv("OLLAMA_MODEL", "qwen2.5:7b"))
            except Exception as ollama_err:
                logging.getLogger(__name__).warning("無法連接本地 Ollama 備援服務：%s", ollama_err)
                ollama_client = None

        if ollama_client is None:
            raise RuntimeError(f"文字生成失敗且無可用備援模型：{last_exc if last_exc else 'Provider 異常'}")

        try:
            response = ollama_client.chat(
                model=ollama_model,
                messages=[{"role": "system", "content": system}, {"role": "user", "content": prompt}],
                stream=False,
                options={"temperature": 0.1},
            )
            message = response.message if hasattr(response, "message") else response["message"]
            return (message.content if hasattr(message, "content") else message["content"]).strip()
        except Exception as exc:
            raise RuntimeError(
                f"Ollama 回應失敗；請確認服務已啟動且已執行 `ollama pull {ollama_model}`：{exc}"
            ) from exc

    def _structured_response(self, system: str, prompt: str, schema: dict) -> dict:
        last_exc = None
        if self.provider == "gemini" and self.gemini_client is not None:
            import time
            for attempt in range(2):
                try:
                    from google.genai import types
                    response = self.gemini_client.models.generate_content(
                        model=self.model,
                        contents=prompt + f"\n\n請務必輸出符合結構的 JSON。\nSchema: {json.dumps(schema, ensure_ascii=False)}",
                        config=types.GenerateContentConfig(
                            system_instruction=system,
                            response_mime_type="application/json",
                            temperature=0,
                        ),
                    )
                    return _parse_json_response(response.text or "{}")
                except Exception as exc:
                    last_exc = exc
                    if "429" in str(exc) or "RESOURCE_EXHAUSTED" in str(exc):
                        logging.getLogger(__name__).warning("Gemini 遭遇 429 速率限制，等待 1.5 秒後進行重試...")
                        time.sleep(1.5)
                        continue
                    logging.getLogger(__name__).warning("Gemini 結構化輸出失敗 (嘗試 %d)：%s", attempt + 1, exc)
                    break

        if self.provider == "openai" and self.openai is not None:
            try:
                strict_schema = _prepare_openai_strict_schema(schema)
                response = self.openai.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system},
                        {"role": "user", "content": prompt},
                    ],
                    response_format={
                        "type": "json_schema",
                        "json_schema": {
                            "name": "structured_output",
                            "strict": True,
                            "schema": strict_schema,
                        },
                    },
                    temperature=0,
                )
                content = response.choices[0].message.content or "{}"
                return _parse_json_response(content)
            except Exception as exc:
                logging.getLogger(__name__).warning("OpenAI 結構化輸出 (strict json_schema) 失敗，將降級為 json_object 模式：%s", exc)
                try:
                    response = self.openai.chat.completions.create(
                        model=self.model,
                        messages=[
                            {"role": "system", "content": system},
                            {"role": "user", "content": prompt + f"\n\n請務必僅輸出合法 JSON，Schema 規定如下：\n{json.dumps(schema, ensure_ascii=False)}"},
                        ],
                        response_format={"type": "json_object"},
                        temperature=0,
                    )
                    content = response.choices[0].message.content or "{}"
                    return _parse_json_response(content)
                except Exception as fallback_exc:
                    raise RuntimeError(f"OpenAI 內容生成失敗：{fallback_exc}") from fallback_exc

        # 嘗試 Ollama (作為主提供商或備援提供商)
        ollama_client = self.ollama
        ollama_model = self.model
        if ollama_client is None:
            try:
                from ollama import Client
                local_url = os.getenv("OLLAMA_LOCAL_URL", "http://localhost:11434")
                test_client = Client(host=local_url)
                test_client.list()
                ollama_client = test_client
                ollama_model = os.getenv("OLLAMA_LOCAL_MODEL", os.getenv("OLLAMA_MODEL", "qwen2.5:7b"))
            except Exception as ollama_err:
                logging.getLogger(__name__).warning("無法連接本地 Ollama 備援服務：%s", ollama_err)
                ollama_client = None

        if ollama_client is None:
            raise RuntimeError(f"結構化輸出失敗且無可用備援模型：{last_exc if last_exc else 'Provider 異常'}")
        
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt + "\n\n請嚴格依照指定 JSON schema 輸出。"},
        ]
        try:
            response = ollama_client.chat(
                model=ollama_model,
                messages=messages,
                format=schema,
                stream=False,
                options={"temperature": 0},
            )
            message = response.message if hasattr(response, "message") else response["message"]
            content = message.content if hasattr(message, "content") else message["content"]
            return _parse_json_response(content)
        except Exception as exc_schema:
            try:
                fallback_prompt = prompt + f"\n\n請務必僅輸出合法 JSON，Schema 規定如下：\n{json.dumps(schema, ensure_ascii=False)}"
                response = ollama_client.chat(
                    model=ollama_model,
                    messages=[
                        {"role": "system", "content": system},
                        {"role": "user", "content": fallback_prompt},
                    ],
                    format="json",
                    stream=False,
                    options={"temperature": 0},
                )
                message = response.message if hasattr(response, "message") else response["message"]
                content = message.content if hasattr(message, "content") else message["content"]
                return _parse_json_response(content)
            except Exception as exc_json:
                raise RuntimeError(
                    f"Ollama 結構化輸出失敗；請確認模型 `{ollama_model}` 可用：{exc_schema} | {exc_json}"
                ) from exc_json

    def ask(
        self, document: Document, question: str, enable_web_search: bool = False
    ) -> tuple[str, list[Source], str]:
        initial_state = {
            "question": question,
            "document": document,
            "enable_web_search": enable_web_search,
            "ai_service": self,
        }
        result = self.qa_graph.invoke(initial_state)
        answer = result.get("answer", "")
        sources = result.get("sources", [])
        return answer, sources, self.provider

    def generate_deck(
        self,
        document: Document,
        audience: str,
        tone: str,
        slide_count: int,
        duration: int,
        enable_web_search: bool = False,
        language: str = "zh-TW",
        handout_text: Optional[str] = None,
    ) -> Deck:
        initial_state = {
            "document": document,
            "audience": audience,
            "tone": tone,
            "language": language,
            "slide_count": slide_count,
            "duration": duration,
            "enable_web_search": enable_web_search,
            "handout_text": handout_text,
            "ai_service": self,
        }
        result = self.deck_graph.invoke(initial_state)
        deck = result.get("deck")
        if not deck:
            raise RuntimeError("簡報生成圖未傳回有效 Deck 物件")
        return deck

    def generate_quiz(
        self,
        document: Document,
        question_count: int = 5,
        difficulty: str = "all",
        enable_web_search: bool = False,
        language: str = "zh-TW",
        handout_text: Optional[str] = None,
    ) -> QuizSheet:
        initial_state = {
            "document": document,
            "question_count": question_count,
            "difficulty": difficulty,
            "language": language,
            "enable_web_search": enable_web_search,
            "handout_text": handout_text,
            "ai_service": self,
        }
        result = self.quiz_graph.invoke(initial_state)
        quiz_sheet = result.get("quiz_sheet")
        if not quiz_sheet:
            raise RuntimeError("題目卷生成圖未傳回有效 QuizSheet 物件")
        return quiz_sheet

    def generate_handout(
        self,
        document: Document,
        target_audience: str = "學生/學習者",
        detail_level: str = "standard",
        language: str = "zh-TW",
        enable_web_search: bool = False,
    ) -> Handout:
        total_chunks = len(document.chunks)
        sample_k = min(12, total_chunks)
        step = max(1, total_chunks // sample_k) if total_chunks > 0 else 1
        sampled = [document.chunks[i] for i in range(0, total_chunks, step)][:sample_k]
        context = "\n---\n".join(f"[第 {c.page} 頁段落]\n{c.text[:800]}" for c in sampled)

        web_context = ""
        if enable_web_search:
            search_query = f"{document.name} 核心觀念 重點整理"
            web_results = _search_web_for_context(search_query)
            if web_results:
                web_context = f"\n\n【連網補充題材與資料】\n{web_results}"

        system = (
            "你是一位頂級資深教育名師與課程講義設計專家。"
            "請根據所提供的教材內容，為學生/學習者設計一份條理分明、重點突出、易於複習的【A4 隨堂講義與學習手冊】。\n\n"
            "【排版與數學公式規範】\n"
            "1. 數學與理化公式：教材中凡涉及任何數學公式、物理定律、化學式、變數或計算式，請務必一律使用標準 LaTeX 格式包裹（行內公式與變數使用 $...$ 例如 `$F=ma$` 或 `$\\vec{F}=m\\vec{a}$`；獨立核心公式使用 $$...$$ 例如 `$$F = G\\frac{m_1 m_2}{r^2}$$` 或 `$$E = mc^2$$`）。切勿使用純文字 ASCII 拼湊排版（例如切勿寫成 F=ma 或 m1m2/r^2）。\n"
            "2. 講義內容結構應扎實：摘要應簡明扼要，核心要點 (key_points) 請條列分明並標記重點，思考題 (discussion_questions) 具啟發性。\n"
            "3. 講義架構應包含：\n"
            "   - 課程總覽 (overview)\n"
            "   - 3~6 個核心章節 (sections)，每章節包含摘要 (summary)、核心要點 (key_points)、思考與討論題 (discussion_questions)，以及出處頁碼 (source_pages)\n"
            "   - 課後核心總結與心智圖綱要 (key_takeaways)\n"
            "請嚴格依指定 JSON 格式輸出。"
        )

        schema = {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "subtitle": {"type": "string"},
                "overview": {"type": "string"},
                "sections": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "summary": {"type": "string"},
                            "key_points": {"type": "array", "items": {"type": "string"}},
                            "discussion_questions": {"type": "array", "items": {"type": "string"}},
                            "source_pages": {"type": "array", "items": {"type": "integer"}},
                        },
                        "required": ["title", "summary", "key_points", "discussion_questions", "source_pages"],
                    },
                },
                "key_takeaways": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["title", "subtitle", "overview", "sections", "key_takeaways"],
        }

        prompt = (
            f"教材名稱：{document.name}\n"
            f"目標對象：{target_audience}\n"
            f"詳細程度：{detail_level}\n"
            f"輸出語言：{language}\n\n"
            f"【教材內容摘要段落】\n{context}"
            f"{web_context}\n\n"
            "請開始生成完整的隨堂講義 JSON。"
        )

        res = self._structured_response(system, prompt, schema)
        sections = []
        for s in res.get("sections", []):
            sections.append(
                HandoutSection(
                    title=s.get("title", ""),
                    summary=s.get("summary", ""),
                    key_points=s.get("key_points", []),
                    discussion_questions=s.get("discussion_questions", []),
                    source_pages=s.get("source_pages", []),
                )
            )

        handout = Handout(
            id=str(uuid.uuid4()),
            document_id=document.id,
            title=res.get("title", document.name.replace(".pdf", "") + " 隨堂學習講義"),
            subtitle=res.get("subtitle", f"適用對象：{target_audience} · 深度備課手冊"),
            overview=res.get("overview", ""),
            sections=sections,
            key_takeaways=res.get("key_takeaways", []),
        )
        return handout

    def refine_slide(
        self,
        slide: Slide,
        instruction: str = "潤飾講稿與要點，使口語表達更自然、生動且具啟發性",
        document: Optional[Document] = None,
    ) -> Slide:
        system = (
            "你是一位頂尖教學演講與簡報口語教練。"
            "請根據使用者的潤飾指示，針對當前單頁投影片的條列重點 (bullets) 與逐頁講稿 (speaker_notes) 進行局部優化與微調。"
            "條列要點請精簡精準 (3~5 點)，講稿請口語自然、生動流暢並點出思考引導。"
        )
        prompt = (
            f"投影片標題：{slide.title}\n"
            f"目前條列重點：{slide.bullets}\n"
            f"目前講稿：{slide.speaker_notes}\n"
            f"潤飾需求指示：{instruction}\n\n"
            "請輸出優化後的條列重點與講稿 JSON。"
        )
        schema = {
            "type": "object",
            "properties": {
                "bullets": {"type": "array", "items": {"type": "string"}},
                "speaker_notes": {"type": "string"},
            },
            "required": ["bullets", "speaker_notes"],
            "additionalProperties": False,
        }
        try:
            res = self._structured_response(system, prompt, schema)
            new_bullets = res.get("bullets") or slide.bullets
            new_notes = res.get("speaker_notes") or slide.speaker_notes
            return Slide(
                title=slide.title,
                bullets=new_bullets,
                speaker_notes=new_notes,
                source_pages=slide.source_pages,
                icon=slide.icon,
                visual_description=slide.visual_description,
                visual_diagram=slide.visual_diagram,
            )
        except Exception as exc:
            logging.getLogger(__name__).warning("投影片 AI 潤飾失敗，保留原講稿: %s", exc)
            return slide

    def regenerate_quiz_question(
        self,
        current_question: QuizQuestion,
        instruction: str = "抽換為同概念但不同情境/題型的新題目",
        difficulty: str = "medium",
        language: str = "zh-TW",
        document: Optional[Document] = None,
    ) -> QuizQuestion:
        context = ""
        if document:
            try:
                retrieved = self.retrieve(document, current_question.question, limit=3)
                context = "\n\n".join(f"[第 {c.page} 頁] {c.text}" for c, _score in retrieved)
            except Exception:
                pass

        system = (
            "你是一位資深命題評量專家。請為教師抽換或重新設計一道高品質評量試題。\n"
            "【規範】：\n"
            "1. 題型 (type)：可為 'single_choice' (單選題, 4 個 options), 'multiple_choice' (多選題), 或 'problem_solving' (計算推導題, options 為空陣列)。\n"
            "2. 公式請使用標準 LaTeX 格式（例如 `$E=mc^2$`）。\n"
            "3. 詳解 (explanation) 須包含完整觀念解析與易錯點分析。"
        )
        prompt = (
            f"原題目：{current_question.question}\n"
            f"原題型：{current_question.type}\n"
            f"難度傾向：{difficulty or current_question.difficulty}\n"
            f"抽換/修改指示：{instruction}\n"
            f"教材背景脈絡：\n{context or '依原題核心知識點衍生新題目'}\n\n"
            "請輸出全新替換題目的 JSON。"
        )
        schema = {
            "type": "object",
            "properties": {
                "type": {"type": "string", "enum": ["single_choice", "multiple_choice", "problem_solving"]},
                "question": {"type": "string"},
                "options": {"type": "array", "items": {"type": "string"}},
                "answer": {"type": "string"},
                "explanation": {"type": "string"},
                "source_pages": {"type": "array", "items": {"type": "integer"}},
                "difficulty": {"type": "string", "enum": ["easy", "medium", "hard"]},
            },
            "required": ["type", "question", "options", "answer", "explanation", "source_pages", "difficulty"],
            "additionalProperties": False,
        }
        res = self._structured_response(system, prompt, schema)
        return QuizQuestion(
            id=current_question.id,
            type=res.get("type", current_question.type),
            question=res.get("question", current_question.question),
            options=res.get("options", current_question.options),
            answer=res.get("answer", current_question.answer),
            explanation=res.get("explanation", current_question.explanation),
            source_pages=res.get("source_pages", current_question.source_pages),
            difficulty=res.get("difficulty", current_question.difficulty),
        )




def make_pptx(deck: Deck) -> bytes:
    from pptx import Presentation
    from pptx.dml.color import RGBColor
    from pptx.enum.shapes import MSO_SHAPE
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
        accent = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(0.18), Inches(7.5))
        accent.fill.solid(); accent.fill.fore_color.rgb = RGBColor(222, 91, 55); accent.line.fill.background()
        number = slide.shapes.add_textbox(Inches(11.9), Inches(0.45), Inches(0.8), Inches(0.4))
        p = number.text_frame.paragraphs[0]; p.text = f"{index + 1:02d}"; p.font.size = Pt(16); p.font.bold = True; p.font.color.rgb = RGBColor(222, 91, 55); p.alignment = PP_ALIGN.RIGHT

        icon_str = getattr(item, "icon", "💡") or "💡"
        title_box = slide.shapes.add_textbox(Inches(0.85), Inches(0.65), Inches(10.8), Inches(1.1))
        p = title_box.text_frame.paragraphs[0]
        p.text = f"{icon_str}  {item.title}"
        p.font.name = "Noto Sans TC"
        p.font.size = Pt(28)
        p.font.bold = True
        p.font.color.rgb = RGBColor(27, 35, 32)

        # 左側重點內容欄位
        body = slide.shapes.add_textbox(Inches(0.85), Inches(1.95), Inches(6.6), Inches(4.8))
        tf = body.text_frame
        tf.word_wrap = True
        font_size = Pt(15) if len(item.bullets) <= 4 else Pt(14)
        for bullet_index, bullet in enumerate(item.bullets):
            p = tf.paragraphs[0] if bullet_index == 0 else tf.add_paragraph()
            p.text = f"• {bullet}"
            p.font.name = "Noto Sans TC"
            p.font.size = font_size
            p.font.color.rgb = RGBColor(55, 65, 61)
            p.space_after = Pt(10)

        # 右側觀念圖解視覺卡片
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.8), Inches(1.95), Inches(4.7), Inches(4.8))
        card.fill.solid()
        card.fill.fore_color.rgb = RGBColor(255, 255, 255)
        card.line.color.rgb = RGBColor(222, 91, 55)
        card.line.width = Pt(1.5)

        vis_diagram = getattr(item, "visual_diagram", {}) or {}
        diagram_type = vis_diagram.get("diagram_type", "flowchart")
        type_titles = {
            "flowchart": "🔄 機制流程推導",
            "comparison": "⚖️ 核心概念對比",
            "key_formula": "🧮 關鍵公式解析",
            "concept_map": "📐 觀念架構圖解",
        }
        card_header_text = type_titles.get(diagram_type, "📐 觀念圖解與推導")

        card_title_box = slide.shapes.add_textbox(Inches(7.95), Inches(2.05), Inches(4.4), Inches(0.45))
        p = card_title_box.text_frame.paragraphs[0]
        p.text = card_header_text
        p.font.name = "Noto Sans TC"
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = RGBColor(222, 91, 55)

        # 提煉結構化推導步驟 (前 2 階段)
        raw_steps = vis_diagram.get("steps", [])
        if raw_steps and isinstance(raw_steps, list):
            diagram_steps = []
            for s in raw_steps[:2]:
                if isinstance(s, dict):
                    diagram_steps.append((s.get("label", "觀念重點"), s.get("text", "")))
                else:
                    diagram_steps.append(("觀念重點", str(s)))
        else:
            diagram_steps = [
                ("① 核心機制", f"聚焦【{item.title}】之根本原理與邏輯架構"),
                ("② 推導關鍵", item.visual_description[:60] if item.visual_description else "依據教材推導並掌握概念關鍵特徵"),
            ]

        step_y_starts = [2.55, 3.75]
        for idx, (lbl, txt) in enumerate(diagram_steps[:2]):
            y_pos = step_y_starts[idx]
            step_bg = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.0), Inches(y_pos), Inches(4.3), Inches(1.05))
            step_bg.fill.solid()
            if idx == 0:
                step_bg.fill.fore_color.rgb = RGBColor(255, 245, 242)
                step_bg.line.color.rgb = RGBColor(222, 91, 55)
            else:
                step_bg.fill.fore_color.rgb = RGBColor(237, 242, 247)
                step_bg.line.color.rgb = RGBColor(74, 85, 104)
            step_bg.line.width = Pt(1.0)

            tf_step = step_bg.text_frame
            tf_step.word_wrap = True
            p_lbl = tf_step.paragraphs[0]
            p_lbl.text = lbl
            p_lbl.font.name = "Noto Sans TC"
            p_lbl.font.size = Pt(11)
            p_lbl.font.bold = True
            p_lbl.font.color.rgb = RGBColor(222, 91, 55) if idx == 0 else RGBColor(74, 85, 104)

            p_txt = tf_step.add_paragraph()
            str_item = str(txt)
            p_txt.text = str_item[:65] + ("..." if len(str_item) > 65 else "")
            p_txt.font.name = "Noto Sans TC"
            p_txt.font.size = Pt(12)
            p_txt.font.color.rgb = RGBColor(45, 55, 72)

        # 底部視覺圖解結論方塊
        vis_bg = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.0), Inches(4.95), Inches(4.3), Inches(1.6))
        vis_bg.fill.solid()
        vis_bg.fill.fore_color.rgb = RGBColor(240, 249, 255)
        vis_bg.line.color.rgb = RGBColor(43, 108, 176)
        vis_bg.line.width = Pt(1.0)

        tf_vis = vis_bg.text_frame
        tf_vis.word_wrap = True
        p_vis_lbl = tf_vis.paragraphs[0]
        p_vis_lbl.text = "💡 核心結論與關鍵理解："
        p_vis_lbl.font.name = "Noto Sans TC"
        p_vis_lbl.font.size = Pt(11)
        p_vis_lbl.font.bold = True
        p_vis_lbl.font.color.rgb = RGBColor(43, 108, 176)

        p_vis_txt = tf_vis.add_paragraph()
        takeaway_text = vis_diagram.get("takeaway") or getattr(item, "visual_description", "") or "深入掌握本單元核心機制與概念推導。"
        p_vis_txt.text = takeaway_text[:95] + ("..." if len(takeaway_text) > 95 else "")
        p_vis_txt.font.name = "Noto Sans TC"
        p_vis_txt.font.size = Pt(11)
        p_vis_txt.font.color.rgb = RGBColor(45, 55, 72)

        notes = slide.notes_slide.notes_text_frame
        notes.text = item.speaker_notes + (f"\n\n資料來源頁碼：{', '.join(map(str, item.source_pages))}" if item.source_pages else "")
    output = io.BytesIO()
    prs.save(output)
    return output.getvalue()


def make_script(deck: Deck) -> str:
    lines = [f"# {deck.title}", "", deck.subtitle, ""]
    for i, slide in enumerate(deck.slides, 1):
        lines.extend([f"## {i}. {slide.title}", "", slide.speaker_notes, "", f"> 教材頁碼：{', '.join(map(str, slide.source_pages)) or '—'}", ""])
    return "\n".join(lines)


def make_quiz_markdown(sheet: QuizSheet, teacher_mode: bool = False) -> str:
    type_labels = {
        "single_choice": "單選題",
        "multiple_choice": "多選題",
        "problem_solving": "計算與推導論述題",
    }
    lines = [
        f"# {sheet.title}",
        "",
        f"> {sheet.description}",
        f"> 建議測驗時間：{sheet.duration_minutes} 分鐘 | 總題數：{len(sheet.questions)} 題",
        "",
        "---",
        "",
    ]
    for idx, q in enumerate(sheet.questions, 1):
        t_name = type_labels.get(q.type, "評量題")
        diff_badge = {"easy": "基礎", "medium": "中等", "hard": "進階"}.get(q.difficulty, "中等")
        lines.append(f"### 第 {idx} 題【{t_name} · 難度：{diff_badge}】")
        lines.append("")
        lines.append(q.question)
        lines.append("")
        if q.options:
            for opt in q.options:
                lines.append(f"- {opt}")
            lines.append("")
        if teacher_mode:
            lines.append(f"**【標準答案】**：`{q.answer}`")
            lines.append("")
            lines.append(f"**【試題詳解】**：{q.explanation}")
            lines.append("")
            pages_str = ", ".join(map(str, q.source_pages)) if q.source_pages else "—"
            lines.append(f"> 教材出處頁碼：第 {pages_str} 頁")
            lines.append("")
            lines.append("---")
            lines.append("")
        else:
            lines.append("> 作答區 / 演算草稿：")
            lines.append("")
            lines.append("```")
            lines.append("")
            lines.append("")
            lines.append("```")
            lines.append("")
            lines.append("---")
            lines.append("")
    return "\n".join(lines)


def make_handout_markdown(handout: Handout) -> str:
    lines = [
        f"# {handout.title}",
        "",
        f"**{handout.subtitle}**",
        "",
        f"> **課程導讀**：{handout.overview}",
        "",
        "---",
        "",
    ]
    for idx, sec in enumerate(handout.sections, 1):
        lines.append(f"## 第 {idx} 單元：{sec.title}")
        lines.append("")
        lines.append(sec.summary)
        lines.append("")
        if sec.key_points:
            lines.append("### 核心要點與關鍵觀念")
            for kp in sec.key_points:
                lines.append(f"- {kp}")
            lines.append("")
        if sec.discussion_questions:
            lines.append("### 隨堂思考與隨堂練習")
            for q in sec.discussion_questions:
                lines.append(f"1. {q}")
            lines.append("")
        if sec.source_pages:
            pages_str = ", ".join(map(str, sec.source_pages))
            lines.append(f"> 出處頁碼：第 {pages_str} 頁")
            lines.append("")
        lines.append("---")
        lines.append("")

    if handout.key_takeaways:
        lines.append("## 課後總結與核心精華 (Takeaways)")
        lines.append("")
        for kw in handout.key_takeaways:
            lines.append(f"- {kw}")
        lines.append("")

    return "\n".join(lines)


def _wrap_bare_latex(text: str) -> str:
    """Auto-wrap bare LaTeX expressions in $...$ if not already wrapped."""
    if not text or "\\" not in text:
        return text
    import re
    parts = re.split(r'(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))', text)
    result = []
    latex_cmd_pattern = re.compile(
        r'(\\(?:vec|frac|sqrt|alpha|beta|gamma|delta|Delta|lambda|Lambda|theta|Theta|omega|Omega|sigma|Sigma|pi|Pi|sum|int|partial|infty|times|cdot|approx|pm|le|ge|neq|equiv|rightarrow|leftarrow|mathbf|mathrm|text|left|right|quad)\b[^\n,，。！？；;]*?(?=[,，。！？；;\s]|$))'
    )
    for i, part in enumerate(parts):
        if i % 2 == 1:
            result.append(part)
        else:
            def _wrap(m):
                s = m.group(0).strip()
                if not s.startswith('$'):
                    return f"${s}$"
                return s
            wrapped = latex_cmd_pattern.sub(_wrap, part)
            result.append(wrapped)
    return "".join(result)


def _format_handout_text(text: str) -> str:
    """Format markdown text in handouts, preserving LaTeX math formulas."""
    if not text:
        return ""
    import re
    import html

    text = _wrap_bare_latex(str(text))

    # 1. Stash Math tokens ($$...$$, $...$, \[...\], \(...\))
    math_tokens = []
    def _stash_math(m):
        idx = len(math_tokens)
        math_tokens.append(m.group(0))
        return f"%%MATHPLACEHOLDER{idx}%%"

    pattern = re.compile(r"(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))")
    processed = pattern.sub(_stash_math, str(text))

    # 2. Escape non-math text
    processed = html.escape(processed)

    # 3. Inline markdown parsing
    processed = re.sub(r"\*\*([^\*\n]+?)\*\*", r"<strong>\1</strong>", processed)
    processed = re.sub(r"__([^_\n]+?)__", r"<strong>\1</strong>", processed)
    processed = re.sub(r"(?<!\*)\*([^\*\n]+?)\*(?!\*)", r"<em>\1</em>", processed)
    processed = re.sub(r"`([^`\n]+?)`", r"<code>\1</code>", processed)
    processed = processed.replace("\n", "<br>")

    # 4. Restore math tokens
    for idx, math_str in enumerate(math_tokens):
        processed = processed.replace(f"%%MATHPLACEHOLDER{idx}%%", math_str)

    return processed


def make_handout_html(handout: Handout) -> str:
    sections_html = ""
    for idx, sec in enumerate(handout.sections, 1):
        points_html = "".join(f"<li>{_format_handout_text(p)}</li>" for p in sec.key_points)
        questions_html = "".join(f"<li>{_format_handout_text(q)}</li>" for q in sec.discussion_questions)
        pages_html = f"<div class='handout-pages'>教材出處：第 {', '.join(map(str, sec.source_pages))} 頁</div>" if sec.source_pages else ""
        sections_html += f"""
        <section class="handout-section">
            <h2>§ {idx}. {_format_handout_text(sec.title)}</h2>
            <p class="section-summary">{_format_handout_text(sec.summary)}</p>
            {f'<div class="box points-box"><h3>📌 核心要點</h3><ul>{points_html}</ul></div>' if points_html else ''}
            {f'<div class="box questions-box"><h3>💬 隨堂思考與練習</h3><ol>{questions_html}</ol></div>' if questions_html else ''}
            {pages_html}
        </section>
        """

    takeaways_html = "".join(f"<li>{_format_handout_text(t)}</li>" for t in handout.key_takeaways)
    title_esc = _format_handout_text(handout.title or "隨堂講義")
    subtitle_esc = _format_handout_text(handout.subtitle or "")
    overview_esc = _format_handout_text(handout.overview or "")

    return f"""<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{handout.title or '隨堂講義'} - A4 隨堂講義</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
<style>
@page {{
    size: A4 portrait;
    margin: 12mm 15mm;
}}
*, *:before, *:after {{
    box-sizing: border-box;
}}
body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans TC", sans-serif;
    color: #1e293b;
    background: #f8fafc;
    margin: 0;
    padding: 20px;
    line-height: 1.6;
}}
.handout-container {{
    max-width: 820px;
    margin: 0 auto;
    background: #ffffff;
    padding: 32px;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.08);
    border: 1px solid #e2e8f0;
}}
.handout-header {{
    border-bottom: 2px solid #2563eb;
    padding-bottom: 12px;
    margin-bottom: 20px;
}}
.handout-title {{
    font-size: 22px;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 6px 0;
}}
.handout-subtitle {{
    font-size: 13px;
    color: #64748b;
    margin: 0;
}}
.handout-overview {{
    background: #eff6ff;
    border-left: 4px solid #2563eb;
    padding: 12px 16px;
    border-radius: 0 6px 6px 0;
    margin-bottom: 20px;
    font-size: 13.5px;
    line-height: 1.6;
}}
.handout-section {{
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px dashed #e2e8f0;
}}
.handout-section:last-of-type {{
    border-bottom: none;
}}
.handout-section h2 {{
    font-size: 16px;
    color: #1e3a8a;
    margin-top: 0;
    margin-bottom: 8px;
}}
.section-summary {{
    font-size: 13.5px;
    color: #334155;
    margin: 6px 0 12px 0;
}}
.box {{
    padding: 10px 14px;
    border-radius: 6px;
    margin: 10px 0;
    font-size: 13px;
}}
.box h3 {{
    margin: 0 0 6px 0;
    font-size: 13.5px;
}}
.box ul, .box ol {{
    margin: 0;
    padding-left: 20px;
}}
.box li {{
    margin-bottom: 4px;
}}
.points-box {{
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #166534;
}}
.points-box h3 {{
    color: #166534;
}}
.questions-box {{
    background: #fffbeb;
    border: 1px solid #fef3c7;
    color: #92400e;
}}
.questions-box h3 {{
    color: #92400e;
}}
.handout-pages {{
    font-size: 11.5px;
    color: #94a3b8;
    text-align: right;
    margin-top: 6px;
}}
.takeaways-box {{
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 14px 18px;
    margin-top: 24px;
}}
.takeaways-box h2 {{
    font-size: 15px;
    margin-top: 0;
    color: #0f172a;
    margin-bottom: 8px;
}}
.takeaways-box ul {{
    margin: 0;
    padding-left: 20px;
    font-size: 13px;
}}
.no-print {{
    margin-bottom: 18px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}}
.btn-print {{
    background: #2563eb;
    color: #fff;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13.5px;
    font-weight: 600;
}}
.btn-print:hover {{
    background: #1d4ed8;
}}
@media print {{
    *, *:before, *:after {{
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        box-sizing: border-box !important;
    }}
    html, body {{
        background: #ffffff !important;
        color: #0f172a !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: auto !important;
        min-height: 100% !important;
        overflow: visible !important;
        position: static !important;
    }}
    .handout-container {{
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
        border: none !important;
        display: block !important;
        position: static !important;
        float: none !important;
    }}
    .no-print {{
        display: none !important;
    }}
    .handout-section {{
        break-inside: auto !important;
        page-break-inside: auto !important;
        margin-bottom: 20px !important;
    }}
    .box, .takeaways-box {{
        break-inside: avoid !important;
        page-break-inside: avoid !important;
    }}
    .katex-display {{
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        overflow-x: visible !important;
    }}
}}
</style>
<script>
var katexOptions = {{
    delimiters: [
        {{left: '$$', right: '$$', display: true}},
        {{left: '$', right: '$', display: false}},
        {{left: '\\\\[', right: '\\\\]', display: true}},
        {{left: '\\\\(', right: '\\\\)', display: false}}
    ],
    throwOnError: false
}};

function unescapeMathInElement(element) {{
    if (!element) return;
    var html = element.innerHTML;
    html = html.replace(/(\\$\\$[\\s\\S]*?\\$\\$|\\$[^$\\n]+?\\$|\\\\\\[[\\s\\S]*?\\\\\\]|\\\\\\([\\s\\S]*?\\\\\\))/g, function(match) {{
        return match
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
    }});
    element.innerHTML = html;
}}

var mathRendered = false;
function doRenderMath() {{
    if (mathRendered) return;
    if (window.renderMathInElement) {{
        try {{
            var container = document.querySelector('.handout-container');
            if (container) {{
                unescapeMathInElement(container);
                renderMathInElement(container, katexOptions);
            }}
            mathRendered = true;
        }} catch(e) {{
            console.warn('KaTeX error:', e);
        }}
    }}
}}

document.addEventListener('DOMContentLoaded', doRenderMath);
window.addEventListener('load', function() {{
    doRenderMath();
    if (document.fonts && document.fonts.ready) {{
        document.fonts.ready.then(function() {{
            console.log('Fonts ready for print');
        }});
    }}
}});

function triggerPrint() {{
    doRenderMath();
    var btn = document.querySelector('.btn-print');
    if (btn) btn.disabled = true;

    var executePrint = function() {{
        setTimeout(function() {{
            window.print();
            if (btn) btn.disabled = false;
        }}, 150);
    }};

    if (document.fonts && document.fonts.ready) {{
        document.fonts.ready.then(executePrint).catch(executePrint);
    }} else {{
        executePrint();
    }}
}}
</script>
</head>
<body>
<div class="handout-container">
    <div class="no-print">
        <button class="btn-print" onclick="triggerPrint()">🖨️ 列印 / 另存為 A4 PDF</button>
    </div>
    <div class="handout-header">
        <h1 class="handout-title">{title_esc}</h1>
        <p class="handout-subtitle">{subtitle_esc}</p>
    </div>
    {f'<div class="handout-overview"><strong>📖 課程導讀：</strong>{overview_esc}</div>' if overview_esc else ''}
    {sections_html}
    {f'<div class="takeaways-box"><h2>💡 課後總結與精華 (Key Takeaways)</h2><ul>{takeaways_html}</ul></div>' if takeaways_html else ''}
</div>
<script>
// 頁面解析時立即嘗試首次渲染
if (window.renderMathInElement) {{
    doRenderMath();
}}
</script>
</body>
</html>
"""


def make_deck_handout_html(deck: Deck) -> str:
    slides_html = ""
    for idx, s in enumerate(deck.slides, 1):
        bullets_html = "".join(f"<li>{_format_handout_text(b)}</li>" for b in s.bullets)
        icon_str = getattr(s, "icon", "💡") or "💡"
        pages_str = f"<div class='handout-pages'>出處頁碼：第 {', '.join(map(str, s.source_pages))} 頁</div>" if s.source_pages else ""
        notes_html = _format_handout_text(s.speaker_notes)
        slides_html += f"""
        <section class="handout-section">
            <h2>{idx}. {icon_str} {_format_handout_text(s.title)}</h2>
            <div class="box points-box">
                <h3>投影片核心重點</h3>
                <ul>{bullets_html}</ul>
            </div>
            <div class="box notes-box">
                <h3>講師詳細解說詞與延伸備課筆記</h3>
                <p>{notes_html}</p>
            </div>
            {pages_str}
        </section>
        """

    title_esc = _format_handout_text(deck.title)
    subtitle_esc = _format_handout_text(f"{deck.subtitle} · 預估講授時間：{deck.duration} 分鐘" if deck.duration else (deck.subtitle or ""))

    return f"""<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{deck.title} - A4 教學講義與演講稿</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
<style>
@page {{
    size: A4 portrait;
    margin: 12mm 15mm;
}}
*, *:before, *:after {{
    box-sizing: border-box;
}}
body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans TC", sans-serif;
    color: #1e293b;
    background: #f8fafc;
    margin: 0;
    padding: 20px;
    line-height: 1.6;
}}
.handout-container {{
    max-width: 800px;
    margin: 0 auto;
    background: #ffffff;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
}}
.handout-header {{
    border-bottom: 2px solid #de5b37;
    padding-bottom: 12px;
    margin-bottom: 20px;
}}
.handout-title {{
    font-size: 22px;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 4px 0;
}}
.handout-subtitle {{
    font-size: 13px;
    color: #64748b;
    margin: 0;
}}
.handout-section {{
    margin-bottom: 25px;
    page-break-inside: avoid;
}}
.handout-section h2 {{
    font-size: 16px;
    color: #9a3412;
    border-bottom: 1px solid #fed7aa;
    padding-bottom: 5px;
    margin-top: 0;
}}
.box {{
    padding: 10px 14px;
    border-radius: 6px;
    margin: 10px 0;
    font-size: 13px;
}}
.box h3 {{
    margin: 0 0 5px 0;
    font-size: 13.5px;
}}
.points-box {{
    background: #fff7ed;
    border: 1px solid #ffedd5;
}}
.points-box h3 {{
    color: #c2410c;
}}
.notes-box {{
    background: #f8fafc;
    border: 1px solid #e2e8f0;
}}
.notes-box h3 {{
    color: #334155;
}}
.notes-box p {{
    margin: 0;
    font-size: 13px;
    color: #475569;
    line-height: 1.6;
}}
.handout-pages {{
    font-size: 11px;
    color: #94a3b8;
    text-align: right;
    margin-top: 4px;
}}
.no-print {{
    margin-bottom: 15px;
    text-align: right;
}}
.btn-print {{
    background: #de5b37;
    color: #fff;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13.5px;
    font-weight: 600;
}}
.btn-print:hover {{
    background: #c2410c;
}}
@media print {{
    *, *:before, *:after {{
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        box-sizing: border-box !important;
    }}
    html, body {{
        background: #ffffff !important;
        color: #0f172a !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: auto !important;
        min-height: 100% !important;
        overflow: visible !important;
        position: static !important;
    }}
    .handout-container {{
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
        border: none !important;
        display: block !important;
        position: static !important;
        float: none !important;
    }}
    .no-print {{
        display: none !important;
    }}
    .handout-section {{
        break-inside: auto !important;
        page-break-inside: auto !important;
    }}
    .box {{
        break-inside: avoid !important;
        page-break-inside: avoid !important;
    }}
    .katex-display {{
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        overflow-x: visible !important;
    }}
}}
</style>
<script>
var katexOptions = {{
    delimiters: [
        {{left: '$$', right: '$$', display: true}},
        {{left: '$', right: '$', display: false}},
        {{left: '\\\\[', right: '\\\\]', display: true}},
        {{left: '\\\\(', right: '\\\\)', display: false}}
    ],
    throwOnError: false
}};

function unescapeMathInElement(element) {{
    if (!element) return;
    var html = element.innerHTML;
    html = html.replace(/(\\$\\$[\\s\\S]*?\\$\\$|\\$[^$\\n]+?\\$|\\\\\\[[\\s\\S]*?\\\\\\]|\\\\\\([\\s\\S]*?\\\\\\))/g, function(match) {{
        return match
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
    }});
    element.innerHTML = html;
}}

var mathRendered = false;
function doRenderMath() {{
    if (mathRendered) return;
    if (window.renderMathInElement) {{
        try {{
            var container = document.querySelector('.handout-container');
            if (container) {{
                unescapeMathInElement(container);
                renderMathInElement(container, katexOptions);
            }}
            mathRendered = true;
        }} catch(e) {{
            console.warn('KaTeX error:', e);
        }}
    }}
}}

document.addEventListener('DOMContentLoaded', doRenderMath);
window.addEventListener('load', function() {{
    doRenderMath();
    if (document.fonts && document.fonts.ready) {{
        document.fonts.ready.then(function() {{
            console.log('Fonts ready for print');
        }});
    }}
}});

function triggerPrint() {{
    doRenderMath();
    var btn = document.querySelector('.btn-print');
    if (btn) btn.disabled = true;

    var executePrint = function() {{
        setTimeout(function() {{
            window.print();
            if (btn) btn.disabled = false;
        }}, 150);
    }};

    if (document.fonts && document.fonts.ready) {{
        document.fonts.ready.then(executePrint).catch(executePrint);
    }} else {{
        executePrint();
    }}
}}
</script>
</head>
<body>
<div class="handout-container">
    <div class="no-print">
        <button class="btn-print" onclick="triggerPrint()">🖨️ 列印 / 另存為 A4 PDF</button>
    </div>
    <div class="handout-header">
        <h1 class="handout-title">{title_esc}</h1>
        <p class="handout-subtitle">{subtitle_esc}</p>
    </div>
    {slides_html}
</div>
<script>
if (window.renderMathInElement) {{
    doRenderMath();
}}
</script>
</body>
</html>
"""



