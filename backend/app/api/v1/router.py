from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.operations import router as operations_router
from app.api.v1.tracking import router as tracking_router
from app.api.v1.uploads import router as uploads_router

router = APIRouter()


@router.get("/status", tags=["system"])
def api_status() -> dict[str, str]:
    """Return API version status for load balancers and clients."""

    return {"status": "ready", "version": "v1"}


router.include_router(auth_router)
router.include_router(operations_router)
router.include_router(tracking_router)
router.include_router(uploads_router)
