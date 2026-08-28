from __future__ import annotations

import logging
import uuid
from typing import Literal

# pyrefly: ignore [missing-import]
from duckduckgo_search import DDGS
from langgraph.graph import END, StateGraph

from app.models import Deck, Slide
from .state import DeckState

logger = logging.getLogger(__name__)


def _get_lang_instruction(language: str) -> str:
    if language == "en":
        return "Regardless of the source language, please generate all slide titles, subtitles, topic outlines, bullet points, and speaker notes strictly in English."
    elif language == "auto":
        return "請自動識別教材主要語言，並以相同的語言輸出簡報與講稿。"
    return "無論輸入教材語言為何，請統一以【繁體中文 (Traditional Chinese)】輸出簡報標題、內文重點與逐頁演講稿。"


def _normalize_icon(raw_icon: str) -> str:
    if not raw_icon or not isinstance(raw_icon, str):
        return "💡"
    import re
    # 提取第一個 Emoji 符號
    emoji_match = re.search(r"[\U00010000-\U0010ffff\u2600-\u27bf\u2300-\u23ff\u2b50]", raw_icon)
    if emoji_match:
        return emoji_match.group(0)

    clean_lower = raw_icon.lower().strip()
    mapping = {
        "bulb": "💡", "lightbulb": "💡", "idea": "💡",
        "book": "📚", "read": "📚", "text": "📖",
        "chart": "📊", "bar": "📊", "graph": "📈",
        "gear": "⚙️", "settings": "⚙️", "process": "⚙️",
        "brain": "🧠", "think": "🧠",
        "lightning": "⚡", "bolt": "⚡", "power": "⚡",
        "lock": "🔒", "security": "🔒",
        "globe": "🌐", "web": "🌐", "net": "🌐",
        "target": "🎯", "goal": "🎯",
        "microscope": "🔬", "science": "🔬",
        "search": "🔍", "magnifier": "🔍",
        "star": "⭐", "rocket": "🚀", "fire": "🔥",
    }
    for key, emoji in mapping.items():
        if key in clean_lower:
            return emoji
    return "💡"


