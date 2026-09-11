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
    assert len(deck.slides) >= 1
    assert deck.slides[0].speaker_notes != ""


def test_deck_graph_hierarchical_topic_rag():
    service = ollama_service()
    doc = document()
    # 建立多頁且超過 30 個 chunks 的教材
    doc.chunks = [Chunk(f"第 {i+1} 頁之核心觀念推導內容：LaTeX 公式 $E=mc^{i+1}$", i + 1, i) for i in range(35)]
    doc.pages = 35
    service.index(doc)

    prompts = []
    def fake_structured_response(system, prompt, schema):
        prompts.append(prompt)
        if "教材全景摘要" in prompt:
            return {
                "title": "量子物理與相對論",
                "subtitle": "大學生｜45 分鐘",
                "topics": ["質能等價性", "光電效應機制"],
            }
        return {
            "title": "量子物理與相對論",
            "subtitle": "大學生｜45 分鐘",
            "slides": [
                {
                    "title": "質能等價性分析",
                    "bullets": ["靜止質量與能量的轉換關係 $E=mc^2$", "核反應中的質量虧損計算", "相對論力學效應與高速粒子驗證"],
                    "speaker_notes": "各位好，今天我們探討愛因斯坦最著名的質能等價關係式 $E=mc^2$。這揭示了質量本質上就是高度凝聚的能量形態。",
                    "source_pages": [1, 2],
                    "icon": "⚡",
                    "visual_description": "質能轉換示意圖與核反應質量虧損推導架構",
                },
                {
                    "title": "光電效應機制",
                    "bullets": ["光子能量與功函數臨界關係 $hf = W + K_{max}$", "截止電壓與光電子動能測量", "量子化光子假說對經典電磁學的突破"],
                    "speaker_notes": "接著看光電效應實驗。經典電磁學無法解釋為何截止電壓僅與頻率相關，而愛因斯坦提出光子量子化假說完美解釋了該現象。",
                    "source_pages": [3, 4],
                    "icon": "💡",
                    "visual_description": "光電管實驗裝置與能量截止曲線圖表",
                },
            ],
        }

    service._structured_response = fake_structured_response

    deck = service.generate_deck(doc, "大學生", "清晰嚴謹", 2, 45, handout_text="# 物理講義\n## 課程總覽\n探討近代物理兩大支柱。")

    assert deck.title == "量子物理與相對論"
    assert len(deck.slides) == 2
    assert "E=mc^2" in deck.slides[0].bullets[0]
    assert deck.slides[0].source_pages == [1, 2]
    assert deck.slides[1].source_pages == [3, 4]
    assert any("【教學核心母本（講義結構與深度論述依據）】" in p for p in prompts)


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


def test_deck_graph_audit_quality_and_completion():
    service = ollama_service()
    
    def fake_structured_response(system, prompt, schema):
        if "教材全景摘要" in prompt:
            return {"title": "大綱標題", "subtitle": "副標", "topics": ["主題一"]}
        return {
            "title": "測試簡報",
            "subtitle": "副標題",
            "slides": [
                {
                    "title": "主題一",
                    "bullets": [],
                    "speaker_notes": "短",
                    "source_pages": [1],
                }
            ],
        }

    service._structured_response = fake_structured_response

    deck = service.generate_deck(document(), "大學生", "清楚易懂", 1, 30)
    assert len(deck.slides[0].bullets) >= 1
    assert len(deck.slides[0].speaker_notes) >= 30


