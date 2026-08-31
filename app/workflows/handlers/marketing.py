from __future__ import annotations

import logging
from typing import Any, Dict
from app.workflows.handlers.common import _clean_topic, _format_history

logger = logging.getLogger(__name__)


def marketing_handler(payload: Dict[str, Any]) -> Dict[str, Any]:
    """🚀 市場與營銷部 Handler：處理課程宣傳推廣、教學賣點包裝、招生文案與社群貼文生成"""
    query = payload.get("query", "課程宣傳與教學特色推廣")
    platform = payload.get("platform", "FB / 社群媒體")
    ai_service = payload.get("ai_service")
    clean_topic = _clean_topic(query)
    query_lower = query.lower()
    history_text = _format_history(payload.get("history"))

    # 跨部門職能引導：若問題屬於教學備課，主動指引尋求教務小老師支援
    if any(k in query_lower for k in ["教案", "試題", "選擇題", "課文", "演講稿", "觀念大綱", "出 5 題"]):
        return {
            "output_text": (
                "👋 您好！我是【🚀 市場與營銷部】的營銷推廣負責人。\n\n"
                "設計單元教案大綱、產生測驗題目與簡報逐頁演講稿屬於【🎓 教務教學部】（Lesson Flow 小老師）的核心專長。\n\n"
                "👉 建議您點擊切換至【🎓 教務教學部】（與教務小老師對話），獲得最精確的備課與教案設計支援！"
            ),
            "department": "marketing",
            "referred_department": "academic"
        }

    prompt = f"""你是一名資深教育課程營銷與推廣專家。
{history_text}請針對老師的課程宣傳、教學亮點或推廣主題，編寫一篇吸引人、排版美觀、帶有表情符號 (Emoji) 的 {platform} 招生與社群宣傳文案：

推廣主題：{clean_topic}

請依據以下架構為老師包裝宣傳內容：
1. 💡 震撼引言 / 吸引家長與學生的痛點標題
2. ✨ 課程 3 大核心教學亮點與特色
3. 📝 適合對象與學習成效預期
4. 🚀 簡短行動呼籲 (CTA)

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
