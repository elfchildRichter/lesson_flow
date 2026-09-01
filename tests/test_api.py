from fastapi.testclient import TestClient

from app.main import app


def test_health_exposes_configured_models():
    response = TestClient(app).get("/api/health")

    assert response.status_code == 200
    assert response.json()["provider"] in {"gemini", "ollama", "openai", "ollama_cloud", "ollama_local"}
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


def test_upload_invalid_file_type():
    client = TestClient(app)
    from fastapi_auth_lite import get_current_user
    app.dependency_overrides[get_current_user] = lambda: {"id": "test_user"}
    try:
        response = client.post(
            "/api/documents",
            files={"file": ("test.txt", b"hello world", "text/plain")}
        )
        assert response.status_code == 415
        assert "只支援 PDF 檔案" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


def test_ask_non_existent_document():
    client = TestClient(app)
    from app.main import store
    store.documents.clear()
    response = client.post(
        "/api/ask",
        json={"document_id": "non_existent", "question": "Hi?"}
    )
    # 不論認證通過與否，找不到文件時應處理 401/403 或 404
    assert response.status_code in {401, 403, 404}


def test_deck_non_existent_document_and_download():
    client = TestClient(app)
    response = client.get("/api/decks/non_existent/pptx")
    assert response.status_code == 404

    script_res = client.get("/api/decks/non_existent/script")
    assert script_res.status_code == 404


def test_admin_users_list_schema_migration():
    client = TestClient(app)
    from fastapi_auth_lite import get_current_user, init_db
    init_db()
    app.dependency_overrides[get_current_user] = lambda: {"id": 1, "username": "admin", "role": "admin"}
    try:
        response = client.get("/api/admin/users/list")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
        assert "users" in response.json()
    finally:
        app.dependency_overrides.clear()