def test_deck_graph_with_web_search(monkeypatch):
    service = ollama_service()
    
    # 模擬 DDGS 傳回搜尋結果
    class FakeDDGS:
        def __init__(self, timeout=10):
            pass
        def text(self, query, max_results=3):
            return [{"title": "最新案例標題", "body": "網路補充內容摘要", "href": "https://example.com"}]

    monkeypatch.setattr("app.workflows.deck_graph.DDGS", FakeDDGS)

    systems = []
    prompts = []
    def fake_structured_response(system, prompt, schema):
        systems.append(system)
        prompts.append(prompt)
        if "教材全景摘要" in prompt:
            return {
                "title": "網路補充測試簡報",
                "subtitle": "副標題",
                "topics": ["主題一"],
            }
        return {
            "title": "網路補充測試簡報",
            "subtitle": "副標題",
            "slides": [
                {
                    "title": "主題一",
                    "bullets": ["重點 1"],
                    "speaker_notes": "這是極度詳細且內容完整的講稿，包含網路案例說明。",
                    "source_pages": [1],
                }
            ],
        }

    service._structured_response = fake_structured_response

    deck = service.generate_deck(document(), "大學生", "清楚易懂", 1, 30, enable_web_search=True)

    # 驗證系統提示詞包含批次產出指示
    assert any("一次性批次產出" in s for s in systems)
    # 驗證 user_prompt 包含網路補充案例參考
    assert any("網路補充案例參考" in p for p in prompts)
    assert deck.title == "網路補充測試簡報"


def test_deck_graph_target_language():
    service = ollama_service()
    systems = []
    def fake_structured_response(system, prompt, schema):
        systems.append(system)
        if "教材全景摘要" in prompt:
            return {
                "title": "English Presentation Title",
                "subtitle": "English Subtitle",
                "topics": ["Topic One"],
            }
        return {
            "title": "English Presentation Title",
            "subtitle": "English Subtitle",
            "slides": [
                {
                    "title": "Topic One",
                    "bullets": ["Point 1", "Point 2"],
                    "speaker_notes": "This is a detailed speaker note in English.",
                    "source_pages": [1],
                }
            ],
        }

    service._structured_response = fake_structured_response

    deck = service.generate_deck(document(), "大學生", "清楚易懂", 1, 30, language="en")
    assert any("strictly in English" in s for s in systems)
    assert deck.title == "English Presentation Title"


def test_deck_graph_target_language_auto():
    service = ollama_service()
    systems = []
    def fake_structured_response(system, prompt, schema):
        systems.append(system)
        if "教材全景摘要" in prompt:
            return {
                "title": "Auto Lang Title",
                "subtitle": "Auto Subtitle",
                "topics": ["Auto Topic"],
            }
        return {
            "title": "Auto Lang Title",
            "subtitle": "Auto Subtitle",
            "slides": [
                {
                    "title": "Auto Topic",
                    "bullets": ["Auto point 1"],
                    "speaker_notes": "Auto speaker note",
                    "source_pages": [1],
                }
            ],
        }

    service._structured_response = fake_structured_response

    deck = service.generate_deck(document(), "大學生", "清楚易懂", 1, 30, language="auto")
    assert any("請自動識別教材主要語言" in s for s in systems)
    assert deck.title == "Auto Lang Title"


def test_company_router_intent_classification():
    from app.workflows.router import classify_intent_node

    # 1. 測試課程賣點/亮點意圖 -> marketing
    res1 = classify_intent_node({"input_query": "請幫我梳理這份數位課程的核心賣點與亮點介紹"})
    assert res1["target_department"] == "marketing"
    assert res1["matched_skill"] == "saas_marketing"

    # 2. 測試教學心得/經驗文章意圖 -> marketing
    res2 = classify_intent_node({"input_query": "請幫我撰寫一篇分享翻轉課堂實務心得的教學經驗文章"})
    assert res2["target_department"] == "marketing"
    assert res2["matched_skill"] == "saas_marketing"

    # 3. 測試教案/試題意圖 -> academic
    res3 = classify_intent_node({"input_query": "幫我設計 45 分鐘國中理化教案"})
    assert res3["target_department"] == "academic"