def plan_outline_node(state: DeckState) -> DeckState:
    ai_service = state["ai_service"]
    document = state["document"]
    audience = state.get("audience", "大學生")
    tone = state.get("tone", "清楚易懂")
    language = state.get("language", "zh-TW")
    slide_count = state.get("slide_count", 8)
    duration = state.get("duration", 30)

    sampled = document.chunks[: min(30, len(document.chunks))]
    context = "\n\n".join(f"[第 {c.page} 頁] {c.text}" for c in sampled)

    lang_instr = _get_lang_instruction(language)
    system_prompt = f"你是資深教學設計師。請規劃整份簡報的大綱架構。{lang_instr}"
    user_prompt = (
        f"對象：{audience}\n語氣：{tone}\n總時長：{duration} 分鐘\n目標頁數：{slide_count} 頁\n目標輸出語言：{language}\n\n"
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
        "additionalProperties": False,
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


def _clean_search_query(text: str) -> str:
    import re
    cleaned = re.sub(r"[：:｜|—\-_【】\[\]\(\)（）？?！!，,。.]", " ", text)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned[:35]


def enrich_with_web_node(state: DeckState) -> DeckState:
    outline = state.get("outline", {})
    title = outline.get("title", "")
    topics = outline.get("topics", [])
    web_results = ""

    search_keyword = _clean_search_query(title)
    if not search_keyword or search_keyword in ("教學簡報", "簡報教案", "簡報"):
        if topics:
            search_keyword = _clean_search_query(" ".join(topics[:2]))

    if not search_keyword:
        query_str = "教學案例 簡報"
    else:
        query_str = f"{search_keyword} 教學案例"

    try:
        results = list(DDGS(timeout=10).text(query_str, max_results=3))
        if results:
            import re
            formatted = []
            for item in results:
                title_text = re.sub(r"<[^>]+>", "", item.get("title", "")).strip()
                body_text = re.sub(r"<[^>]+>", "", item.get("body", "")).strip()
                body_text = body_text.replace("{", "(").replace("}", ")")[:180]
                if title_text or body_text:
                    formatted.append(f"案例：{title_text}\n內容：{body_text}")
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
    language = state.get("language", "zh-TW")
    slide_count = state.get("slide_count", 8)
    duration = state.get("duration", 30)
    outline = state.get("outline", {})
    web_results = state.get("web_results", "")
    audit_feedback = state.get("audit_feedback", "")

    sampled = document.chunks[: min(30, len(document.chunks))]
    context = "\n\n".join(f"[第 {c.page} 頁] {c.text}" for c in sampled)
    lang_instr = _get_lang_instruction(language)

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
                        "icon": {"type": "string"},
                        "visual_description": {"type": "string"},
                    },
                    "required": ["title", "bullets", "speaker_notes", "source_pages", "icon", "visual_description"],
                    "additionalProperties": False,
                },
            },
        },
        "required": ["title", "subtitle", "slides"],
        "additionalProperties": False,
    }

    notes_rule = "【講稿品質規範】：每一頁投影片的 speaker_notes 必須是一段完整、連貫且可直接口頭朗讀的教師教學口語講稿（每頁建議 100～250 字），包含觀念引導與案例說明，切勿僅提供簡短摘要或一兩句簡述。"
    visual_prompt_rule = f"同時，請為每一頁投影片挑選一個符合內容主題的代表性 Icon (icon，如 💡, 🔬, 📊, ⚡, 🔒, 🧠, ⚙️, 🌐)，並設計一個【搭配說明的教學視覺圖表/插圖構想描述】(visual_description)。{notes_rule}"

    if web_results:
        system_prompt = (
            f"你是資深教學設計師。請結合教材內容與網路補充案例參考，設計投影片、逐頁講稿與視覺圖表構想。{visual_prompt_rule} {lang_instr}"
        )
    else:
        system_prompt = (
            f"你是資深教學設計師。請只使用教材內容，設計投影片、逐頁講稿與視覺圖表構想。{visual_prompt_rule} {lang_instr}"
        )

    user_prompt = (
        f"對象：{audience}\n語氣：{tone}\n總時長：{duration} 分鐘\n投影片：{slide_count} 頁\n目標輸出語言：{language}\n"
        f"預定大綱標題：{outline.get('title', '簡報教案')}\n\n"
        f"教材內容：\n{context}\n\n"
    )
    if web_results:
        user_prompt += f"網路補充案例參考：\n{web_results}\n\n"
    if audit_feedback:
        user_prompt += f"【品質優化要求】：前次生成的講稿未達品質門檻（{audit_feedback}）。請大幅擴充每一頁的 speaker_notes，確保為詳細流暢的教師演講口語稿！\n\n"

    payload = ai_service._structured_response(system_prompt, user_prompt, schema)
    return {"raw_slides": payload.get("slides", []), "outline": payload}


def audit_quality_node(state: DeckState) -> DeckState:
    raw_slides = state.get("raw_slides", [])
    retry_count = state.get("retry_count", 0)

    if not raw_slides:
        feedback = "未生成任何投影片內容，請重新繪製完整投影片與講稿。"
        return {"is_quality_passed": False, "retry_count": retry_count + 1, "audit_feedback": feedback}

    # 檢測講稿長度品質
    total_notes_len = sum(len(s.get("speaker_notes", "")) for s in raw_slides)
    avg_len = total_notes_len / len(raw_slides) if raw_slides else 0

    if avg_len < 15 and retry_count < 1:
        feedback = f"講稿平均長度僅有 {int(avg_len)} 字，過於簡略。每一頁 speaker_notes 必須是一篇至少 150～300 字的完整教師朗讀口語稿"
        logger.info("講稿平均字數低於 15 字，觸發二次精進生成流程...")
        return {"is_quality_passed": False, "retry_count": retry_count + 1, "audit_feedback": feedback}

    return {"is_quality_passed": True}


def route_after_audit(state: DeckState) -> Literal["generate_contents", "finalize_deck"]:
    if state.get("is_quality_passed", False) or state.get("retry_count", 0) > 1:
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
        icon = _normalize_icon(item.get("icon") or item.get("symbol") or "💡")
        visual_description = (
            item.get("visual_description")
            or item.get("visual")
            or item.get("illustration")
            or item.get("visual_prompt")
            or item.get("diagram")
            or item.get("image_description")
            or f"配合【{item.get('title', '單元觀念')}】進行架構分解與幾何視覺圖解說明"
        )

        slides.append(
            Slide(
                title=item.get("title", "未命名投影片"),
                bullets=bullets,
                speaker_notes=speaker_notes,
                source_pages=source_pages,
                icon=icon,
                visual_description=visual_description,
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
