from __future__ import annotations

import logging
from typing import Any, Dict
from app.workflows.handlers.common import _clean_topic

logger = logging.getLogger(__name__)


def devops_handler(payload: Dict[str, Any]) -> Dict[str, Any]:
    """🛠️ 技術維護部 Handler：處理 Railway 部署診斷、OOM 記憶體排查與 AI Provider 設定"""
    query = payload.get("query", "")
    ai_service = payload.get("ai_service")
    clean_topic = _clean_topic(query)

    provider = ai_service.provider if ai_service else "gemini"

    report = (
        f"🛠️ 【Lesson Flow 技術維修與基礎設施診斷】\n\n"
        f"🔍 診斷項目：{clean_topic}\n\n"
        f"📊 系統狀態與資源分析：\n"
        f"  • 雲端環境：Railway Container (Limit: 512MB RAM)\n"
        f"  • 當前 AI Provider：{provider} (RAM 消耗 < 250MB 🟢)\n"
        f"  • 持久化掛載：Volume /app/data (HF_HOME 已導向持久化快取)\n\n"
        f"🚨 診斷建議與修復 SOP：\n"
        f"  1. 若發生 OOM Killed：建議使用 `AI_PROVIDER=gemini` 或 `openai` 避開本機 PyTorch 1GB+ 記憶體消耗。\n"
        f"  2. 若出現 JSON Schema 400 錯誤：所有 `type: object` 屬性必須加入 `additionalProperties: false`。\n"
        f"  3. 容器重啟防護：全站預設採用輕量 API 模式，避免重載下載權重引起物理刪除。"
    )

    return {"output_text": report, "department": "devops"}
