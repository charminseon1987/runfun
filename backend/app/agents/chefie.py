"""CHEFIE - 운동 후 회복 레시피 생성 에이전트"""

from __future__ import annotations

import json
import logging
from typing import Any

from app.agents.base_agent import call_claude
from app.agents.state import RunMateState

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "당신은 운동 후 회복에 최적화된 레시피를 만드는 전문 요리사 CHEFIE입니다.\n"
    "FRIDGY가 인식한 ingredients와 사용자의 running_session(distance_km, calories)를 받아\n"
    "회복에 유리한 단백질/탄수화물/지방 밸런스의 레시피 3개를 생성합니다.\n\n"
    "각 레시피는 반드시 아래 필드를 포함하고 JSON만 반환하세요:\n"
    "{\n"
    '  "recipes": [\n'
    "    {\n"
    '      "title": "레시피 제목",\n'
    '      "description": "짧은 설명",\n'
    '      "calories": 450,\n'
    '      "protein_g": 35,\n'
    '      "carb_g": 45,\n'
    '      "fat_g": 12,\n'
    '      "steps": ["1단계 ...", "2단계 ..."],\n'
    '      "missing_ingredients": ["추가로 필요한 재료"]\n'
    "    }\n"
    "  ]\n"
    "}\n"
    "- missing_ingredients는 ingredients에 없는 재료로만 작성하세요.\n"
)


def _safe_parse_json(raw: Any) -> dict[str, Any]:
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


def _fallback_recipes(ingredients: list[dict[str, Any]], calories: float | None) -> list[dict[str, Any]]:
    ing_names = [str(i.get("name", "")).strip() for i in (ingredients or []) if i.get("name")]
    base = float(calories or 600)
    # 프롬프트 기반 모델이 실패할 때도 형태를 유지하기 위한 기본 보정
    missing_base = ["소금(기호)", "올리브오일(기호)"]
    missing_filtered = [x for x in missing_base if x not in ing_names]
    return [
        {
            "title": "단백질 회복 보울",
            "description": "운동 후 회복에 초점을 둔 따뜻한 보울 레시피",
            "calories": int(base * 0.35),
            "protein_g": 35,
            "carb_g": 45,
            "fat_g": 12,
            "steps": ["재료를 손질한다.", "팬에 가볍게 조리한 뒤 섞는다.", "따뜻할 때 섭취한다."],
            "missing_ingredients": missing_filtered,
        },
        {
            "title": "고단백 샐러드 플레이트",
            "description": "신선한 채소와 단백질을 균형 있게",
            "calories": int(base * 0.3),
            "protein_g": 30,
            "carb_g": 40,
            "fat_g": 14,
            "steps": ["채소를 세척/손질한다.", "단백질을 조리해 곁들인다.", "드레싱을 추가한다."],
            "missing_ingredients": [],
        },
        {
            "title": "회복 수프 + 곁들임",
            "description": "소화가 쉬운 회복형 수프",
            "calories": int(base * 0.25),
            "protein_g": 25,
            "carb_g": 35,
            "fat_g": 10,
            "steps": ["냄비에 재료를 넣고 끓인다.", "농도를 조절한다.", "마무리 간을 한다."],
            "missing_ingredients": [],
        },
    ]


async def chefie_node(state: RunMateState) -> dict[str, Any]:
    ingredients = state.get("ingredients") or []
    running = state.get("running_session") or {}
    distance_km = running.get("distance_km")
    calories = running.get("calories")

    # Claude 호출 실패 시에도 구조가 유지되도록 fallback 준비
    fallback = {"recipes": _fallback_recipes(ingredients, calories)}

    try:
        user_message = {
            "ingredients": ingredients,
            "running_session": running,
            "distance_km": distance_km,
            "calories": calories,
        }
        reply = await call_claude(
            SYSTEM_PROMPT,
            json.dumps(user_message, ensure_ascii=False),
            context={"running_session": running},
        )
        parsed = _safe_parse_json(reply)
        recipes = parsed.get("recipes")
        if not isinstance(recipes, list) or not recipes:
            return {"agent_result": {"agent": "CHEFIE", "recipes": fallback["recipes"]}, "agent_name": "CHEFIE"}
        return {
            "agent_result": {"agent": "CHEFIE", "recipes": recipes},
            "agent_name": "CHEFIE",
        }
    except Exception as e:
        logger.warning("CHEFIE failed: %s", e)
        return {"agent_result": {"agent": "CHEFIE", "recipes": fallback["recipes"]}, "agent_name": "CHEFIE"}

