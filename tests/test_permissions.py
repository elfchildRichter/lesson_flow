from fastapi.testclient import TestClient
import pytest
import os
import sqlite3
from fastapi_auth_core import get_current_user
from app.main import app, get_user_tier_and_role
from app.tiers import get_tier_config

client = TestClient(app)


def test_user_tier_and_role_lookup():
    user_trial = {"user_id": 9991, "username": "test_trial_user", "role": "user", "tier": "teacher_trial"}
    tier_key, role = get_user_tier_and_role(user_trial)
    assert tier_key == "teacher_trial"
    assert role == "user"

    user_admin = {"user_id": 9992, "username": "test_admin_user", "role": "admin", "tier": "admin"}
    tier_key_admin, role_admin = get_user_tier_and_role(user_admin)
    assert tier_key_admin == "admin"
    assert role_admin == "admin"


def test_upload_document_size_limit():
    trial_user = {"id": 101, "username": "trial_teacher", "role": "user", "tier": "teacher_trial"}
    app.dependency_overrides[get_current_user] = lambda: trial_user

    # Attempt to upload 15MB file (exceeding 10MB limit for teacher_trial)
    big_content = b"%PDF-1.4 " + b"0" * (15 * 1024 * 1024)
    response = client.post(
        "/api/documents",
        files={"file": ("large_lesson.pdf", big_content, "application/pdf")},
    )
    assert response.status_code == 413
    assert "上傳檔案上限為 10 MB" in response.json()["detail"]

    app.dependency_overrides.clear()


def test_user_me_profile_endpoint():
    pro_user = {"id": 202, "username": "pro_teacher", "role": "user", "tier": "teacher_pro"}
    app.dependency_overrides[get_current_user] = lambda: pro_user

    response = client.get("/api/user/me")
    assert response.status_code == 200
    data = response.json()
    assert data["tier"] == "teacher_pro"
    assert data["tier_info"]["deck_daily_limit"] == 10
    assert data["tier_info"]["ask_daily_limit"] == 50
    assert data["tier_info"]["enable_web_search"] is True

    app.dependency_overrides.clear()


def test_web_search_permission_override(monkeypatch):
    import time
    uid = int(time.time() * 1000) % 1000000 + 8000
    trial_user = {"id": uid, "username": f"trial_user_web_{uid}", "role": "user", "tier": "teacher_trial"}
    app.dependency_overrides[get_current_user] = lambda: trial_user

    from app.main import store, ai
    from app.models import Document, Chunk
    doc = Document(id="doc_test_perm", name="TestDoc", pages=1, chunks=[Chunk(text="Content", page=1, index=0)], size_bytes=100)
    store.add(doc)

    passed_web_search = []
    def mock_ask(document, question, enable_web_search):
        passed_web_search.append(enable_web_search)
        return "Mocked answer", [], "rag"

    monkeypatch.setattr(ai, "ask", mock_ask)

    response = client.post(
        "/api/ask",
        json={"document_id": "doc_test_perm", "question": "這課要教什麼？", "enable_web_search": True}
    )
    assert response.status_code == 200
    assert passed_web_search[0] is False

    app.dependency_overrides.clear()


def test_institution_tier_permissions():
    inst_user = {"id": 505, "username": "school_admin", "role": "user", "tier": "institution"}
    app.dependency_overrides[get_current_user] = lambda: inst_user

    # 1. Profile check
    response = client.get("/api/user/me")
    assert response.status_code == 200
    data = response.json()
    assert data["tier"] == "institution"
    assert data["tier_info"]["deck_daily_limit"] == 100
    assert data["tier_info"]["ask_daily_limit"] == 500
    assert data["tier_info"]["max_upload_mb"] == 100
    assert "operations" in data["tier_info"]["allowed_departments"]
    assert "devops" not in data["tier_info"]["allowed_departments"]

    # 2. Dispatch check to operations (allowed for institution)
    from app.workflows.router import company_router
    state_ops = company_router.invoke({
        "input_query": "查詢學校與機構團體授權合約",
        "payload": {
            "query": "查詢學校與機構團體授權合約",
            "user_info": {
                "role": "user",
                "tier": get_tier_config("institution", "user")
            }
        }
    })
    assert state_ops.get("result", {}).get("status") == "success"

    # 3. Dispatch check to devops (forbidden for institution -> requires admin)
    state_devops = company_router.invoke({
        "input_query": "排查 Railway OOM 記憶體溢出",
        "payload": {
            "query": "排查 Railway OOM 記憶體溢出",
            "user_info": {
                "role": "user",
                "tier": get_tier_config("institution", "user")
            }
        }
    })
    assert state_devops.get("result", {}).get("status") == "forbidden"
    assert "權限限制" in state_devops.get("result", {}).get("data", {}).get("output_text", "")

    app.dependency_overrides.clear()
