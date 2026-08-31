from __future__ import annotations

import os
from pathlib import Path
from datetime import datetime
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile, Depends, Request
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles

from fastapi_auth_core import (
    init_db,
    auth_router,
    admin_router,
    get_current_user,
    require_quota,
    decode_access_token,
    get_user_quota_info,
    hash_password,
)

from .models import AskRequest, AskResponse, GenerateRequest, ProviderRequest
from .services import AIService, DocumentStore, make_pptx, make_script, parse_pdf
from .tiers import get_tier_config

load_dotenv(override=True)

def ensure_user_table_schema():
    db_path = os.getenv("AUTH_DB_PATH", "./data/users.db")
    if os.path.exists(db_path):
        import sqlite3
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            cols = [r[1] for r in cursor.execute("PRAGMA table_info(users)").fetchall()]
            if "last_login_at" not in cols:
                cursor.execute("ALTER TABLE users ADD COLUMN last_login_at DATETIME")
                conn.commit()

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_dotenv(override=True)
    db_path = os.getenv("AUTH_DB_PATH", "./data/users.db")
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    init_db()
    ensure_user_table_schema()
    yield

app = FastAPI(
    title="課伴 LessonFlow",
    version="1.0.0",
    lifespan=lifespan
)

# 掛載認證與管理員介面 (/api/auth/*, /api/admin/*)
app.include_router(auth_router)
app.include_router(admin_router)

store = DocumentStore()
ai = AIService()
STATIC_DIR = Path(__file__).parent / "static"


from .workflows import company_router, skill_registry


@app.get("/api/agent/skills")
def get_agent_skills() -> dict:
    skills = skill_registry.list_skills()
    return {"skills": [s.to_dict() for s in skills]}


@app.post("/api/agent/dispatch")
def dispatch_agent_task(
    payload: dict,
    request: Request,
    current_user: dict = Depends(require_quota("ask", 10))
) -> dict:
    query = payload.get("query", "").strip()
    platform = payload.get("platform", "FB / 社群媒體")
    if not query:
        raise HTTPException(400, "請提供有效的任務指令說明")

    user_id = current_user.get("id") or current_user.get("user_id", 0)
    username = current_user.get("username") or current_user.get("sub", "使用者")
    role = current_user.get("role", "user")
    tier_key = current_user.get("tier", "teacher_trial")

    quota = get_user_quota_info(user_id, username, role)
    tier_config = get_tier_config(tier_key, role)
    user_info = {
        "user_id": user_id,
        "username": username,
        "role": role,
        "tier": tier_config,
        "quota": quota,
    }

    full_payload = {
        "query": query,
        "platform": platform,
        "target_department": payload.get("target_department"),
        "ai_service": ai,
        "user_info": user_info,
    }
    try:
        state = company_router.invoke({"input_query": query, "payload": full_payload})
        return state.get("result", {})
    except Exception as exc:
        raise HTTPException(500, f"Agent 任務派發失敗：{exc}") from exc



@app.get("/api/user/me")
def get_current_user_profile(current_user: dict = Depends(get_current_user)) -> dict:
    user_id = current_user.get("user_id") or current_user.get("id")
    username = current_user.get("sub") or current_user.get("username")
    role = current_user.get("role", "user")

    tier_key = "teacher_trial"
    db_path = os.getenv("AUTH_DB_PATH", "./data/users.db")
    if os.path.exists(db_path):
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ? OR username = ?", (user_id, username))
            cursor.execute("SELECT tier, role FROM users WHERE id = ? OR username = ?", (user_id, username))
            row = cursor.fetchone()
            if row:
                if row[0]:
                    tier_key = row[0]
                if row[1]:
                    role = row[1]

    if role == "admin":
        tier_key = "admin"

    quota = get_user_quota_info(user_id, username, role)
    tier_config = get_tier_config(tier_key, role)

    return {
        "id": user_id,
        "username": username,
        "role": role,
        "tier": tier_key,
        "tier_info": tier_config.to_dict(),
        "quota": quota
    }


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", **ai.info}


@app.get("/api/provider")
def get_provider() -> dict:
    return ai.info


@app.post("/api/provider")
def set_provider(request: ProviderRequest) -> dict:
    try:
        info = ai.set_provider(request.provider)
        return {"status": "ok", **info}

    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc



def document_payload(document) -> dict:
    return {
        "id": document.id,
        "name": document.name,
        "pages": document.pages,
        "chunks": len(document.chunks),
        "size_bytes": document.size_bytes,
        **ai.info,
    }


