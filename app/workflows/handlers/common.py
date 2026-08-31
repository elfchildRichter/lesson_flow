from __future__ import annotations

import re


def _clean_topic(query: str) -> str:
    """Strips prompt/instruction verbs from raw query to extract clean topic."""
    clean = re.sub(
        r"^(請|幫我|需要|想|產出一篇|撰寫一段|寫一篇|產生|幫忙|編寫|製作|介紹|分析|檢查|排查|\s)+",
        "",
        query,
    )
    clean = re.sub(r"(的文案|的宣傳文|貼文|介紹文|文案|問題|錯誤|\s)+$", "", clean)
    return clean.strip() or query


def _format_history(history: list[dict] | None) -> str:
    """Formats previous conversation history turns into structured prompt context."""
    if not history:
        return ""
    formatted_turns = []
    for item in history[-6:]:
        role = item.get("role", "")
        role_label = "使用者 (User)" if role == "user" else "AI 助手 (Assistant)"
        content = item.get("content", "").strip()
        if content:
            short_content = content[:300] + ("…" if len(content) > 300 else "")
            formatted_turns.append(f"[{role_label}]: {short_content}")
    if not formatted_turns:
        return ""
    return "【前情提要 / 歷史對話紀錄】:\n" + "\n".join(formatted_turns) + "\n\n"
