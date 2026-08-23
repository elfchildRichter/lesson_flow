from fastapi.testclient import TestClient

from app.main import app


def test_health_exposes_configured_models():
    response = TestClient(app).get("/api/health")

    assert response.status_code == 200
    assert response.json()["provider"] in {"ollama", "openai", "ollama_cloud", "ollama_local"}
    assert response.json()["generation_model"]
    assert response.json()["embedding_model"]


def test_demo_endpoint_is_removed():
    paths = TestClient(app).get("/openapi.json").json()["paths"]

    assert "/api/demo" not in paths


def test_provider_get_and_post():
    client = TestClient(app)
    get_res = client.get("/api/provider")
    assert get_res.status_code == 200
    assert "provider" in get_res.json()

    post_res = client.post("/api/provider", json={"provider": "ollama_cloud"})
    assert post_res.status_code == 200
    assert post_res.json()["status"] == "ok"
    assert post_res.json()["provider"] == "ollama_cloud"

    # 測試切換至未啟動的本機服務應回傳 400 與安裝/啟動提示
    local_res = client.post("/api/provider", json={"provider": "ollama_local"})
    if local_res.status_code == 400:
        assert "未偵測到 Ollama 本機服務" in local_res.json()["detail"]


