"""FRIDGY - 냉장고 이미지 기반 식재료 인식 에이전트"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

import httpx

from app.agents.base_agent import call_claude_with_fridge_image
from app.agents.state import RunMateState

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "당신은 탐정 같은 꼼꼼한 말투의 식재료 인식 에이전트 FRIDGY입니다.\n"
    "첨부된 냉장고 사진을 직접 보고, YOLO 감지 결과(JSON)를 참고해\n"
    "정밀 식재료 분류와 수량 추정을 수행합니다.\n\n"
    "반드시 아래 JSON 형식을 반환하세요(텍스트 말고 JSON만):\n"
    "{\n"
    '  "ingredients": [\n'
    "    {\n"
    '      "name": "식재료명",\n'
    '      "category": "채소|단백질|곡물|유제품|조미료|기타",\n'
    '      "quantity": 1, \n'
    '      "unit": "개|장|g|ml|팩|1인분",\n'
    '      "confidence": 0.85\n'
    "    }\n"
    "  ],\n"
    '  "fridgy_comment": "탐정처럼 짧게 코멘트"\n'
    "}\n\n"
    "- confidence가 0.4 미만이면 '미확인 식품'으로 이름을 치환하고 category는 '기타'로 처리\n"
    "- 수량/단위가 불명확하면 quantity=1, unit='개'로 보정\n"
)


def _normalize_ingredients(yolo_items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for it in yolo_items or []:
        name = str(it.get("name") or it.get("label") or it.get("class") or "").strip()
        conf_raw = it.get("confidence", it.get("conf", 0))
        try:
            conf = float(conf_raw)
        except Exception:
            conf = 0.0

        if conf < 0.4:
            name = "미확인 식품"

        category = str(it.get("category") or "").strip()
        if not category:
            category = "기타"

        # quantity/unit은 YOLO 응답 포맷에 따라 다를 수 있으니 방어적으로 처리
        q = it.get("quantity", 1)
        try:
            quantity = float(q)
        except Exception:
            quantity = 1
        if quantity <= 0:
            quantity = 1

        unit = str(it.get("unit") or "").strip() or "개"

        out.append(
            {
                "name": name,
                "category": category,
                "quantity": quantity,
                "unit": unit,
                "confidence": conf,
            }
        )

    return out


def _parse_json_from_model(text: str) -> dict[str, Any]:
    if not text or not isinstance(text, str):
        return {}
    s = text.strip()
    if s.startswith("```"):
        s = re.sub(r"^```[a-zA-Z0-9]*\s*", "", s)
        s = re.sub(r"\s*```$", "", s).strip()
    try:
        obj = json.loads(s)
        return obj if isinstance(obj, dict) else {}
    except Exception:
        return {}


async def _call_yolo_detect(image_url: str) -> list[dict[str, Any]]:
    try:
        import os

        base = os.getenv("YOLO_SERVICE_URL", "").strip()
        detect_url = f"{base.rstrip('/')}/detect" if base else "http://yolo-service:8001/detect"

        async with httpx.AsyncClient(timeout=60) as client:
            res = await client.post(detect_url, json={"image_url": image_url})
            res.raise_for_status()
            data = res.json()
            if isinstance(data, list):
                return data
            # 예상 가능한 응답 키를 여러 케이스로 대응
            for key in ["ingredients", "items", "detections"]:
                if key in data and isinstance(data[key], list):
                    return data[key]
            return []
    except Exception as e:
        logger.warning("YOLO detect failed: %s", e)
        return []


async def fridgy_node(state: RunMateState) -> dict[str, Any]:
    """state.image_url을 받아 ingredients[]와 fridgy_comment 생성"""
    image_url = state.get("image_url")
    if not image_url:
        return {
            "agent_result": {"agent": "FRIDGY", "ingredients": [], "fridgy_comment": "이미지 URL이 필요해요."},
            "agent_name": "FRIDGY",
        }

    yolo_items = await _call_yolo_detect(image_url)
    normalized = _normalize_ingredients(yolo_items)

    # Claude Vision + YOLO 힌트로 정밀 보정 (키/실패 시 YOLO 정규화 폴백)
    try:
        user_message = (
            "아래 YOLO 감지 JSON을 참고만 하고, 사진을 우선해 최종 ingredients를 결정하세요.\n"
            f"yolo_raw: {json.dumps(yolo_items, ensure_ascii=False)}\n"
            f"yolo_normalized: {json.dumps(normalized, ensure_ascii=False)}"
        )
        reply = await call_claude_with_fridge_image(
            SYSTEM_PROMPT,
            user_message,
            image_url,
            context_dict=None,
            max_tokens=1200,
        )
        parsed = _parse_json_from_model(reply)
        ingredients = parsed.get("ingredients") or normalized
        comment = parsed.get("fridgy_comment") or "탐정의 결론: 재료 흔적을 확인했어요."
        if not ingredients and normalized:
            ingredients = normalized
            comment = comment or "탐정의 결론: YOLO 기반으로 재료를 추정했어요."
    except Exception as e:
        logger.warning("FRIDGY Claude refine failed: %s", e)
        ingredients = normalized
        comment = "탐정의 결론: YOLO 기반으로 재료를 추정했어요."

    return {
        "agent_result": {
            "agent": "FRIDGY",
            "ingredients": ingredients,
            "fridgy_comment": comment,
        },
        "agent_name": "프리드지",
    }

