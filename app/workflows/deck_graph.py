from __future__ import annotations

import logging
import uuid
from typing import Literal

from duckduckgo_search import DDGS
from langgraph.graph import END, StateGraph

from app.models import Deck, Slide
from .state import DeckState

logger = logging.getLogger(__name__)


def plan_outline_node(state: DeckState) -> DeckState:
    ai_service = state["ai_service"]
    document = state["document"]
    audience = state.get("audience", "大學生")
    tone = state.get("tone", "清楚易懂")
    slide_count = state.get("slide_count", 8)
    duration = state.get("duration", 30)

    sampled = document.chunks[: min(30, len(document.chunks))]
    context = "\n\n".join(f"[第 {c.page} 頁] {c.text}" for c in sampled)

    system_prompt = "你是資深教學設計師。請規劃整份簡報的大綱架構。"
    user_prompt = (
        f"對象：{audience}\n語氣：{tone}\n總時長：{duration} 分鐘\n目標頁數：{slide_count} 頁\n\n"
        f"教材內容：\n{context}\n\n"
        f"請規劃主標題 (title)、副標題 (subtitle) 以及包含 {slide_count} 頁的單頁主題大綱。"
    )

    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "subtitle": {"type": "string"},
            "topics": {
                "type": "array",
                "items": {"type": "string"},
            },
        },
        "required": ["title", "subtitle", "topics"],
    }

    try:
        outline = ai_service._structured_response(system_prompt, user_prompt, schema)
    except Exception as exc:
        logger.warning("大綱規劃產生異常，將自動降級：%s", exc)
        outline = {
            "title": "教學簡報",
            "subtitle": f"{audience} · {tone}語氣",
            "topics": [f"單元重點 {i+1}" for i in range(slide_count)],
        }

    return {"outline": outline, "retry_count": 0}


def enrich_with_web_node(state: DeckState) -> DeckState:
    outline = state.get("outline", {})
    title = outline.get("title", "")
    web_results = ""
    try:
        results = list(DDGS().text(f"{title} 教學案例 簡報", max_results=3))
        if results:
            formatted = [f"案例：{item.get('title', '')}\n內容：{item.get('body', '')}" for item in results]
            web_results = "\n\n".join(formatted)
    except Exception as exc:
        logger.warning("簡報補充網路搜尋失敗：%s", exc)
        web_results = ""
    return {"web_results": web_results}


def route_after_outline(state: DeckState) -> Literal["enrich_with_web", "generate_contents"]:
    if state.get("enable_web_search", False):
        return "enrich_with_web"
    return "generate_contents"


def generate_contents_node(state: DeckState) -> DeckState:
    ai_service = state["ai_service"]
    document = state["document"]
    audience = state.get("audience", "大學生")
    tone = state.get("tone", "清楚易懂")
    slide_count = state.get("slide_count", 8)
    duration = state.get("duration", 30)
    outline = state.get("outline", {})
    web_results = state.get("web_results", "")

    sampled = document.chunks[: min(30, len(document.chunks))]
    context = "\n\n".join(f"[第 {c.page} 頁] {c.text}" for c in sampled)

    if ai_service.provider == "openai":
        schema = {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "subtitle": {"type": "string"},
                "slides": {
                    "type": "array",
                    "minItems": slide_count,
                    "maxItems": slide_count,
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "bullets": {"type": "array", "items": {"type": "string"}, "minItems": 2, "maxItems": 5},
                            "speaker_notes": {"type": "string"},
                            "source_pages": {"type": "array", "items": {"type": "integer"}},
                        },
                        "required": ["title", "bullets", "speaker_notes", "source_pages"],
                        "additionalProperties": False,
                    },
                },
            },
            "required": ["title", "subtitle", "slides"],
            "additionalProperties": False,
        }
    else:
        schema = {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "subtitle": {"type": "string"},
                "slides": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "bullets": {"type": "array", "items": {"type": "string"}},
                            "speaker_notes": {"type": "string"},
                            "source_pages": {"type": "array", "items": {"type": "integer"}},
                        },
                        "required": ["title", "bullets", "speaker_notes"],
                    },
                },
            },
            "required": ["title", "subtitle", "slides"],
        }

    system_prompt = (
        "你是資深教學設計師。請只使用教材內容，以繁體中文設計投影片與自然、可直接朗讀的逐頁講稿。"
    )
    user_prompt = (
        f"對象：{audience}\n語氣：{tone}\n總時長：{duration} 分鐘\n投影片：{slide_count} 頁\n"
        f"預定大綱標題：{outline.get('title', '簡報教案')}\n\n"
        f"教材內容：\n{context}\n\n"
    )
    if web_results:
        user_prompt += f"網路補充案例參考：\n{web_results}\n\n"

    payload = ai_service._structured_response(system_prompt, user_prompt, schema)
    return {"raw_slides": payload.get("slides", []), "outline": payload}