@app.post("/api/documents")
async def upload_document(
    file: UploadFile = File(...),
    enable_multimodal: bool = Form(False),
    current_user: dict = Depends(get_current_user)
) -> dict:
    if file.content_type != "application/pdf" and not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(415, "只支援 PDF 檔案")
    content = await file.read()
    max_bytes = int(os.getenv("MAX_UPLOAD_MB", "30")) * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(413, f"檔案不可超過 {max_bytes // 1024 // 1024} MB")
    try:
        document = parse_pdf(content, file.filename or "教材.pdf", ai_service=ai, enable_multimodal=enable_multimodal)
        ai.index(document)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    except Exception as exc:
        raise HTTPException(500, f"處理 PDF 時發生錯誤：{exc}") from exc
    store.add(document)
    return document_payload(document)


from pydantic import BaseModel


class ImportTextRequest(BaseModel):
    title: str
    content: str


@app.post("/api/documents/import_text")
def import_text_document(
    request: ImportTextRequest,
    current_user: dict = Depends(get_current_user)
) -> dict:
    from app.services import parse_text
    safe_title = (request.title or "AI_備課教案").strip()
    if not safe_title.endswith(".md") and not safe_title.endswith(".txt"):
        safe_title = f"{safe_title}.md"
    try:
        document = parse_text(request.content, filename=safe_title)
        ai.index(document)
        store.add(document)
        return document_payload(document)
    except Exception as exc:
        raise HTTPException(500, f"導入教案時發生錯誤：{exc}") from exc


@app.post("/api/ask", response_model=AskResponse)
def ask(
    request: AskRequest,
    current_user: dict = Depends(require_quota("ask", 10))
) -> AskResponse:
    try:
        document = store.get(request.document_id)
    except KeyError as exc:
        raise HTTPException(404, "找不到文件，請重新上傳") from exc
    try:
        answer, sources, mode = ai.ask(document, request.question, request.enable_web_search)
    except Exception as exc:
        raise HTTPException(502, f"AI 暫時無法回答：{exc}") from exc
    return AskResponse(answer=answer, sources=sources, mode=mode)


@app.post("/api/decks")
def generate_deck(
    request: GenerateRequest,
    current_user: dict = Depends(require_quota("deck", 3))
) -> dict:
    try:
        document = store.get(request.document_id)
    except KeyError as exc:
        raise HTTPException(404, "找不到文件，請重新上傳") from exc
    try:
        deck = ai.generate_deck(
            document,
            request.audience,
            request.tone,
            request.slide_count,
            request.duration,
            request.enable_web_search,
            language=request.language,
        )
    except Exception as exc:
        raise HTTPException(502, f"產生教材時發生錯誤：{exc}") from exc
    store.decks[deck.id] = deck
    return deck.model_dump()


