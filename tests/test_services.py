from types import SimpleNamespace

from app.models import Chunk, Document
from app.services import AIService


class FakeVectors(list):
    def tolist(self):
        return list(self)


class FakeEmbedder:
    @staticmethod
    def _vector(text):
        return [1.0, 0.0] if "RAG" in text or "檢索" in text else [0.0, 1.0]

    def encode_document(self, texts, **_kwargs):
        return FakeVectors([self._vector(text) for text in texts])

    def encode_query(self, texts, **_kwargs):
        return FakeVectors([self._vector(text) for text in texts])

    encode = encode_document


class FakeOllama:
    def chat(self, **_kwargs):
        return SimpleNamespace(message=SimpleNamespace(content="RAG 會先檢索教材，再根據片段回答。（第 2 頁）"))


from app.workflows import build_deck_graph, build_qa_graph


def ollama_service():
    service = AIService.__new__(AIService)
    service.provider = "ollama"
    service.model = "test-model"
    service.embedding_model = "test-embedding"
    service.openai = None
    service.gemini_client = None
    service.gemini_api_key = ""
    service.ollama = FakeOllama()
    service._embedder = FakeEmbedder()
    service.qa_graph = build_qa_graph()
    service.deck_graph = build_deck_graph()
    return service


def document():
    return Document(
        id="doc",
        name="教材.pdf",
        pages=2,
        chunks=[
            Chunk("一般課程介紹", 1, 0),
            Chunk("RAG 先檢索可信文件，再交給模型生成答案。", 2, 1),
        ],
        size_bytes=100,
    )


def test_huggingface_embeddings_drive_retrieval():
    service = ollama_service()
    doc = document()
    service.index(doc)

    matches = service.retrieve(doc, "什麼是 RAG？")

    assert doc.vectors == [[0.0, 1.0], [1.0, 0.0]]
    assert matches[0][0].page == 2


def test_ollama_generates_answer_with_sources():
    service = ollama_service()
    doc = document()
    service.index(doc)

    answer, sources, mode = service.ask(doc, "什麼是 RAG？")

    assert "第 2 頁" in answer
    assert sources[0].page == 2
    assert mode == "ollama"


def test_ollama_deck_uses_structured_model_output():
    service = ollama_service()
    service._structured_response = lambda _system, _prompt, _schema: {
        "title": "RAG 入門",
        "subtitle": "高中生｜20 分鐘",
        "slides": [
            {
                "title": f"單元 {index}",
                "bullets": ["重點一", "重點二"],
                "speaker_notes": "逐頁講稿",
                "source_pages": [2],
            }
            for index in range(4)
        ],
    }

    deck = service.generate_deck(document(), "高中生", "活潑", 4, 20)

    assert len(deck.slides) == 4
    assert deck.mode == "ollama"
    assert all(slide.speaker_notes for slide in deck.slides)


def test_set_provider_gemini():
    service = ollama_service()
    info = service.set_provider("gemini")
    assert info["provider"] == "gemini"
    assert info["provider_label"] == "Gemini 雲端 API"
    assert info["generation_model"] == "gemini-3.6-flash"
    assert info["embedding_model"] == "gemini-embedding-2"


def test_vision_page_to_markdown():
    service = ollama_service()
    # 測試即使傳入無效影像，亦能安全傳回空字串不遺失程序
    res = service._vision_page_to_markdown(b"fake-image-bytes")
    assert isinstance(res, str)



def test_parse_json_response_with_think_tags():
    from app.services import _parse_json_response
    raw = "<think>思考中... 需要規劃簡報內容。</think>\n```json\n{\"title\": \"測試標題\", \"slides\": []}\n```"
    res = _parse_json_response(raw)
    assert res["title"] == "測試標題"

    # 測試未閉合的 think 標籤
    raw_unclosed = "<think>思考中未閉合\n{\"title\": \"未閉合測試\"}"
    res2 = _parse_json_response(raw_unclosed)
    assert res2["title"] == "未閉合測試"


def test_structured_response_fallback():
    service = ollama_service()
    calls = []
    def fake_chat(model, messages, format, stream, options):
        calls.append(format)
        if isinstance(format, dict):
            raise Exception("400 Bad Request: dict format not supported")
        return SimpleNamespace(message=SimpleNamespace(content='{"title": "備援成功"}'))

    service.ollama.chat = fake_chat
    res = service._structured_response("system", "prompt", {"type": "object"})

    assert len(calls) == 2
    assert calls[0] == {"type": "object"}
    assert calls[1] == "json"
    assert res["title"] == "備援成功"


def test_parse_pdf_multimodal_parallel(monkeypatch):
    import os
    from app.services import parse_pdf

    monkeypatch.setenv("ENABLE_MULTIMODAL_PARSING", "true")
    monkeypatch.setenv("MULTIMODAL_MAX_WORKERS", "4")

    # 模擬 PyMuPDF Document 與 Pages
    class FakePage:
        def __init__(self, idx):
            self.idx = idx
        def get_pixmap(self, dpi=200):
            class FakePix:
                def tobytes(self, fmt):
                    return f"img-{self.idx}".encode()
            pix = FakePix()
            pix.idx = self.idx
            return pix
        def get_text(self):
            return f"Page {self.idx} text"

    class FakePyMuPDFDoc:
        def __init__(self, count=5):
            self.pages = [FakePage(i) for i in range(1, count + 1)]
        def __len__(self):
            return len(self.pages)
        def __iter__(self):
            return iter(self.pages)

    # 模擬 PyMuPDF open
    fake_pymupdf = SimpleNamespace(open=lambda stream, filetype: FakePyMuPDFDoc(5))
    monkeypatch.setitem(__import__("sys").modules, "pymupdf", fake_pymupdf)

    service = ollama_service()
    service._vision_page_to_markdown = lambda img_bytes: f"Vision Markdown content for {img_bytes.decode()}"

    doc = parse_pdf(b"%PDF-test", "test_multipage.pdf", ai_service=service)

    assert doc.pages == 5
    assert len(doc.chunks) == 5
    for i, chunk in enumerate(doc.chunks, 1):
        assert chunk.page == i
        assert f"img-{i}" in chunk.text


