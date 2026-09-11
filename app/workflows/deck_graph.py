from __future__ import annotations

import json
import logging
import uuid
from typing import Any, Literal

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
    handout_text = state.get("handout_text", "")

    # 均勻分佈取樣 (Uniform Strided Sampling)，確保涵蓋全篇教材各章節
    total_chunks = len(document.chunks)
    if total_chunks <= 25:
        sampled = document.chunks
    else:
        indices = [int(i * (total_chunks - 1) / 24) for i in range(25)]
        sampled = [document.chunks[i] for i in indices]

    context = "\n\n".join(f"[第 {c.page} 頁] {c.text}" for c in sampled)
    lang_instr = _get_lang_instruction(language)

    system_prompt = f"你是資深教學設計師。請規劃整份簡報的大綱架構與章節主題。{lang_instr}"
    
    user_prompt_parts = []
    if handout_text:
        user_prompt_parts.append(f"【教學母本講義結構依據】：\n{handout_text[:3000]}\n")
    user_prompt_parts.append(f"【教材全景摘要】（共 {document.pages} 頁、{total_chunks} 區塊）：\n{context}\n")
    user_prompt_parts.append(
        f"對象：{audience}\n語氣：{tone}\n總時長：{duration} 分鐘\n目標頁數：{slide_count} 頁\n目標輸出語言：{language}\n\n"
        f"請規劃主標題 (title)、副標題 (subtitle) 以及包含 {slide_count} 頁的單元主題大綱 (topics)。"
    )
    user_prompt = "\n".join(user_prompt_parts)

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
            "title": f"{document.name} 教學簡報",
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
            search_keyword = _clean_search_query(" ".join(str(t) for t in topics[:2]))

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
    """方案 B：以講義為教學骨幹 + 原始教材為細節補充，進行單次結構化批次生成 (Single Batch Generation)"""
    ai_service = state["ai_service"]
    document = state["document"]
    audience = state.get("audience", "大學生")
    tone = state.get("tone", "清楚易懂")
    language = state.get("language", "zh-TW")
    slide_count = state.get("slide_count", 8)
    duration = state.get("duration", 30)
    outline = state.get("outline", {})
    web_results = state.get("web_results", "")
    handout_text = state.get("handout_text", "")

    topics = outline.get("topics", [])
    deck_title = outline.get("title", "教學簡報")
    deck_subtitle = outline.get("subtitle", f"{audience} · {tone}語氣")

    if not topics:
        topics = [f"單元重點 {i+1}" for i in range(slide_count)]
    if len(topics) < slide_count:
        topics = list(topics) + [f"深入探討 {i+1}" for i in range(len(topics), slide_count)]
    elif len(topics) > slide_count:
        topics = list(topics[:slide_count])

    # 均勻取樣教材原始片段（提供精確公式、數據與頁碼依據）
    total_chunks = len(document.chunks)
    if total_chunks <= 20:
        sampled = document.chunks
    else:
        indices = [int(i * (total_chunks - 1) / 19) for i in range(20)]
        sampled = [document.chunks[i] for i in indices]
    context = "\n\n".join(f"[第 {c.page} 頁] {c.text}" for c in sampled)

    lang_instr = _get_lang_instruction(language)
    bullets_rule = (
        "【簡報內文重點規範】：每一頁投影片的 bullets 必須包含 3～4 點精煉且高資訊密度的觀念重點提綱"
        "（每點建議 15～30 字，著重核心名詞定義、關鍵推導、LaTeX 公式如 $...$ 或關鍵對比），切勿過於簡略。"
    )
    notes_rule = (
        "【講稿品質規範】：每一頁投影片的 speaker_notes 必須是一段完整、連貫且可直接口頭朗讀的教師口語教學講稿"
        "（每頁建議 150～250 字），包含觀念引導、論述展開、案例推導與提問互動。"
    )
    visual_prompt_rule = (
        "【結構化視覺圖解規範】：請為每一頁投影片提供："
        "1. 代表性 Icon (icon，如 💡, 🔬, 📊, ⚡, 🔒, 🧠, ⚙️, 🌐)；"
        "2. 搭配說明的教學視覺圖表構想 (visual_description)；"
        "3. 結構化視覺圖解 (visual_diagram)，包含 diagram_type ('flowchart' | 'comparison' | 'key_formula' | 'concept_map')、"
        "steps (包含 2～3 個步驟，每個包含 label 如 '① 核心觀念' 與 text 具體機制說明) 及 takeaway (一句話核心結論)。"
    )

    full_deck_schema = {
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
                        "visual_diagram": {
                            "type": "object",
                            "properties": {
                                "diagram_type": {"type": "string"},
                                "steps": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "label": {"type": "string"},
                                            "text": {"type": "string"},
                                        },
                                        "required": ["label", "text"],
                                        "additionalProperties": False,
                                    },
                                },
                                "takeaway": {"type": "string"},
                            },
                            "required": ["diagram_type", "steps", "takeaway"],
                            "additionalProperties": False,
                        },
                    },
                    "required": ["title", "bullets", "speaker_notes", "source_pages", "icon", "visual_description"],
                    "additionalProperties": False,
                },
            },
        },
        "required": ["title", "subtitle", "slides"],
        "additionalProperties": False,
    }

    system_prompt = (
        f"你是資深教學設計師。請以專業嚴謹的結構，一次性批次產出整份包含 {slide_count} 頁的教學簡報。"
        f"{visual_prompt_rule} {bullets_rule} {notes_rule} {lang_instr}"
    )

    user_prompt_parts = []
    if handout_text:
        user_prompt_parts.append(f"【教學核心母本（講義結構與深度論述依據）】：\n{handout_text}\n")
    user_prompt_parts.append(f"【原始教材細節與頁碼索引】：\n{context}\n")
    if web_results:
        user_prompt_parts.append(f"【網路補充案例參考】：\n{web_results}\n")

    topics_str = "\n".join(f"- 第 {i+1} 頁單元主題：{t}" for i, t in enumerate(topics))
    user_prompt_parts.append(
        f"【課程教學設定】：\n"
        f"- 對象：{audience}\n"
        f"- 語氣：{tone}\n"
        f"- 總時長：{duration} 分鐘\n"
        f"- 投影片總頁數：{slide_count} 頁\n"
        f"- 目標輸出語言：{language}\n"
        f"- 預定大綱標題：{deck_title} ({deck_subtitle})\n\n"
        f"【規劃各頁單元清單】：\n{topics_str}\n\n"
        f"請務必一次性產出包含完整 {slide_count} 頁 slides 的合法 JSON 物件。"
    )
    user_prompt = "\n".join(user_prompt_parts)

    try:
        res = ai_service._structured_response(system_prompt, user_prompt, full_deck_schema)
        slides = res.get("slides", [])
        final_deck_title = res.get("title") or deck_title
        final_deck_subtitle = res.get("subtitle") or deck_subtitle
    except Exception as exc:
        logger.warning("批次簡報生成異常，將進行降級建構：%s", exc)
        slides = []
        final_deck_title = deck_title
        final_deck_subtitle = deck_subtitle
        for idx, topic_name in enumerate(topics):
            slides.append({
                "title": topic_name,
                "bullets": [f"{topic_name} 核心觀念與定義", "關鍵機制推導與重點分析", "課堂實務應用指引"],
                "speaker_notes": f"各位學員好，在這一頁我們將聚焦探討【{topic_name}】。請大家特別掌握其核心概念與推導邏輯，這是本章節非常重要的基礎。",
                "source_pages": [1],
                "icon": "💡",
                "visual_description": f"配合【{topic_name}】進行概念流程圖與視覺說明",
            })

    # 若頁數不足則補齊
    while len(slides) < slide_count:
        idx = len(slides)
        t_name = topics[idx] if idx < len(topics) else f"深入探討 {idx+1}"
        slides.append({
            "title": t_name,
            "bullets": [f"{t_name} 核心重點說明", "關鍵機制推導與重點剖析", "課堂實務應用指引"],
            "speaker_notes": f"本頁我們接續探討【{t_name}】，請大家特別關注其中的核心觀念與前後章節之關聯性。",
            "source_pages": [1],
            "icon": "💡",
            "visual_description": f"配合【{t_name}】進行架構分解與概念圖解說明",
        })

    deck_payload = {
        "title": final_deck_title,
        "subtitle": final_deck_subtitle,
        "topics": topics,
        "slides": slides[:slide_count],
    }

    return {"raw_slides": slides[:slide_count], "outline": deck_payload}


