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


def test_set_provider():
    service = ollama_service()
    info = service.set_provider("ollama_cloud")
    assert info["provider"] == "ollama_cloud"
    assert info["provider_label"] == "Ollama 雲端 API"


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



