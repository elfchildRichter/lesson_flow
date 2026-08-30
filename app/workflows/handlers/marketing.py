from __future__ import annotations

import logging
from typing import Any, Dict
from app.workflows.handlers.common import _clean_topic

logger = logging.getLogger(__name__)


def marketing_handler(payload: Dict[str, Any]) -> Dict[str, Any]:
    """🚀 市場與營銷部 Handler：處理社群文案生成、SEO 與 SaaS 產品定位"""
    query = payload.get("query", "Lesson Flow 產品宣傳與 SaaS 特色推廣")
    platform = payload.get("platform", "FB / 社群媒體")
    ai_service = payload.get("ai_service")
    clean_topic = _clean_topic(query)

    prompt = f"""你是一名資深 SaaS 營銷推廣負責人 (Lesson Flow Marketing Lead)。
請針對以下主題與需求，編寫一篇吸引人、排版美觀、帶有表情符號 (Emoji) 的 {platform} 宣傳文案：

需求主題：{clean_topic}

Lesson Flow 產品賣點參考：
1. 📷 Vision-Native RAG：高畫質 PNG 頁面直解，精準還原理化/數學 LaTeX 公式 ($...$) 與複雜圖表。
2. 🛡️ Self-RAG 防幻覺：自動審查解答真實性，附帶精準頁碼出處標記 (例如 [P.3])。
3. 🌐 雙語簡報與講稿一鍵匯出：支援中英文教材，產出 .pptx 簡報與逐頁教學演講稿。
4. ⚡ 彈性 AI 引擎：支援 Gemini 3.6 Flash / OpenAI / Ollama 本機離線隱私模式。

請輸出完整的宣傳貼文內容（包含：吸引人的標題、痛點引發共鳴、核心亮點介紹、行動呼籲 CTA、Hashtags）："""

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
            logger.warning(f"Marketing AI call failed: {e}")

    if not content:
        content = (
            f"🚀 【課伴 LessonFlow】AI 教學設計與簡報生成工具\n\n"
            f"📢 精彩主題：{clean_topic}\n\n"
            f"✨ 核心亮點：\n"
            f"1. 視覺化 PDF 頁面直解 (LaTeX 公式 & 理化圖表)\n"
            f"2. Self-RAG 防幻覺校對與精準頁碼標示 (例如 [P.3])\n"
            f"3. 一鍵匯出 PowerPoint (.pptx) 與逐頁講稿\n\n"
            f"👉 立即體驗：https://railway.app\n"
            f"#LessonFlow #AI教學 #備課神器 #VisionRAG #SelfRAG"
        )

    return {
        "output_text": content,
        "topic": clean_topic,
        "department": "marketing",
        "platform": platform,
    }
