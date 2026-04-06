from __future__ import annotations

import base64
import json
from typing import Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.agents.chefmyfridge_workflow import run_chefie_nutri_workflow, run_chefmyfridge_workflow
from app.services.fridge_storage import upload_fridge_image_bytes
from app.services.jwt_tokens import decode_token

router = APIRouter(prefix="/agent/fridge", tags=["fridge"])
security = HTTPBearer(auto_error=False)


async def get_user_id_from_auth(
    creds: HTTPAuthorizationCredentials | None = Depends(security),
) -> str | None:
    # DB 조회 없이 토큰만 디코드해서 user_id를 넣습니다.
    # 로컬에서는 DATABASE_URL이 비어 있을 수 있으므로 DB 의존성을 제거합니다.
    if creds is None or not creds.credentials:
        return None
    uid = decode_token(creds.credentials)
    return str(uid) if uid else None


def _build_running_session(distance_km: float | None, calories: float | None) -> dict[str, Any] | None:
    if distance_km is None and calories is None:
        return None
    return {"distance_km": distance_km, "calories": calories}


def _make_data_url(raw: bytes, content_type: str) -> str:
    b64 = base64.b64encode(raw).decode("utf-8")
    return f"data:{content_type};base64,{b64}"


@router.post("/scan")
async def scan_fridge(
    user_id: str | None = Depends(get_user_id_from_auth),
    file: UploadFile | None = File(default=None),
    image_url: str | None = Form(default=None),
    diet_goal: str = Form(default="maintain"),
    distance_km: float | None = Form(default=None),
    calories: float | None = Form(default=None),
):
    """
    냉장고 이미지 스캔
    - file: 카메라/갤러리 업로드 파일
    - image_url: URL 또는 data URL
    """
    try:
        if file is not None:
            raw = await file.read()
            ct = file.content_type or "image/jpeg"
            public = await upload_fridge_image_bytes(raw, ct)
            image_url = public or _make_data_url(raw, ct)
        if not image_url:
            raise HTTPException(status_code=400, detail="image_url 또는 file이 필요합니다.")

        running_session = _build_running_session(distance_km, calories)

        result = await run_chefmyfridge_workflow(
            {
                "user_id": user_id or "",
                "image_url": image_url,
                "running_session": running_session,
                "diet_goal": diet_goal,
                "goal": diet_goal,
            }
        )

        fridgy_comment = (result.get("agent_result") or {}).get("fridgy", {}).get("fridgy_comment")
        return {
            "success": True,
            "ingredients": result.get("ingredients") or [],
            "recipes": result.get("recipes") or [],
            "nutrition_plan": result.get("nutrition_plan") or {},
            "fridgy_comment": fridgy_comment,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"fridge scan failed: {str(e)}")


@router.post("/plan")
async def plan_from_ingredients(
    user_id: str | None = Depends(get_user_id_from_auth),
    ingredients_json: str = Form(default="[]"),
    diet_goal: str = Form(default="maintain"),
    distance_km: float | None = Form(default=None),
    calories: float | None = Form(default=None),
):
    """
    재료 기반 플랜 생성
    - ingredients_json: agents에서 사용하는 ingredients 배열 JSON string
    """
    try:
        try:
            ingredients = json.loads(ingredients_json or "[]")
        except Exception:
            ingredients = []

        running_session = _build_running_session(distance_km, calories)

        result = await run_chefie_nutri_workflow(
            {
                "user_id": user_id or "",
                "ingredients": ingredients,
                "running_session": running_session,
                "diet_goal": diet_goal,
                "goal": diet_goal,
            }
        )
        return {
            "success": True,
            "ingredients": result.get("ingredients") or [],
            "recipes": result.get("recipes") or [],
            "nutrition_plan": result.get("nutrition_plan") or {},
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"fridge plan failed: {str(e)}")

