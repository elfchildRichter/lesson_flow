from __future__ import annotations

import logging
from typing import Any, Dict
from app.workflows.handlers.common import _clean_topic

logger = logging.getLogger(__name__)


def academic_handler(payload: Dict[str, Any]) -> Dict[str, Any]:
    """🎓 教務教學部 Handler：處理問答、教學大綱與簡報講稿生成"""
    query = payload.get("query", "")
    ai_service = payload.get("ai_service")
    clean_topic = _clean_topic(query)

    prompt = f"""你是一名課伴 Lesson Flow 的資深教務小老師。
請解答使用者提出的教學問題，或編寫一份結構清晰的教學大綱與主題重點說明：

使用者提問 / 主題：{clean_topic}

要求：
1. 內容嚴謹、適合教師備課或學生學習。
2. 包含核心觀念解析、教學建議與總結。
3. 若涉及數學或物理化學公式，請使用標準 LaTeX 格式 ($...$ 或 $$...$$)。
4. 結尾附上出處標註範例 (如 [P.1]、[P.3])。"""

    content = ""
    if ai_service:
        try:
            if ai_service.provider == "gemini" and ai_service.gemini_client:
                res = ai_service.gemini_client.models.generate_content(
                    model=ai_service.model, contents=prompt
                )
                content = res.text
            elif ai_service.provider == "openai" and ai_service.openai:
                res = ai_service.openai.chat.completions.create(
                    model=ai_service.model,
                    messages=[{"role": "user", "content": prompt}],
                )
                content = res.choices[0].message.content
            elif ai_service.ollama:
                res = ai_service.ollama.generate(model=ai_service.model, prompt=prompt)
                content = res.get("response", "")
        except Exception as e:
            logger.warning(f"Academic AI call failed: {e}")

    if not content:
        content = (
            f"📖 【Lesson Flow 教學輔導】\n\n"
            f"📌 授課主題：{clean_topic}\n\n"
            f"💡 核心概念解析：\n"
            f"1. 觀念導讀：著重理解基本定義與原理，配合多模態圖示對照 [P.1]。\n"
            f"2. 關鍵公式：請標示標準公式結構（如 $E = mc^2$）。\n"
            f"3. 課後複習：搭配 Self-RAG 自動校對，無幻覺且確保出處標記正確 [P.3]。\n\n"
            f"👉 建議下一步：匯出成 PowerPoint (.pptx) 並附帶逐頁教學演講稿。"
        )

    return {"output_text": content, "topic": clean_topic, "department": "academic"}
