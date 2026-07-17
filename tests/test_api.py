from fastapi.testclient import TestClient

from app.main import app


def test_health_exposes_configured_models():
    response = TestClient(app).get("/api/health")

    assert response.status_code == 200
    assert response.json()["provider"] in {"ollama", "openai"}
    assert response.json()["generation_model"]
    assert response.json()["embedding_model"]


def test_demo_endpoint_is_removed():
    paths = TestClient(app).get("/openapi.json").json()["paths"]

    assert "/api/demo" not in paths
