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
