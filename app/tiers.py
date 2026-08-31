from __future__ import annotations

from typing import Any, Dict, List, TypedDict


class TierLimits(TypedDict):
    tier_key: str
    name_zh: str
    name_en: str
    deck_daily_limit: int
    ask_daily_limit: int
    enable_web_search: bool
    enable_vlm: bool
    max_upload_mb: int
    allowed_departments: List[str]
    is_unlimited: bool


TIER_CONFIGS: Dict[str, TierLimits] = {
    "teacher_trial": {
        "tier_key": "teacher_trial",
        "name_zh": "教師試用版",
        "name_en": "Teacher Free Trial",
        "deck_daily_limit": 1,
        "ask_daily_limit": 5,
        "enable_web_search": False,
        "enable_vlm": False,
        "max_upload_mb": 10,
        "allowed_departments": ["academic", "marketing", "operations"],
        "is_unlimited": False,
    },
    "teacher_pro": {
        "tier_key": "teacher_pro",
        "name_zh": "教師專業版",
        "name_en": "Teacher Pro",
        "deck_daily_limit": 10,
        "ask_daily_limit": 50,
        "enable_web_search": True,
        "enable_vlm": True,
        "max_upload_mb": 30,
        "allowed_departments": ["academic", "marketing", "operations"],
        "is_unlimited": False,
    },
    "institution": {
        "tier_key": "institution",
        "name_zh": "機構/學校版",
        "name_en": "Institution / School",
        "deck_daily_limit": 100,
        "ask_daily_limit": 500,
        "enable_web_search": True,
        "enable_vlm": True,
        "max_upload_mb": 100,
        "allowed_departments": ["academic", "marketing", "operations"],
        "is_unlimited": False,
    },
    "admin": {
        "tier_key": "admin",
        "name_zh": "管理員無限版",
        "name_en": "Admin Unlimited",
        "deck_daily_limit": -1,
        "ask_daily_limit": -1,
        "enable_web_search": True,
        "enable_vlm": True,
        "max_upload_mb": 500,
        "allowed_departments": ["academic", "marketing", "operations", "devops"],
        "is_unlimited": True,
    },
}


def get_tier_config(tier_key: str | None = None, role: str | None = None) -> TierLimits:
    """Returns tier limits configuration based on user tier_key or role."""
    if role == "admin" or tier_key == "admin":
        return TIER_CONFIGS["admin"]
    if tier_key and tier_key in TIER_CONFIGS:
        return TIER_CONFIGS[tier_key]
    # Default fallback for regular users and guests is teacher_trial
    return TIER_CONFIGS["teacher_trial"]
