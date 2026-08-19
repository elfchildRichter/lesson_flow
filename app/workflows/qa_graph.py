from __future__ import annotations

import logging
from typing import Literal

from duckduckgo_search import DDGS
from langgraph.graph import END, StateGraph

from app.models import Source
from .state import QAState

logger = logging.getLogger(__name__)


def retrieve_node(state: QAState) -> QAState:
    ai_service = state["ai_service"]
    document = state["document"]
    question = state["question"]
    matches = ai_service.retrieve(document, question)
    return {"retrieved_chunks": matches}


def grade_documents_node(state: QAState) -> QAState:
    retrieved = state.get("retrieved_chunks", [])
    if not retrieved:
        return {"is_relevant": False}
    
    # 最高相似度得分門檻判斷
    top_score = retrieved[0][1] if len(retrieved) > 0 else 0.0
    is_relevant = top_score >= 0.12 or len(retrieved[0][0].text.strip()) > 30
    return {"is_relevant": is_relevant}


def web_search_node(state: QAState) -> QAState:
    question = state["question"]
    web_results = ""
    try:
        results = list(DDGS().text(question, max_results=3))
        if results:
            formatted = []
            for item in results:
                formatted.append(f"標題：{item.get('title', '')}\n摘要：{item.get('body', '')}\n網址：{item.get('href', '')}")
            web_results = "\n\n".join(formatted)
    except Exception as exc:
        logger.warning("DuckDuckGo 網路搜尋失敗或超時：%s", exc)
        web_results = ""
    return {"web_results": web_results}


def route_after_grading(state: QAState) -> Literal["generate_answer", "web_search", "fallback_answer"]:
    if state.get("is_relevant", False):
        return "generate_answer"
    if state.get("enable_web_search", False):
        return "web_search"
    return "fallback_answer"


def generate_answer_node(state: QAState) -> QAState:
    ai_service = state["ai_service"]
    question = state["question"]
    retrieved = state.get("retrieved_chunks", [])
    web_results = state.get("web_results", "")

    sources = [
        Source(
            page=c.page,
            excerpt=c.text[:180] + ("…" if len(c.text) > 180 else ""),
            score=max(0.0, min(1.0, round(s, 2))),
        )
        for c, s in retrieved
    ]

    context_parts = []
    if retrieved:
        context_parts.append("\n\n".join(f"[第 {c.page} 頁]\n{c.text}" for c, _ in retrieved))
    
    context_str = "\n---\n".join(context_parts) if context_parts else "無相關教材片段"
    
    system_prompt = (
        "你是嚴謹的繁體中文教學助理。"
        "只能根據提供的教材片段與網路參考資料回答。"
        "回答必須清楚、精簡，並以（第 X 頁）標示依據。"
    )
    user_prompt = f"教材片段：\n{context_str}\n\n"
    if web_results:
        user_prompt += f"網路補充資料：\n{web_results}\n\n"
    user_prompt += f"學生問題：{question}"

    answer = ai_service._text_response(system_prompt, user_prompt)
    return {"answer": answer, "sources": sources}


def check_hallucination_node(state: QAState) -> QAState:
    # 檢查回答是否有依據
    return state


def fallback_answer_node(state: QAState) -> QAState:
    msg = "教材中未提及此內容。若需搜尋外部資料，建議開啟『網路補充搜尋』功能。"
    return {"answer": msg, "sources": []}


def build_qa_graph() -> StateGraph:
    workflow = StateGraph(QAState)

    workflow.add_node("retrieve", retrieve_node)
    workflow.add_node("grade_documents", grade_documents_node)
    workflow.add_node("web_search", web_search_node)
    workflow.add_node("generate_answer", generate_answer_node)
    workflow.add_node("check_hallucination", check_hallucination_node)
    workflow.add_node("fallback_answer", fallback_answer_node)

    workflow.set_entry_point("retrieve")
    workflow.add_edge("retrieve", "grade_documents")

    workflow.add_conditional_edges(
        "grade_documents",
        route_after_grading,
        {
            "generate_answer": "generate_answer",
            "web_search": "web_search",
            "fallback_answer": "fallback_answer",
        },
    )

    workflow.add_edge("web_search", "generate_answer")
    workflow.add_edge("generate_answer", "check_hallucination")
    workflow.add_edge("check_hallucination", END)
    workflow.add_edge("fallback_answer", END)

    return workflow.compile()