@app.get("/api/decks/{deck_id}/pptx")
def download_pptx(deck_id: str) -> Response:
    deck = store.decks.get(deck_id)
    if not deck:
        raise HTTPException(404, "找不到簡報")
    content = make_pptx(deck)
    return Response(content, media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation", headers={"Content-Disposition": f'attachment; filename="lesson-{deck.id}.pptx"'})


@app.get("/api/decks/{deck_id}/script")
def download_script(deck_id: str) -> Response:
    deck = store.decks.get(deck_id)
    if not deck:
        raise HTTPException(404, "找不到講稿")
    return Response(
        make_script(deck),
        media_type="text/markdown; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="script-{deck.id}.md"'},
    )


from pydantic import BaseModel
import sqlite3


class TextDeckRequest(BaseModel):
    topic: str
    content: str


@app.post("/api/deck/generate_from_text")
def generate_deck_from_text(
    request: TextDeckRequest,
    current_user: dict = Depends(require_quota("deck", 3))
) -> dict:
    from app.models import Document, Chunk
    import uuid
    doc_id = f"doc_txt_{uuid.uuid4().hex[:8]}"
    temp_doc = Document(
        id=doc_id,
        name=request.topic or "教學主題",
        pages=[request.content],
        chunks=[Chunk(id="c1", text=request.content[:2000], page_number=1)],
        size_bytes=len(request.content.encode("utf-8"))
    )
    store.add(temp_doc)
    try:
        deck = ai.generate_deck(
            temp_doc,
            audience="學生",
            tone="專業生動",
            slide_count=5,
            duration="45分鐘",
            enable_web_search=False,
            language="zh-TW"
        )
        store.decks[deck.id] = deck
        return {
            "status": "success",
            "deck_id": deck.id,
            "slide_count": len(deck.slides),
            "download_url": f"/api/decks/{deck.id}/pptx"
        }
    except Exception as exc:
        raise HTTPException(500, f"生成簡報失敗：{exc}") from exc


from pydantic import BaseModel
import sqlite3

class UpdateTierRequest(BaseModel):
    username: str
    tier: str


@app.get("/api/admin/users/list")
def list_all_users_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(403, "僅限管理員權限")
    ensure_user_table_schema()
    db_path = os.getenv("AUTH_DB_PATH", "./data/users.db")
    today_str = datetime.now().strftime("%Y-%m-%d")

    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        rows = cursor.execute(
            """
            SELECT id, username, role, status, created_at, 
                   COALESCE(tier, 'teacher_trial') as tier,
                   last_login_at
            FROM users 
            ORDER BY 
                CASE WHEN role = 'admin' THEN 0 ELSE 1 END ASC,
                CASE WHEN last_login_at IS NULL THEN 1 ELSE 0 END ASC,
                last_login_at DESC,
                id ASC
            """
        ).fetchall()

        users = []
        for r in rows:
            u = dict(r)
            uid = u["id"]
            urole = u["role"]
            utier = u["tier"]
            tier_config = get_tier_config(utier, urole)

            # 1. 查詢今日使用量 (Daily Quota)
            daily_rows = cursor.execute(
                "SELECT action, used_count, daily_limit FROM daily_quotas WHERE user_id = ? AND usage_date = ?",
                (uid, today_str)
            ).fetchall()
            daily_map = {row["action"]: dict(row) for row in daily_rows}

            deck_today = daily_map.get("deck", {}).get("used_count", 0) if daily_map.get("deck") else 0
            ask_today = daily_map.get("ask", {}).get("used_count", 0) if daily_map.get("ask") else 0

            deck_limit = tier_config.get("deck_daily_limit", 10)
            ask_limit = tier_config.get("ask_daily_limit", 50)

            # 2. 查詢累計總使用量 (Total Cumulative Usage)
            total_rows = cursor.execute(
                "SELECT action, SUM(used_count) as total_used FROM daily_quotas WHERE user_id = ? GROUP BY action",
                (uid,)
            ).fetchall()
            total_map = {row["action"]: (row["total_used"] or 0) for row in total_rows}

            deck_total = total_map.get("deck", 0)
            ask_total = total_map.get("ask", 0)

            u["quota_summary"] = {
                "deck_today": deck_today,
                "deck_limit": deck_limit,
                "ask_today": ask_today,
                "ask_limit": ask_limit,
                "deck_total": deck_total,
                "ask_total": ask_total,
                "is_unlimited": urole == "admin" or utier == "admin"
            }
            users.append(u)

    return {"status": "ok", "users": users}


@app.post("/api/admin/users/tier")
def update_user_tier_admin(req: UpdateTierRequest, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(403, "僅限管理員權限")
    from .tiers import TIER_CONFIGS
    if req.tier not in TIER_CONFIGS:
        raise HTTPException(400, "無效的會員層級標籤")
    db_path = os.getenv("AUTH_DB_PATH", "./data/users.db")
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET tier = ? WHERE username = ?", (req.tier, req.username))
        if cursor.rowcount == 0:
            raise HTTPException(404, "找不到指定的用戶")
        conn.commit()
class CreateUserAdminRequest(BaseModel):
    username: str
    password: str
    role: str = "user"
    tier: str = "teacher_pro"


@app.post("/api/admin/users/create")
def create_user_admin(req: CreateUserAdminRequest, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(403, "僅限管理員權限")
    username = req.username.strip()
    password = req.password.strip()
    if not username or not password:
        raise HTTPException(400, "帳號與密碼不得為空")
    if req.role not in ["user", "admin"]:
        raise HTTPException(400, "無效的角色類別 (需為 user 或 admin)")
    from .tiers import TIER_CONFIGS
    tier_key = "admin" if req.role == "admin" else req.tier
    if tier_key not in TIER_CONFIGS:
        raise HTTPException(400, "無效的會員層級標籤")

    db_path = os.getenv("AUTH_DB_PATH", "./data/users.db")
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        existing = cursor.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
        if existing:
            raise HTTPException(400, f"帳號 {username} 已存在，請使用其他名稱")

        hashed_pass = hash_password(password)
        cursor.execute(
            "INSERT INTO users (username, password_hash, role, status, tier) VALUES (?, ?, ?, 'approved', ?)",
            (username, hashed_pass, req.role, tier_key)
        )
        conn.commit()

    role_name = "👑 系統管理員" if req.role == "admin" else "👤 一般用戶"
    return {"status": "ok", "message": f"已成功新增 {role_name} 帳號：{username}"}


app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
