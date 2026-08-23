from __future__ import annotations

import os
from pathlib import Path
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile, Depends
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles

from fastapi_auth_core import (
    init_db,
    auth_router,
    admin_router,
    get_current_user,
    require_quota,
)

from .models import AskRequest, AskResponse, GenerateRequest, ProviderRequest
from .services import AIService, DocumentStore, make_pptx, make_script, parse_pdf

load_dotenv(override=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_dotenv(override=True)
    init_db()
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
    current_user: dict = Depends(get_current_user)
) -> dict:
    if file.content_type != "application/pdf" and not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(415, "只支援 PDF 檔案")
    content = await file.read()
    max_bytes = int(os.getenv("MAX_UPLOAD_MB", "30")) * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(413, f"檔案不可超過 {max_bytes // 1024 // 1024} MB")
    try:
        document = parse_pdf(content, file.filename or "教材.pdf")
        ai.index(document)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    except Exception as exc:
        raise HTTPException(500, f"處理 PDF 時發生錯誤：{exc}") from exc
    store.add(document)
    return document_payload(document)


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
            document, request.audience, request.tone, request.slide_count, request.duration, request.enable_web_search
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


app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