def test_quiz_graph_execution():
    from app.workflows import build_quiz_graph
    from app.models import Chunk, Document

    service = ollama_service()
    doc = Document(
        id="doc-quiz",
        name="量子力學與相對論",
        pages=5,
        chunks=[Chunk(f"第 {i+1} 頁內容：光電效應與質能方程", i + 1, i) for i in range(5)],
        size_bytes=500,
    )
    service.index(doc)

    prompts = []
    def fake_structured_response(system, prompt, schema):
        prompts.append(prompt)
        if "教材全景內容摘要" in prompt or "考點方向" in prompt:
            return {
                "title": "物理核心概念小考",
                "description": "測驗光電效應與相對論考點",
                "focal_topics": ["光電效應截止電壓", "質能守恆計算"],
            }
        return {
            "title": "物理核心概念小考",
            "description": "測驗光電效應與相對論考點",
            "questions": [
                {
                    "type": "single_choice",
                    "question": "光電效應中，截止電壓與入射光的何者成正比？",
                    "options": ["A. 頻率", "B. 強度", "C. 照射時間", "D. 入射角"],
                    "answer": "A",
                    "explanation": "依據愛因斯坦光電方程 e*Vs = hf - W，截止電壓與頻率成線性關係。",
                    "source_pages": [1, 2],
                    "difficulty": "medium",
                },
                {
                    "type": "problem_solving",
                    "question": "請計算靜止質量為 1kg 的物質完全轉化為能量時的數值。",
                    "options": [],
                    "answer": "9 * 10^16 焦耳",
                    "explanation": "依據 E=mc^2 計算。",
                    "source_pages": [3],
                    "difficulty": "hard",
                },
            ],
        }

    service._structured_response = fake_structured_response

    quiz_graph = build_quiz_graph()
    state = {
        "document": doc,
        "question_count": 2,
        "difficulty": "medium",
        "language": "zh-TW",
        "enable_web_search": False,
        "handout_text": "# 講義\n## 光電效應與質能",
        "ai_service": service,
    }
    result = quiz_graph.invoke(state)
    sheet = result["quiz_sheet"]

    assert sheet.title == "物理核心概念小考"
    assert len(sheet.questions) == 2
    assert sheet.questions[0].answer == "A"
    assert sheet.questions[0].source_pages == [1, 2]


def test_quiz_graph_with_web_search(monkeypatch):
    from app.workflows import build_quiz_graph

    service = ollama_service()
    doc = document()

    class FakeDDGS:
        def __init__(self, timeout=10): pass
        def text(self, query, max_results=3):
            return [{"title": "全國大考經典試題", "body": "112年學測物理多選題題型彙整"}]

    monkeypatch.setattr("app.workflows.quiz_graph.DDGS", FakeDDGS)

    systems = []
    prompts = []
    def fake_structured_response(system, prompt, schema):
        systems.append(system)
        prompts.append(prompt)
        if "考點方向" in prompt:
            return {
                "title": "聯網考古題綜合評量",
                "description": "結合大考經典試題之評量",
                "focal_topics": ["向量檢索考點"],
            }
        return {
            "type": "multiple_choice",
            "question": "下列哪些屬於向量空間中的度量方法？",
            "options": ["A. 餘弦相似度", "B. 歐式距離", "C. 曼哈頓距離", "D. 隨機雜湊"],
            "answer": "A, B, C",
            "explanation": "餘弦、歐式與曼哈頓距離皆為幾何空間標準度量。",
            "source_pages": [1],
            "difficulty": "hard",
        }

    service._structured_response = fake_structured_response

    quiz_graph = build_quiz_graph()
    state = {
        "document": doc,
        "question_count": 1,
        "difficulty": "hard",
        "language": "zh-TW",
        "enable_web_search": True,
        "ai_service": service,
    }
    result = quiz_graph.invoke(state)
    sheet = result["quiz_sheet"]

    assert sheet.title == "聯網考古題綜合評量"
    assert len(sheet.questions) == 1
    assert any("參考經典題型資料" in p for p in prompts)




