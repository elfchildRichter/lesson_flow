from __future__ import annotations

import logging
from typing import Any, Dict, Literal, TypedDict
from langgraph.graph import END, StateGraph

from app.workflows.registry import skill_registry

logger = logging.getLogger(__name__)


class CompanyState(TypedDict, total=False):
    """Global state for the Company Orchestrator Router."""

    input_query: str
    target_department: str
    matched_skill: str
    payload: Dict[str, Any]
    result: Dict[str, Any]


def classify_intent_node(state: CompanyState) -> CompanyState:
    """Orchestrator node: Classifies intent and matches query to department & skill."""
    query = state.get("input_query", "")
    payload = state.get("payload", {})
    specified_dept = payload.get("target_department")
    logger.info(f"[Orchestrator] Classifying intent for query: '{query}' (specified_dept={specified_dept})")
    query_lower = query.lower()

    # 1. High priority check: Operations & Institution administration
    ops_triggers = ["額度", "權限", "帳號", "登入", "quota", "機構", "學校", "席位", "授權", "合約", "團體"]
    if any(k in query_lower for k in ops_triggers):
        ops_skill = skill_registry.get_skill("user_quota_operations")
        return {
            "target_department": "operations",
            "matched_skill": ops_skill.name if ops_skill else "user_quota_operations",
        }

    # 2. High priority check: DevOps & Infrastructure
    devops_triggers = ["部署", "railway", "oom", "記憶體", "docker", "gemini", "ollama", "devops", "維護", "診斷"]
    if any(k in query_lower for k in devops_triggers):
        devops_skill = skill_registry.get_skill("railway_devops")
        return {
            "target_department": "devops",
            "matched_skill": devops_skill.name if devops_skill else "railway_devops",
        }

    # 3. High priority check: Action intent for course promotion, articles, and marketing
    marketing_triggers = ["賣點", "亮點", "招生", "宣傳", "推廣", "文案", "貼文", "社群文案", "行銷文案", "廣告文案", "fb 貼文", "threads 貼文", "社群貼文", "課程賣點", "社群推廣", "包裝", "文章", "心得", "經驗", "分享", "撰寫"]
    if any(k in query_lower for k in marketing_triggers):
        marketing_skill = skill_registry.get_skill("saas_marketing")
        return {
            "target_department": "marketing",
            "matched_skill": marketing_skill.name if marketing_skill else "saas_marketing",
        }

    # 4. 若使用者已在 UI 點選特定部門對話框 (specified_dept)，直接鎖定為該部門處理
    if specified_dept in ["marketing", "academic", "operations", "devops"]:
        dept_skills = skill_registry.list_skills(specified_dept)
        matched_skill = dept_skills[0].name if dept_skills else f"{specified_dept}_general"
        logger.info(f"[Orchestrator] Direct routing to active user department [{specified_dept}] with skill [{matched_skill}]")
        return {
            "target_department": specified_dept,
            "matched_skill": matched_skill,
        }

    # 5. Try matching with Skill Registry
    matched = skill_registry.match_skill(query)
    if matched:
        logger.info(
            f"[Orchestrator] Matched skill [{matched.name}] in department [{matched.department}]"
        )
        return {
            "target_department": matched.department,
            "matched_skill": matched.name,
        }

    # 5. Rule-based fallback classification
    if any(k in query_lower for k in ["簡報", "講稿", "問答", "教材", "題目", "課文", "slide", "qa"]):
        department = "academic"
    else:
        department = "academic"  # Default fallback to academic (小老師)

    return {
        "target_department": department,
        "matched_skill": f"{department}_general",
    }



