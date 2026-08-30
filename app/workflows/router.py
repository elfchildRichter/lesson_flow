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
    logger.info(f"[Orchestrator] Classifying intent for query: '{query}'")
    query_lower = query.lower()

    # 1. High priority check: Action intent for copywriting / marketing
    marketing_triggers = ["文案", "貼文", "宣傳", "介紹文", "產出一篇", "寫一篇", "推廣", "貼文範本", "行銷"]
    if any(k in query_lower for k in marketing_triggers):
        marketing_skill = skill_registry.get_skill("saas_marketing")
        return {
            "target_department": "marketing",
            "matched_skill": marketing_skill.name if marketing_skill else "saas_marketing",
        }

    # 2. Try matching with Skill Registry
    matched = skill_registry.match_skill(query)
    if matched:
        logger.info(
            f"[Orchestrator] Matched skill [{matched.name}] in department [{matched.department}]"
        )
        return {
            "target_department": matched.department,
            "matched_skill": matched.name,
        }

    # 3. Rule-based fallback classification
    if any(k in query_lower for k in ["簡報", "講稿", "問答", "教材", "題目", "課文", "slide", "qa"]):
        department = "academic"
    elif any(k in query_lower for k in ["額度", "權限", "帳號", "登入", "quota", "user", "admin"]):
        department = "operations"
    elif any(k in query_lower for k in ["部署", "railway", "oom", "記憶體", "docker", "gemini", "ollama", "devops"]):
        department = "devops"
    else:
        department = "academic"  # Default fallback to academic (小老師)

    return {
        "target_department": department,
        "matched_skill": f"{department}_general",
    }



def department_dispatcher_node(state: CompanyState) -> CompanyState:
    """Dispatches payload to the corresponding department skill or handler."""
    dept = state.get("target_department", "academic")
    skill_name = state.get("matched_skill", "")
    payload = state.get("payload", {})

    logger.info(f"[Orchestrator] Dispatching to department [{dept}], skill [{skill_name}]")

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
        description="SaaS 商業模式推廣、SEO 文案與產品定位包裝",
        handler=marketing_handler,
        keywords=["行銷", "推廣", "saas", "訂閱", "文案", "readme", "貼文", "fb", "宣傳"],
    )


_init_default_skills()

