from __future__ import annotations

import base64
import logging
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException

logger = logging.getLogger("yolo-service")
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="YOLO Detect Service")


FOOD_CLASSES: dict[str, str] = {
    # YOLO 모델이 어떤 라벨을 쓰는지에 따라 달라집니다.
    # 기본적으로 들어오는 class_name을 그대로 사용하되, 일부만 한국어로 보정합니다.
    "broccoli": "브로콜리",
    "banana": "바나나",
    "egg": "계란",
    "tofu": "두부",
    "onion": "양파",
    "carrot": "당근",
    "potato": "감자",
    "rice": "밥",
    "milk": "우유",
    "salmon": "연어",
    "beef": "소고기",
    "pork": "돼지고기",
    "pasta": "파스타",
}


def _decode_data_url(url: str) -> tuple[bytes, str]:
    # data:image/jpeg;base64,XXXX
    try:
        header, b64 = url.split(",", 1)
        ct = header.split(";")[0].split(":")[1] if ":" in header else "image/jpeg"
        return base64.b64decode(b64), ct
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid data URL")


async def _download_image(image_url: str) -> bytes:
    if image_url.startswith("data:"):
        raw, _ct = _decode_data_url(image_url)
        return raw
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            res = await client.get(image_url)
            res.raise_for_status()
            return res.content
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image download failed: {str(e)}")


def _run_yolo(image_bytes: bytes, conf_threshold: float = 0.4) -> list[dict[str, Any]]:
    """
    ultralytics 사용 시:
    - model = YOLO(model_path)
    - results = model(image_bytes)
    여기서는 가중치/ultralytics 미설치 환경을 고려해 안전 폴백을 제공합니다.
    """
    try:
        from ultralytics import YOLO  # type: ignore
    except Exception as e:
        logger.warning("ultralytics not available: %s", e)
        return []

    import os

    model_path = os.getenv("YOLO_MODEL_PATH", "yolov8n.pt")
    if not os.path.exists(model_path):
        logger.warning("YOLO model not found: %s", model_path)
        return []

    model = YOLO(model_path)
    results = model.predict(image_bytes, conf=conf_threshold, verbose=False)
    if not results:
        return []

    # 단일 이미지 기준 첫 결과 사용
    r0 = results[0]
    out: list[dict[str, Any]] = []

    names = getattr(model, "names", {}) or {}
    boxes = getattr(r0, "boxes", None)
    if boxes is None:
        return []

    for b in boxes:
        cls_id = int(getattr(b, "cls", 0))
        conf = float(getattr(b, "conf", 0.0))
        if conf < conf_threshold:
            continue
        class_name = names.get(cls_id, str(cls_id))
        food_name = FOOD_CLASSES.get(str(class_name), str(class_name))
        out.append(
            {
                "name": food_name,
                "confidence": conf,
                "quantity": 1,
                "unit": "개",
                "category": "기타",
            }
        )
    return out


@app.post("/detect")
async def detect(payload: dict[str, Any]) -> dict[str, Any]:
    """
    요청: { "image_url": "https://..." } 또는 data URL
    응답: { "ingredients": [ {name,confidence,quantity,unit,category}, ... ] }
    """
    image_url = payload.get("image_url")
    if not image_url or not isinstance(image_url, str):
        raise HTTPException(status_code=400, detail="image_url is required")

    image_bytes = await _download_image(image_url)
    items = _run_yolo(image_bytes)

    # PRD: confidence 0.4 이상만 반환 (이미 _run_yolo에서 처리)
    return {"ingredients": items}