def department_dispatcher_node(state: CompanyState) -> CompanyState:
    """Dispatches payload to the corresponding department skill or handler with Tier permission validation."""
    dept = state.get("target_department", "academic")
    skill_name = state.get("matched_skill", "")
    payload = state.get("payload", {})
    user_info = payload.get("user_info", {})
    user_tier = user_info.get("tier", {}) if user_info else {}
    allowed_depts = user_tier.get("allowed_departments", ["academic"])
    user_role = user_info.get("role", "guest") if user_info else "guest"

    logger.info(f"[Orchestrator] Dispatching to department [{dept}], skill [{skill_name}], role [{user_role}]")

    # Tier Permission Validation
    if user_role != "admin" and dept not in allowed_depts:
        if dept == "devops":
            notice = (
                "🔒 【權限限制】\n\n"
                "技術維運診斷為 👑 【管理員專用功能】。\n"
                "一般教師與使用者請使用「💡 備課與教務助手」產出教案大綱，或使用「🚀 社群行銷助手」撰寫推廣貼文。"
            )
        elif dept == "marketing":
            notice = (
                "⭐ 【升級提示：教師專業版獨享功能】\n\n"
                "【社群行銷文案助手】屬於「⭐ 教師專業版」以上解鎖功能。\n"
                "目前您處於「🎓 教師試用版」。升級至專業版後即可解鎖全套 FB / Threads / IG 教學心得與課程推廣文案自動生成功能！"
            )
        elif dept == "operations":
            notice = (
                "🏫 【升級提示：機構/學校版獨享功能】\n\n"
                "【教務營運與行政管理助手】屬於「🏫 機構/學校版」以上解鎖功能。\n"
                "目前您處於「🎓 教師試用版」。升級至機構/學校版後即可解鎖全套團隊席位授權管理與團體合約維護功能！"
            )
        else:
            notice = f"🔒 【權限限制】您目前的會員層級無法使用 [{dept}] 部門的功能，請聯繫管理員升級。"

        return {
            "result": {
                "status": "forbidden",
                "department": dept,
                "matched_skill": skill_name,
                "data": {"output_text": notice, "department": dept, "is_restricted": True},
            }
        }

    skill = skill_registry.get_skill(skill_name)
    handler = skill.handler if (skill and skill.handler) else None

    if not handler:
        dept_handlers = {
            "academic": academic_handler,
            "operations": operations_handler,
            "devops": devops_handler,
            "marketing": marketing_handler,
        }
        handler = dept_handlers.get(dept, academic_handler)

    try:
        output = handler(payload)
        return {
            "result": {
                "status": "success",
                "department": dept,
                "matched_skill": skill_name,
                "data": output,
            }
        }
    except Exception as e:
        logger.error(f"[Orchestrator] Error executing skill [{skill_name}]: {e}")
        return {
            "result": {
                "status": "error",
                "department": dept,
                "matched_skill": skill_name,
                "message": str(e),
            }
        }



def route_decision(state: CompanyState) -> Literal["department_dispatcher", END]:
    """Conditional edge for the orchestrator routing decision."""
    if state.get("target_department"):
        return "department_dispatcher"
    return END


# Setup Company Router Graph
builder = StateGraph(CompanyState)
builder.add_node("classify_intent", classify_intent_node)
builder.add_node("department_dispatcher", department_dispatcher_node)

builder.set_entry_point("classify_intent")
builder.add_conditional_edges(
    "classify_intent",
    route_decision,
    {
        "department_dispatcher": "department_dispatcher",
        END: END,
    },
)
builder.add_edge("department_dispatcher", END)

company_router = builder.compile()


from app.workflows.handlers import (
    academic_handler,
    devops_handler,
    marketing_handler,
    operations_handler,
)


# Register Default Department Core Skills
def _init_default_skills():
    skill_registry.register(
        name="qa_teaching_tutor",
        department="academic",
        description="教材問答與 Self-RAG 防幻覺核對處理器",
        handler=academic_handler,
        keywords=["問答", "提問", "出處", "頁碼", "Self-RAG", "qa"],
    )
    skill_registry.register(
        name="deck_generation_tutor",
        department="academic",
        description="PowerPoint 教學簡報與逐頁演講稿生成器",
        handler=academic_handler,
        keywords=["簡報", "講稿", "pptx", "投影片", "deck", "slide"],
    )
    skill_registry.register(
        name="user_quota_operations",
        department="operations",
        description="使用者存取權限與每日 Quota 額度控管",
        handler=operations_handler,
        keywords=["額度", "權限", "帳號", "quota", "auth"],
    )
    skill_registry.register(
        name="railway_devops",
        department="devops",
        description="Railway 部署診斷、OOM 記憶體問題與 AI Provider 設定",
        handler=devops_handler,
        keywords=["部署", "railway", "oom", "記憶體", "docker", "ollama", "provider"],
    )
    skill_registry.register(
        name="saas_marketing",
        department="marketing",
        description="課程宣傳推廣、教學賣點包裝、招生文案與 FB/Threads/LinkedIn 社群貼文生成",
        handler=marketing_handler,
        keywords=["行銷", "推廣", "賣點", "亮點", "招生", "包裝", "文案", "貼文", "fb", "threads", "宣傳", "文章", "心得", "經驗", "分享", "撰寫"],
    )


_init_default_skills()