def audit_quality_node(state: DeckState) -> DeckState:
    raw_slides = state.get("raw_slides", [])
    retry_count = state.get("retry_count", 0)

    if not raw_slides:
        return {"is_quality_passed": False, "retry_count": retry_count + 1}

    # 檢測講稿長度品質
    total_notes_len = sum(len(s.get("speaker_notes", "")) for s in raw_slides)
    avg_len = total_notes_len / len(raw_slides) if raw_slides else 0

    if avg_len < 15 and retry_count < 1:
        logger.info("講稿平均字數低於 15 字，觸發二次精進生成流程...")
        return {"is_quality_passed": False, "retry_count": retry_count + 1}

    return {"is_quality_passed": True}


def route_after_audit(state: DeckState) -> Literal["generate_contents", "finalize_deck"]:
    if state.get("is_quality_passed", False) or state.get("retry_count", 0) >= 1:
        return "finalize_deck"
    return "generate_contents"


def finalize_deck_node(state: DeckState) -> DeckState:
    ai_service = state["ai_service"]
    document = state["document"]
    duration = state.get("duration", 30)
    audience = state.get("audience", "大學生")
    tone = state.get("tone", "清楚易懂")
    payload = state.get("outline", {})
    raw_slides = state.get("raw_slides", [])

    slides = []
    for item in raw_slides:
        raw_bullets = item.get("bullets") or item.get("content") or item.get("points") or []
        if isinstance(raw_bullets, str):
            bullets = [b.strip("•- ").strip() for b in raw_bullets.split("\n") if b.strip()]
        else:
            bullets = list(raw_bullets) if raw_bullets else ["重點說明"]

        speaker_notes = item.get("speaker_notes") or item.get("script") or item.get("notes") or ""
        source_pages = item.get("source_pages") or ([item["page"]] if "page" in item else [1])

        slides.append(
            Slide(
                title=item.get("title", "未命名投影片"),
                bullets=bullets,
                speaker_notes=speaker_notes,
                source_pages=source_pages,
            )
        )

    title = payload.get("title") or (slides[0].title if slides else "簡報教案")
    subtitle = payload.get("subtitle") or f"{audience} · {tone}語氣"

    deck = Deck(
        id=uuid.uuid4().hex[:12],
        document_id=document.id,
        title=title,
        subtitle=subtitle,
        slides=slides,
        duration=duration,
        mode=ai_service.provider,
    )
    return {"deck": deck}


def build_deck_graph() -> StateGraph:
    workflow = StateGraph(DeckState)

    workflow.add_node("plan_outline", plan_outline_node)
    workflow.add_node("enrich_with_web", enrich_with_web_node)
    workflow.add_node("generate_contents", generate_contents_node)
    workflow.add_node("audit_quality", audit_quality_node)
    workflow.add_node("finalize_deck", finalize_deck_node)

    workflow.set_entry_point("plan_outline")

    workflow.add_conditional_edges(
        "plan_outline",
        route_after_outline,
        {
            "enrich_with_web": "enrich_with_web",
            "generate_contents": "generate_contents",
        },
    )

    workflow.add_edge("enrich_with_web", "generate_contents")
    workflow.add_edge("generate_contents", "audit_quality")

    workflow.add_conditional_edges(
        "audit_quality",
        route_after_audit,
        {
            "generate_contents": "generate_contents",
            "finalize_deck": "finalize_deck",
        },
    )

    workflow.add_edge("finalize_deck", END)

    return workflow.compile()
