from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.core.config import get_settings
from app.schemas.upload import UploadResponse

settings = get_settings()
router = APIRouter(prefix="/uploads", tags=["uploads"])
ALLOWED_CONTENT_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/webp"}
BYTES_PER_MB = 1024 * 1024


@router.post("/electricity-bills", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_electricity_bill(file: UploadFile = File(...)) -> UploadResponse:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type")

    extension = Path(file.filename or "bill").suffix or ".bin"
    destination_dir = Path(settings.upload_dir) / "electricity-bills"
    destination_dir.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid4().hex}{extension.lower()}"
    destination = destination_dir / stored_name

    content = await file.read()
    if len(content) > settings.max_upload_size_mb * BYTES_PER_MB:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file exceeds the configured size limit")
    destination.write_bytes(content)

    relative_path = f"electricity-bills/{stored_name}"
    return UploadResponse(
        file_name=file.filename or stored_name,
        stored_path=relative_path,
        public_url=f"/uploads/{relative_path}",
    )
