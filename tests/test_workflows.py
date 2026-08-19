from types import SimpleNamespace
from app.models import Chunk, Document
from app.services import AIService
from app.workflows import build_qa_graph, build_deck_graph
from tests.test_services import ollama_service, document


def test_qa_graph_fallback_when_irrelevant():
    service = ollama_service()
    doc = document()
    # 手動將文件向量設為空的或無相關
    doc.chunks = [Chunk("無關的背景資訊", 1, 0)]
    doc.vectors = [[0.0, 0.0]]

    answer, sources, mode = service.ask(doc, "無關的測試問題", enable_web_search=False)

    assert "教材中未提及此內容" in answer
    assert sources == []


def test_deck_graph_multi_stage_execution():
    service = ollama_service()
    service._structured_response = lambda _system, _prompt, _schema: {
        "title": "LangGraph 重構課程",
        "subtitle": "大學生｜30 分鐘",
        "topics": ["主題一", "主題二"],
        "slides": [
            {
                "title": "單元一",
                "bullets": ["重點一", "重點二"],
                "speaker_notes": "這是極度詳細且內容完整的講稿，超過適當字數。",
                "source_pages": [1],
            }
        ],
    }

    deck = service.generate_deck(document(), "大學生", "專業嚴謹", 4, 30, enable_web_search=False)

    assert deck.title == "LangGraph 重構課程"
    assert len(deck.slides) == 1
    assert deck.slides[0].speaker_notes != ""
