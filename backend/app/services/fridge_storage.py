"""Supabase Storage에 냉장고 이미지 업로드 (설정 없으면 None 반환)."""

from __future__ import annotations

import logging
import uuid

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)


def _normalize_base(url: str) -> str:
    return url.rstrip("/")


async def upload_fridge_image_bytes(raw: bytes, content_type: str) -> str | None:
    """
    업로드 성공 시 공개 URL(버킷이 public일 때)을 반환합니다.
    버킷이 private이면 Storage signed URL 로직이 별도로 필요합니다.
    """
    settings = get_settings()
    base = (settings.supabase_url or "").strip()
    key = (settings.supabase_service_role_key or "").strip()
    bucket = (settings.fridge_storage_bucket or "fridge-images").strip()

    if not base or not key or not raw:
        return None

    uid = uuid.uuid4().hex
    ext = "png" if content_type and "png" in content_type.lower() else "jpg"
    object_path = f"fridge/{uid}.{ext}"

    upload_url = f"{_normalize_base(base)}/storage/v1/object/{bucket}/{object_path}"

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            res = await client.post(
                upload_url,
                content=raw,
                headers={
                    "Authorization": f"Bearer {key}",
                    "apikey": key,
                    "Content-Type": content_type or "image/jpeg",
                },
            )
            if res.status_code not in (200, 201):
                logger.warning("Supabase upload failed: %s %s", res.status_code, res.text[:200])
                return None
    except Exception as e:
        logger.warning("Supabase upload error: %s", e)
        return None

    # Public bucket 가정 (PRD: fridge-images). private이면 여기서 signed URL로 교체 필요.
    public_url = f"{_normalize_base(base)}/storage/v1/object/public/{bucket}/{object_path}"
    return public_url
