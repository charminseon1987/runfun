"""NUTRI - 목표 기반 식단 계획 생성 에이전트"""

from __future__ import annotations

import json
import logging
from typing import Any

from app.agents.base_agent import call_claude
from app.agents.state import RunMateState

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "당신은 영양관리/식단계획 전문 에이전트 NUTRI입니다.\n"
    "CHEFIE가 생성한 recipes(각 레시피의 calories, protein_g, carb_g, fat_g)와 목표(goal)를 받아\n"
    "하루/주간 영양 중심 식단 계획 nutrition_plan을 생성합니다.\n\n"
    "반드시 JSON만 반환하세요:\n"
    "{\n"
    '  "goal": "감량|유지|증량",\n'
    '  "daily_plan": [\n'
    '     {"day": 1, "meals": [{"meal_type":"breakfast|lunch|dinner","menu":"메뉴","target_kcal":500}]} \n'
    "  ],\n"
    '  "weekly_plan": [\n'
    '     {"week_day":"Mon","breakfast":"...","lunch":"...","dinner":"..."}\n'
    "  ],\n"
    '  "notes": ["팁1","팁2"]\n'
    "}\n"
)


def _safe_json(raw: Any) -> dict[str, Any]:
    if raw is None:
        return {}
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str):
        try:
            return json.loads(raw)
        except Exception:
            return {}
    return {}


def _fallback_nutrition_plan(goal: str, recipes: list[dict[str, Any]], days: int = 7) -> dict[str, Any]:
    # recipes를 단순 순환 배치
    r = recipes or []
    if not r:
        return {"goal": goal, "daily_plan": [], "weekly_plan": [], "notes": ["레시피 데이터가 없어 기본 계획만 제공합니다."]}
    day_plans = []
    for d in range(1, max(1, min(days, 7)) + 1):
        picks = [r[(d - 1) % len(r)], r[(d) % len(r)], r[(d + 1) % len(r)]]
        day_plans.append(
            {
                "day": d,
                "meals": [
                    {"meal_type": "breakfast", "menu": picks[0].get("title", "레시피"), "target_kcal": picks[0].get("calories", 500)},
                    {"meal_type": "lunch", "menu": picks[1].get("title", "레시피"), "target_kcal": picks[1].get("calories", 600)},
                    {"meal_type": "dinner", "menu": picks[2].get("title", "레시피"), "target_kcal": picks[2].get("calories", 550)},
                ],
            }
        )
    week_days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    weekly = []
    for i in range(min(days, 7)):
        p = r[i % len(r)].get("title", "레시피")
        weekly.append({"week_day": week_days[i], "breakfast": p, "lunch": p, "dinner": p})
    return {"goal": goal, "daily_plan": day_plans, "weekly_plan": weekly, "notes": ["수분 섭취와 스트레칭을 병행하세요."]}


async def nutri_node(state: RunMateState) -> dict[str, Any]:
    recipes = state.get("recipes") or []
    goal = state.get("goal") or state.get("diet_goal") or "유지"

    # CHEFIE calories 매칭을 위해 goal/레이블 정규화
    goal_map = {
        "lose": "감량",
        "maintain": "유지",
        "gain": "증량",
        "감량": "감량",
        "유지": "유지",
        "증량": "증량",
    }
    normalized_goal = goal_map.get(str(goal).lower(), "유지")

    try:
        reply = await call_claude(
            SYSTEM_PROMPT,
            json.dumps({"goal": normalized_goal, "recipes": recipes}, ensure_ascii=False),
            context={"goal": normalized_goal},
        )
        parsed = _safe_json(reply)
        if not parsed or not parsed.get("weekly_plan"):
            return {"agent_result": {"agent": "NUTRI", "nutrition_plan": _fallback_nutrition_plan(normalized_goal, recipes)}, "agent_name": "NUTRI"}
        return {"agent_result": {"agent": "NUTRI", "nutrition_plan": parsed}, "agent_name": "NUTRI"}
    except Exception as e:
        logger.warning("NUTRI failed: %s", e)
        return {"agent_result": {"agent": "NUTRI", "nutrition_plan": _fallback_nutrition_plan(normalized_goal, recipes)}, "agent_name": "NUTRI"}

