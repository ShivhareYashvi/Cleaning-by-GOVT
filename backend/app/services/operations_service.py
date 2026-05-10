from io import StringIO

import pandas as pd
from fastapi import HTTPException, status
from sqlalchemy import Select, desc, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.complaint import Complaint
from app.models.driver import Driver
from app.models.driver_location import DriverLocation
from app.models.enums import ComplaintStatus, DriverAvailability, PickupStatus, RewardSource, WasteType
from app.models.notification import Notification
from app.models.pickup_request import PickupRequest
from app.models.reward import Reward
from app.models.user import User
from app.schemas.analytics import AnalyticsSummary, EfficiencyMetric, WasteDistributionPoint
from app.schemas.complaint import ComplaintCreate, ComplaintRead, ComplaintStatusUpdate
from app.schemas.notification import NotificationCreate, NotificationRead
from app.schemas.pickup_request import PickupAssignment, PickupRequestCreate, PickupRequestRead, PickupStatusUpdate
from app.schemas.reward import RewardCreate, RewardRead, RewardRedeem
from app.schemas.tracking import DriverLocationCreate, DriverLocationRead, DriverRead


class OperationsService:
    """Database-backed operations service for municipal workflows."""

    @staticmethod
    def _extract_area(address: object) -> str:
        normalized = str(address or "").strip()
        if not normalized:
            return "Unknown"
        first_segment = normalized.split(",", maxsplit=1)[0].strip()
        return first_segment or "Unknown"

    @staticmethod
    def _create_empty_pickup_frame() -> pd.DataFrame:
        return pd.DataFrame(
            [
                {
                    "id": -1,
                    "waste_type": waste.value,
                    "status": PickupStatus.PENDING.value,
                    "address": "Unknown",
                }
                for waste in WasteType
            ]
        )

    def create_pickup(self, session: Session, payload: PickupRequestCreate) -> PickupRequestRead:
        self._ensure_user_exists(session, payload.user_id)
        pickup = PickupRequest(
            user_id=payload.user_id,
            waste_type=payload.waste_type,
            scheduled_date=payload.scheduled_date,
            scheduled_time=payload.scheduled_time,
            coordinates=payload.coordinates.model_dump() if hasattr(payload.coordinates, "model_dump") else payload.coordinates,
            notes=payload.notes,
            status=PickupStatus.PENDING,
        )
        available_driver = session.scalar(
            select(Driver).where(Driver.availability == DriverAvailability.AVAILABLE).order_by(Driver.id).limit(1)
        )
        if available_driver is not None:
            pickup.driver_id = available_driver.id
            pickup.status = PickupStatus.ASSIGNED
            available_driver.availability = DriverAvailability.ON_ROUTE
        session.add(pickup)
        try:
            session.commit()
        except IntegrityError as exc:
            session.rollback()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Duplicate pickup already exists for this date and waste type") from exc
        return self._load_pickup(session, pickup.id)

    def assign_pickup(self, session: Session, pickup_id: int, payload: PickupAssignment) -> PickupRequestRead:
        pickup = self._get_pickup_entity(session, pickup_id)
        driver = session.scalar(select(Driver).where(Driver.id == payload.driver_id))
        if driver is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
        pickup.driver_id = payload.driver_id
        pickup.status = PickupStatus.ASSIGNED
        driver.availability = DriverAvailability.ON_ROUTE
        session.commit()
        return self._load_pickup(session, pickup_id)

    def update_pickup_status(self, session: Session, pickup_id: int, payload: PickupStatusUpdate) -> PickupRequestRead:
        pickup = self._get_pickup_entity(session, pickup_id)
        pickup.status = payload.status
        pickup.notes = payload.notes or pickup.notes
        if pickup.driver_id is not None:
            driver = session.scalar(select(Driver).where(Driver.id == pickup.driver_id))
            if driver is not None and payload.status in {PickupStatus.COMPLETED, PickupStatus.CANCELLED}:
                driver.availability = DriverAvailability.AVAILABLE
        session.commit()
        return self._load_pickup(session, pickup_id)

    def list_pickups(self, session: Session, user_id: int | None = None, driver_id: int | None = None) -> list[PickupRequestRead]:
        query: Select[tuple[PickupRequest]] = select(PickupRequest).order_by(desc(PickupRequest.created_at))
        if user_id is not None:
            query = query.where(PickupRequest.user_id == user_id)
        if driver_id is not None:
            query = query.where(PickupRequest.driver_id == driver_id)
        result = session.scalars(query)
        return [PickupRequestRead.model_validate(item) for item in result.all()]

    def create_complaint(self, session: Session, payload: ComplaintCreate) -> ComplaintRead:
        self._ensure_user_exists(session, payload.user_id)
        complaint = Complaint(**payload.model_dump())
        session.add(complaint)
        session.commit()
        session.refresh(complaint)
        return ComplaintRead.model_validate(complaint)

    def update_complaint_status(self, session: Session, complaint_id: int, payload: ComplaintStatusUpdate) -> ComplaintRead:
        complaint = session.scalar(select(Complaint).where(Complaint.id == complaint_id))
        if complaint is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
        complaint.status = payload.status
        session.commit()
        session.refresh(complaint)
        return ComplaintRead.model_validate(complaint)

    def list_complaints(self, session: Session, user_id: int | None = None) -> list[ComplaintRead]:
        query: Select[tuple[Complaint]] = select(Complaint).order_by(desc(Complaint.created_at))
        if user_id is not None:
            query = query.where(Complaint.user_id == user_id)
        result = session.scalars(query)
        return [ComplaintRead.model_validate(item) for item in result.all()]

    def create_reward(self, session: Session, payload: RewardCreate) -> RewardRead:
        self._ensure_user_exists(session, payload.user_id)
        reward = Reward(**payload.model_dump())
        session.add(reward)
        session.commit()
        session.refresh(reward)
        return RewardRead.model_validate(reward)

    def redeem_reward(self, session: Session, reward_id: int, payload: RewardRedeem) -> RewardRead:
        reward = session.scalar(select(Reward).where(Reward.id == reward_id))
        if reward is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reward not found")
        reward.redeemed = payload.redeemed
        session.commit()
        session.refresh(reward)
        return RewardRead.model_validate(reward)

    def list_rewards(self, session: Session, user_id: int | None = None) -> list[RewardRead]:
        query: Select[tuple[Reward]] = select(Reward).order_by(desc(Reward.created_at))
        if user_id is not None:
            query = query.where(Reward.user_id == user_id)
        result = session.scalars(query)
        return [RewardRead.model_validate(item) for item in result.all()]

    def create_notification(self, session: Session, payload: NotificationCreate) -> NotificationRead:
        self._ensure_user_exists(session, payload.user_id)
        notification = Notification(**payload.model_dump())
        session.add(notification)
        session.commit()
        session.refresh(notification)
        return NotificationRead.model_validate(notification)

    def list_drivers(self, session: Session) -> list[DriverRead]:
        result = session.scalars(select(Driver).order_by(Driver.id))
        return [DriverRead.model_validate(item) for item in result.all()]

    def create_location_update(
        self,
        session: Session,
        pickup_id: int,
        payload: DriverLocationCreate,
    ) -> DriverLocationRead:
        pickup = self._get_pickup_entity(session, pickup_id)
        if pickup.driver_id is not None and pickup.driver_id != payload.driver_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Location update driver does not match assigned pickup driver")
        driver = session.scalar(select(Driver).where(Driver.id == payload.driver_id))
        if driver is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
        pickup.driver_id = payload.driver_id
        pickup.status = payload.status
        driver.availability = DriverAvailability.ON_ROUTE if payload.status not in {PickupStatus.COMPLETED, PickupStatus.CANCELLED} else DriverAvailability.AVAILABLE
        location = DriverLocation(pickup_id=pickup_id, **payload.model_dump())
        session.add(location)
        session.commit()
        session.refresh(location)
        return DriverLocationRead.model_validate(location)

    def list_location_updates(self, session: Session, pickup_id: int) -> list[DriverLocationRead]:
        result = session.scalars(
            select(DriverLocation).where(DriverLocation.pickup_id == pickup_id).order_by(DriverLocation.recorded_at)
        )
        return [DriverLocationRead.model_validate(item) for item in result.all()]

    def analytics_summary(self, session: Session) -> AnalyticsSummary:
        pickup_rows = session.execute(
            select(PickupRequest, User.address).join(User, User.id == PickupRequest.user_id)
        )
        reward_rows = session.execute(select(Reward))
        complaint_rows = session.execute(select(Complaint))

        pickup_records = [
            {
                "id": pickup.id,
                "waste_type": pickup.waste_type.value,
                "status": pickup.status.value,
                "address": address,
            }
            for pickup, address in pickup_rows.all()
        ]
        rewards = [row[0] for row in reward_rows.all()]
        complaints = [row[0] for row in complaint_rows.all()]

        pickup_frame = pd.DataFrame(pickup_records) if pickup_records else self._create_empty_pickup_frame()
        complaint_frame = pd.DataFrame(
            [{"status": item.status.value} for item in complaints] or [{"status": ComplaintStatus.OPEN.value}]
        )
        reward_frame = pd.DataFrame(
            [{"points": item.points, "source": item.source.value} for item in rewards]
            or [{"points": 0, "source": RewardSource.RECYCLING_PARTICIPATION.value}]
        )

        waste_distribution = [
            WasteDistributionPoint(waste_type=str(index), requests=int(value))
            for index, value in pickup_frame.groupby("waste_type").size().items()
        ]
        completed = int((pickup_frame["status"] == PickupStatus.COMPLETED.value).sum())
        total = max(len(pickup_records), 1)
        area_series = pickup_frame["address"].map(self._extract_area)
        area_frame = area_series.value_counts().head(5)
        complaint_counts = complaint_frame.groupby("status").size()
        recycling_points = float(
            reward_frame.loc[reward_frame["source"] == RewardSource.RECYCLING_PARTICIPATION.value, "points"].sum()
        )

        return AnalyticsSummary(
            waste_distribution=waste_distribution,
            pickup_efficiency=EfficiencyMetric(label="completed_pickup_ratio", value=round(completed / total * 100, 2)),
            area_wise_pickups=[EfficiencyMetric(label=str(index), value=float(value)) for index, value in area_frame.items()],
            complaint_trends=[EfficiencyMetric(label=str(index), value=float(value)) for index, value in complaint_counts.items()],
            recycling_participation=EfficiencyMetric(label="recycling_reward_points", value=recycling_points),
        )

    def analytics_export_csv(self, session: Session) -> str:
        rows = session.execute(
            select(PickupRequest, User.address)
            .join(User, User.id == PickupRequest.user_id)
            .order_by(desc(PickupRequest.created_at))
        )
        frame = pd.DataFrame(
            [
                {
                    "pickup_id": pickup.id,
                    "user_id": pickup.user_id,
                    "driver_id": pickup.driver_id,
                    "waste_type": pickup.waste_type.value,
                    "status": pickup.status.value,
                    "scheduled_date": pickup.scheduled_date.isoformat(),
                    "scheduled_time": pickup.scheduled_time.isoformat(),
                    "address": address,
                    "latitude": (pickup.coordinates or {}).get("latitude"),
                    "longitude": (pickup.coordinates or {}).get("longitude"),
                    "notes": pickup.notes,
                    "created_at": pickup.created_at.isoformat(),
                }
                for pickup, address in rows.all()
            ]
        )
        if frame.empty:
            frame = pd.DataFrame(
                columns=[
                    "pickup_id",
                    "user_id",
                    "driver_id",
                    "waste_type",
                    "status",
                    "scheduled_date",
                    "scheduled_time",
                    "address",
                    "latitude",
                    "longitude",
                    "notes",
                    "created_at",
                ]
            )
        buffer = StringIO()
        frame.to_csv(buffer, index=False)
        return buffer.getvalue()

    def _load_pickup(self, session: Session, pickup_id: int) -> PickupRequestRead:
        pickup = session.scalar(select(PickupRequest).where(PickupRequest.id == pickup_id))
        if pickup is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pickup not found")
        return PickupRequestRead.model_validate(pickup)

    def _get_pickup_entity(self, session: Session, pickup_id: int) -> PickupRequest:
        pickup = session.scalar(select(PickupRequest).where(PickupRequest.id == pickup_id))
        if pickup is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pickup not found")
        return pickup

    def _ensure_user_exists(self, session: Session, user_id: int) -> None:
        user = session.scalar(select(User).where(User.id == user_id))
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")


operations_service = OperationsService()