def test_prepare_openai_strict_schema():
    from app.services import _prepare_openai_strict_schema
    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "slides": {
                "type": "array",
                "minItems": 5,
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                    },
                },
            },
        },
    }
    cleaned = _prepare_openai_strict_schema(schema)
    assert cleaned["additionalProperties"] is False
    assert cleaned["required"] == ["title", "slides"]
    assert "minItems" not in cleaned["properties"]["slides"]
    assert cleaned["properties"]["slides"]["items"]["additionalProperties"] is False


def test_openai_text_and_structured_response():
    service = ollama_service()
    service.provider = "openai"
    service.model = "gpt-4o-mini"
    
    chat_calls = []

    class FakeChatCompletions:
        def create(self, model, messages, **kwargs):
            chat_calls.append((model, messages, kwargs))
            if "response_format" in kwargs:
                return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content='{"title": "OpenAI 簡報"}'))])
            return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content="OpenAI 文字回應"))])

    class FakeOpenAI:
        chat = SimpleNamespace(completions=FakeChatCompletions())

    service.openai = FakeOpenAI()

    # 測試 _text_response
    text_res = service._text_response("system", "prompt")
    assert text_res == "OpenAI 文字回應"

    # 測試 _structured_response
    struct_res = service._structured_response("system", "prompt", {"type": "object", "properties": {"title": {"type": "string"}}})
    assert struct_res["title"] == "OpenAI 簡報"
    assert len(chat_calls) == 2


def test_page_needs_vision():
    from app.services import _page_needs_vision

    class PageNoImg:
        def get_images(self):
            return []

    class PageWithImg:
        def get_images(self):
            return [("img1",)]

    # 1. 純長文字 -> 不需要 Vision
    pure_text = "這是一段非常標準的中文教學文字，內容包含歷史與社會學概念介紹，完全沒有任何複雜公式與圖片。" * 2
    assert _page_needs_vision(PageNoImg(), pure_text) is False

    # 2. 含有圖片 -> 需要 Vision
    assert _page_needs_vision(PageWithImg(), pure_text) is True

    # 3. 含有 LaTeX/數學符號 -> 需要 Vision
    math_text = "請計算以下幾何公式：當邊長為 a 時，斜邊長為 \\sqrt{a^2 + b^2} 並且滿足勾股定理。" * 2
    assert _page_needs_vision(PageNoImg(), math_text) is True

    unicode_math = "當溫度升高 ±5℃ 時，能量變化為 E = hν。" * 2
    assert _page_needs_vision(PageNoImg(), unicode_math) is True

    # 4. 含有表格結構 -> 需要 Vision
    table_text = "| 項目 | 數量 |\n| --- | --- |\n| 蘋果 | 10 |" * 2
    assert _page_needs_vision(PageNoImg(), table_text) is True

    # 5. 文字過少 (圖片/掃描頁) -> 需要 Vision
    short_text = "頁碼 1"
    assert _page_needs_vision(PageNoImg(), short_text) is True


def test_parse_pdf_smart_routing(monkeypatch):
    from app.services import parse_pdf

    monkeypatch.setenv("ENABLE_MULTIMODAL_PARSING", "true")
    monkeypatch.setenv("ENABLE_SMART_ROUTING", "true")

    vision_calls = []

    class FakePage1:
        def get_images(self): return []
        def get_pixmap(self, dpi=200): return SimpleNamespace(tobytes=lambda fmt: b"img1")
        def get_text(self): return "這是一段很長很長的純文字教學內容，專門用來測試智慧分流純文字管道。歷史課本第一章節介紹。" * 2

    class FakePage2:
        def get_images(self): return []
        def get_pixmap(self, dpi=200): return SimpleNamespace(tobytes=lambda fmt: b"img2")
        def get_text(self): return "數學第二章：請計算微分方程 \\int_0^\\infty e^{-x} dx 的極限值。" * 2

    class FakePyMuPDFDoc:
        def __init__(self):
            self.pages = [FakePage1(), FakePage2()]
        def __len__(self): return len(self.pages)
        def __iter__(self): return iter(self.pages)

    fake_pymupdf = SimpleNamespace(open=lambda stream, filetype: FakePyMuPDFDoc())
    monkeypatch.setitem(__import__("sys").modules, "pymupdf", fake_pymupdf)

    service = ollama_service()

    def fake_vision(img_bytes):
        vision_calls.append(img_bytes)
        return f"Vision result for {img_bytes.decode()}"

    service._vision_page_to_markdown = fake_vision

    doc = parse_pdf(b"%PDF-test", "test_smart_routing.pdf", ai_service=service)

    assert doc.pages == 2
    # 只有 Page 2 (含公式) 觸發 Vision，Page 1 走純文字 Fast Path
    assert len(vision_calls) == 1
    assert vision_calls[0] == b"img2"
    assert "歷史課本第一章節" in doc.chunks[0].text
    assert "Vision result for img2" in doc.chunks[1].text






