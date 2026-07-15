from fastapi.testclient import TestClient

from app.main import app


def test_demo_workflow():
    client = TestClient(app)
    document = client.post("/api/demo").json()

    answer = client.post(
        "/api/ask",
        json={"document_id": document["id"], "question": "RAG 是什麼？"},
    )
    assert answer.status_code == 200
    assert answer.json()["sources"][0]["page"] == 4

    response = client.post(
        "/api/decks",
        json={
            "document_id": document["id"],
            "audience": "大學生",
            "tone": "清楚易懂",
            "slide_count": 8,
            "duration": 30,
        },
    )
    assert response.status_code == 200
    deck = response.json()
    assert len(deck["slides"]) == 8
    assert len(client.get(f"/api/decks/{deck['id']}/pptx").content) > 10_000
    assert client.get(f"/api/decks/{deck['id']}/script").status_code == 200
