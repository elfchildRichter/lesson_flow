from app.services import AIService, DocumentStore, demo_document


def test_demo_retrieval_finds_rag(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    service = AIService()
    document = demo_document()
    matches = service.retrieve(document, "什麼是檢索增強生成 RAG？")
    assert matches[0][0].page == 4


def test_local_deck_has_requested_slide_count(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    service = AIService()
    deck = service.generate_deck(demo_document(), "高中生", "活潑", 8, 30)
    assert len(deck.slides) == 8
    assert deck.mode == "local"
    assert all(slide.speaker_notes for slide in deck.slides)

