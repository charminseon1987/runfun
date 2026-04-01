from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, HTTPException, Query

from app.services.link_preview import assert_safe_http_url, fetch_og_image

router = APIRouter(prefix="/link-preview", tags=["link-preview"])


@router.get("")
async def get_link_preview(
    url: str = Query(..., min_length=7, max_length=2048, description="Page URL to extract preview image from"),
):
    """
    Returns the best-effort representative image URL (og:image, twitter:image, etc.) for a public page.
    Used by the app to show course page thumbnails without client-side scraping.
    """
    parsed = urlparse(url.strip())
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise HTTPException(status_code=400, detail="Invalid URL")

    try:
        assert_safe_http_url(url.strip())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    try:
        image_url = await fetch_og_image(url.strip())
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Upstream returned {e.response.status_code}") from e
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch page: {e!s}") from e

    return {"url": url.strip(), "image_url": image_url}
