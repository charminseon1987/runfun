import uuid

from fastapi import APIRouter, Depends

from app.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/media", tags=["media"])


@router.post("/upload-url")
async def gcs_upload_url(
    user: User = Depends(get_current_user),
    content_type: str = "image/jpeg",
):
    """Stub signed URL — replace with google-cloud-storage generate_signed_url."""
    key = f"uploads/{user.id}/{uuid.uuid4()}"
    return {
        "upload_url": f"https://storage.googleapis.com/runmate-bucket/{key}?upload=stub",
        "public_url": f"https://storage.googleapis.com/runmate-bucket/{key}",
        "note": "Configure GCS bucket + IAM for production",
    }
