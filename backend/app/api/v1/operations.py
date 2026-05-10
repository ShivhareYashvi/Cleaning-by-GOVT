from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.analytics import AnalyticsSummary
from app.schemas.complaint import ComplaintCreate, ComplaintRead, ComplaintStatusUpdate
from app.schemas.notification import NotificationCreate, NotificationRead
from app.schemas.pickup_request import PickupAssignment, PickupRequestCreate, PickupRequestRead, PickupStatusUpdate
from app.schemas.reward import RewardCreate, RewardRead, RewardRedeem
from app.schemas.tracking import DriverRead
from app.services.operations_service import operations_service

router = APIRouter(tags=["operations"])


@router.post("/pickups", response_model=PickupRequestRead, status_code=status.HTTP_201_CREATED)
def create_pickup(payload: PickupRequestCreate, session: Session = Depends(get_db)) -> PickupRequestRead:
    return operations_service.create_pickup(session, payload)


@router.get("/pickups", response_model=list[PickupRequestRead])
def list_pickups(
    user_id: int | None = Query(default=None),
    driver_id: int | None = Query(default=None),
    session: Session = Depends(get_db),
) -> list[PickupRequestRead]:
    return operations_service.list_pickups(session, user_id=user_id, driver_id=driver_id)


@router.patch("/pickups/{pickup_id}/assign", response_model=PickupRequestRead)
def assign_pickup(
    pickup_id: int,
    payload: PickupAssignment,
    session: Session = Depends(get_db),
) -> PickupRequestRead:
    return operations_service.assign_pickup(session, pickup_id, payload)


@router.patch("/pickups/{pickup_id}/status", response_model=PickupRequestRead)
def update_pickup_status(
    pickup_id: int,
    payload: PickupStatusUpdate,
    session: Session = Depends(get_db),
) -> PickupRequestRead:
    return operations_service.update_pickup_status(session, pickup_id, payload)


@router.post("/complaints", response_model=ComplaintRead, status_code=status.HTTP_201_CREATED)
def create_complaint(payload: ComplaintCreate, session: Session = Depends(get_db)) -> ComplaintRead:
    return operations_service.create_complaint(session, payload)


@router.get("/complaints", response_model=list[ComplaintRead])
def list_complaints(user_id: int | None = Query(default=None), session: Session = Depends(get_db)) -> list[ComplaintRead]:
    return operations_service.list_complaints(session, user_id=user_id)


@router.patch("/complaints/{complaint_id}/status", response_model=ComplaintRead)
def update_complaint_status(
    complaint_id: int,
    payload: ComplaintStatusUpdate,
    session: Session = Depends(get_db),
) -> ComplaintRead:
    return operations_service.update_complaint_status(session, complaint_id, payload)


@router.post("/rewards", response_model=RewardRead, status_code=status.HTTP_201_CREATED)
def create_reward(payload: RewardCreate, session: Session = Depends(get_db)) -> RewardRead:
    return operations_service.create_reward(session, payload)


@router.get("/rewards", response_model=list[RewardRead])
def list_rewards(user_id: int | None = Query(default=None), session: Session = Depends(get_db)) -> list[RewardRead]:
    return operations_service.list_rewards(session, user_id=user_id)


@router.patch("/rewards/{reward_id}/redeem", response_model=RewardRead)
def redeem_reward(reward_id: int, payload: RewardRedeem, session: Session = Depends(get_db)) -> RewardRead:
    return operations_service.redeem_reward(session, reward_id, payload)


@router.post("/notifications", response_model=NotificationRead, status_code=status.HTTP_201_CREATED)
def create_notification(payload: NotificationCreate, session: Session = Depends(get_db)) -> NotificationRead:
    return operations_service.create_notification(session, payload)


@router.get("/drivers", response_model=list[DriverRead])
def list_drivers(session: Session = Depends(get_db)) -> list[DriverRead]:
    return operations_service.list_drivers(session)


@router.get("/analytics/summary", response_model=AnalyticsSummary)
def analytics_summary(session: Session = Depends(get_db)) -> AnalyticsSummary:
    return operations_service.analytics_summary(session)


@router.get("/analytics/export.csv")
def analytics_export_csv(session: Session = Depends(get_db)) -> Response:
    csv_content = operations_service.analytics_export_csv(session)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="ecosync-analytics.csv"'},
    )
