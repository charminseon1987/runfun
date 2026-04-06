"""ChefMyFridge 워크플로우: FRIDGY -> CHEFIE -> NUTRI"""

from __future__ import annotations

from typing import Any
import logging

from langgraph.graph import END, StateGraph

from app.agents.state import RunMateState
from app.agents.fridgy import fridgy_node
from app.agents.chefie import chefie_node
from app.agents.nutri import nutri_node

logger = logging.getLogger(__name__)


async def _fridgy_step(state: RunMateState) -> dict[str, Any]:
    out = await fridgy_node(state)
    agent_result = out.get("agent_result") or {}
    return {
        "ingredients": agent_result.get("ingredients") or [],
        # state 타입에 필드가 없더라도 API에서 agent_result로 꺼내 쓸 수 있게 보관
        "agent_result": {**(state.get("agent_result") or {}), "fridgy": agent_result},
    }


async def _chefie_step(state: RunMateState) -> dict[str, Any]:
    out = await chefie_node(state)
    agent_result = out.get("agent_result") or {}
    return {
        "recipes": agent_result.get("recipes") or [],
        "agent_result": {**(state.get("agent_result") or {}), "chefie": agent_result},
    }


async def _nutri_step(state: RunMateState) -> dict[str, Any]:
    out = await nutri_node(state)
    agent_result = out.get("agent_result") or {}
    return {
        "nutrition_plan": agent_result.get("nutrition_plan"),
        "agent_result": {**(state.get("agent_result") or {}), "nutri": agent_result},
    }


def build_chefmyfridge_workflow():
    workflow = StateGraph(RunMateState)
    workflow.add_node("fridgy_step", _fridgy_step)
    workflow.add_node("chefie_step", _chefie_step)
    workflow.add_node("nutri_step", _nutri_step)

    workflow.set_entry_point("fridgy_step")
    workflow.add_edge("fridgy_step", "chefie_step")
    workflow.add_edge("chefie_step", "nutri_step")
    workflow.add_edge("nutri_step", END)
    return workflow.compile()


_workflow = None


def get_workflow():
    global _workflow
    if _workflow is None:
        _workflow = build_chefmyfridge_workflow()
    return _workflow


async def run_chefmyfridge_workflow(state: RunMateState) -> dict[str, Any]:
    wf = get_workflow()
    out_state = await wf.ainvoke(state)
    return {
        "ingredients": out_state.get("ingredients") or [],
        "recipes": out_state.get("recipes") or [],
        "nutrition_plan": out_state.get("nutrition_plan"),
        "agent_result": out_state.get("agent_result") or {},
    }


async def run_chefie_nutri_workflow(state: RunMateState) -> dict[str, Any]:
    """이미지 없이 ingredients만으로 CHEFIE -> NUTRI를 실행합니다."""
    # 1) CHEFIE
    chefie_out = await chefie_node(state)
    chefie_result = chefie_out.get("agent_result") or {}
    # 2) state 업데이트(ingredients는 이미 있다고 가정)
    next_state: RunMateState = {**state, "recipes": chefie_result.get("recipes") or [], "agent_result": state.get("agent_result") or {}}

    # 3) NUTRI
    nutri_out = await nutri_node(next_state)
    nutri_result = nutri_out.get("agent_result") or {}

    return {
        "ingredients": state.get("ingredients") or [],
        "recipes": next_state.get("recipes") or [],
        "nutrition_plan": nutri_result.get("nutrition_plan"),
        "agent_result": {
            **(state.get("agent_result") or {}),
            "chefie": chefie_result,
            "nutri": nutri_result,
        },
    }


async def chefmyfridge_workflow_node(state: RunMateState) -> dict[str, Any]:
    """오케스트레이터 노드 호환용: structured 결과 + 간단 reply 포함"""
    try:
        result = await run_chefmyfridge_workflow(state)
        ingredients = result.get("ingredients") or []
        recipes = result.get("recipes") or []
        nutrition_plan = result.get("nutrition_plan") or {}
        reply = (
            ingredients and recipes
            and f"냉장고 스캔 완료! {len(ingredients)}개 재료로 레시피 {len(recipes)}개와 식단 계획을 생성했어요."
            or "냉장고 스캔을 수행했어요."
        )
        return {"agent_result": {"agent": "CHEFMYFRIDGE", "reply": reply, **result}, "agent_name": "CHEFIE&NUTRI"}
    except Exception as e:
        logger.warning("chefmyfridge_workflow_node failed: %s", e)
        return {"agent_result": {"agent": "CHEFMYFRIDGE", "reply": "스캔 처리에 실패했어요."}, "agent_name": "CHEFMYFRIDGE"}

