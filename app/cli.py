from __future__ import annotations

import argparse
import sys
import warnings

# Suppress urllib3 / langgraph deprecation warnings for clean CLI output
warnings.filterwarnings("ignore")

from app.services import AIService
from app.workflows import company_router, skill_registry


def main():
    parser = argparse.ArgumentParser(
        description="Lesson Flow CLI - Agent 多部門任務指揮工具"
    )
    parser.add_argument(
        "query",
        type=str,
        nargs="?",
        help="下達給 Agent 的任務說明 (例: '請幫我排查 Railway OOM' 或 '寫一篇 FB 宣傳貼文')",
    )
    parser.add_argument(
        "--platform",
        type=str,
        default="FB / 社群媒體",
        help="社群文案平台 (FB / Threads / LinkedIn / Twitter)",
    )
    parser.add_argument(
        "--user",
        type=str,
        default="當前系統用戶 (CLI)",
        help="使用者識別名稱",
    )

    args = parser.parse_args()

    if not args.query:
        print("請提供任務說明！")
        print("範例:")
        print("  1. 教務部: python3 -m app.cli \"請說明牛頓第二運動定律的教學大綱\"")
        print("  2. 行政部: python3 -m app.cli \"查詢我今天的每日配額使用量\"")
        print("  3. 技術部: python3 -m app.cli \"請幫我排查 Railway 部署發生的 Out of Memory 錯誤\"")
        print("  4. 行銷部: python3 -m app.cli \"請幫我寫一篇 FB 宣傳貼文\" --platform Threads")
        sys.exit(1)

    # Initialize AI Service instance
    try:
        ai_service = AIService()
    except Exception:
        ai_service = None

    payload = {
        "query": args.query,
        "platform": args.platform,
        "user": args.user,
        "ai_service": ai_service,
    }

    # Dispatch via Global Orchestrator Router
    state = company_router.invoke({"input_query": args.query, "payload": payload})

    res = state.get("result", {})
    dept = res.get("department", "unknown")
    matched_skill = res.get("matched_skill", "unknown")

    print(f"\n🤖 [Lesson Flow Agent Router]")
    print(f"🎯 目標部門: {dept.upper()} | 匹配 Skill: {matched_skill}\n")
    print("=" * 60)

    data = res.get("data", {})
    if isinstance(data, dict):
        output = data.get("output_text") or data.get("copywriting") or str(data)
        print(output)
    elif isinstance(data, str) and data:
        print(data)
    else:
        print(res.get("message", "任務已順利完成。"))

    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
