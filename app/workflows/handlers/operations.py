from __future__ import annotations

import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)


def operations_handler(payload: Dict[str, Any]) -> Dict[str, Any]:
    """📋 營運與行政部 Handler：處理使用者額度、權限控制與系統設定"""
    query = payload.get("query", "")
    user_info = payload.get("user_info")
    ai_service = payload.get("ai_service")

    provider_label = "Gemini 雲端 API"
    if ai_service:
        provider_label = ai_service.info.get("provider_label", "Gemini 雲端 API")

    if user_info:
        username = user_info.get("username", "未知用戶")
        role = user_info.get("role", "user")
        quota = user_info.get("quota", {})

        role_label = "👑 系統管理員 / 驗證通過 (JWT Valid)" if role == "admin" else f"👤 正式用戶 ({role}) / 驗證通過"

        if role == "admin" or quota.get("is_unlimited"):
            quota_deck_str = "👑 無限配額 (Unlimited)"
            quota_ask_str = "👑 無限配額 (Unlimited)"
        else:
            deck_info = quota.get("deck", {})
            ask_info = quota.get("ask", {})
            deck_used = deck_info.get("used_count", 0)
            deck_limit = deck_info.get("daily_limit", 3)
            deck_rem = deck_info.get("remaining", deck_limit - deck_used)
            ask_used = ask_info.get("used_count", 0)
            ask_limit = ask_info.get("daily_limit", 10)
            ask_rem = ask_info.get("remaining", ask_limit - ask_used)

            quota_deck_str = f"已用 {deck_used} / 每日上限 {deck_limit} 份 (剩餘 {deck_rem} 份)"
            quota_ask_str = f"已用 {ask_used} / 每日上限 {ask_limit} 次 (剩餘 {ask_rem} 次)"
    else:
        username = "訪客用戶 (Guest)"
        role_label = "🔓 未登入訪客 (Guest User)"
        quota_deck_str = "受限於未登入訪客保護 (請登入帳號檢視專屬配額)"
        quota_ask_str = "受限於未登入訪客保護 (請登入帳號檢視專屬配額)"

    report = (
        f"📋 【Lesson Flow 營運與行政報告】\n\n"
        f"👤 當前使用者：{username}\n"
        f"⚡ 系統 AI 引擎：{provider_label}\n\n"
        f"📊 每日配額使用狀況：\n"
        f"  • 教學簡報生成 (.pptx)：{quota_deck_str}\n"
        f"  • 文件提問與 Self-RAG：{quota_ask_str}\n"
        f"  • 權限等級：{role_label}\n\n"
        f"⚙️ 平台營運規則：\n"
        f"  - 系統每 24 小時重置用戶 Quota 限額。\n"
        f"  - 未登入用戶受 429 Rate Limit 防護限制。"
    )

    return {"output_text": report, "department": "operations"}

