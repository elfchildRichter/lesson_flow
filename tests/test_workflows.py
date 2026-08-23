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


def test_qa_graph_hallucination_check_and_retry():
    service = ollama_service()
    doc = document()
    service.index(doc)

    text_prompts = []
    def fake_text_response(system, prompt):
        text_prompts.append(prompt)
        return "RAG 是檢索增強生成（第 2 頁）"
    
    service._text_response = fake_text_response

    structured_calls = []
    def fake_structured_response(system, prompt, schema):
        structured_calls.append(prompt)
        if len(structured_calls) == 1:
            return {"is_grounded": False, "reason": "出現未提及的捏造資訊"}
        return {"is_grounded": True, "reason": "對齊教材"}
    
    service._structured_response = fake_structured_response

    answer, sources, mode = service.ask(doc, "什麼是 RAG？")

    # 驗證 text_response 被呼叫了 2 次（包含 1 次重試）
    assert len(text_prompts) == 2
    # 驗證第二次呼叫帶有修正提示
    assert "修正提示" in text_prompts[1]
    assert "出現未提及的捏造資訊" in text_prompts[1]


def test_deck_graph_audit_feedback_retry():
    service = ollama_service()
    
    prompts = []
    def fake_structured_response(system, prompt, schema):
        prompts.append(prompt)
        if "預定大綱標題" in prompt:
            notes = "短" if len(prompts) == 2 else "這是經過品質精進優化後的超詳細逐頁講稿說明內容。"
            return {
                "title": "測試簡報",
                "subtitle": "副標題",
                "slides": [
                    {
                        "title": "主題一",
                        "bullets": ["重點 1"],
                        "speaker_notes": notes,
                        "source_pages": [1],
                    }
                ],
            }
        return {"title": "大綱標題", "subtitle": "副標", "topics": ["主題一"]}

    service._structured_response = fake_structured_response

    deck = service.generate_deck(document(), "大學生", "清楚易懂", 1, 30)

    # 驗證 prompt 紀錄：包含了第二次 generate_contents 帶入的品質優化要求
    assert any("【品質優化要求】" in p for p in prompts)
    assert deck.slides[0].speaker_notes == "這是經過品質精進優化後的超詳細逐頁講稿說明內容。"