def audit_quality_node(state: DeckState) -> DeckState:
    """本機輕量品質檢驗與格式補全（不重複發起額外遠端 LLM 請求）"""
    raw_slides = state.get("raw_slides", [])
    for idx, s in enumerate(raw_slides):
        if not s.get("speaker_notes") or len(s.get("speaker_notes", "")) < 30:
            title = s.get("title", f"第 {idx+1} 頁")
            s["speaker_notes"] = f"各位學員好，本頁重點為【{title}】。請大家特別關注其中的核心觀念與推導邏輯，這在整體知識架構中是非常關鍵的環節。"
        if not s.get("bullets"):
            s["bullets"] = ["核心觀念定義與概念解析", "重點推導與對比說明", "應用實例與課堂練習"]
        if not s.get("icon"):
            s["icon"] = "💡"
    return {"is_quality_passed": True}


def route_after_audit(state: DeckState) -> Literal["finalize_deck"]:
    return "finalize_deck"


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
        visual_diagram = item.get("visual_diagram") or {}

        slides.append(
            Slide(
                title=item.get("title", "未命名投影片"),
                bullets=bullets,
                speaker_notes=speaker_notes,
                source_pages=source_pages,
                icon=icon,
                visual_description=visual_description,
                visual_diagram=visual_diagram,
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
    workflow.add_edge("audit_quality", "finalize_deck")
    workflow.add_edge("finalize_deck", END)

    return workflow.compile()
