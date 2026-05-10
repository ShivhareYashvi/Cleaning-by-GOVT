from datetime import date, time
from typing import Any

from sqlalchemy import Date, Enum, ForeignKey, Integer, JSON, Text, Time, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db_base import Base, TimestampMixin
from app.models.enums import PickupStatus, WasteType


class PickupRequest(TimestampMixin, Base):
    """Citizen waste collection request with duplicate-prevention constraint."""

    __tablename__ = "pickup_requests"
    __table_args__ = (UniqueConstraint("user_id", "waste_type", "scheduled_date", name="uq_pickup_user_waste_date"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    driver_id: Mapped[int | None] = mapped_column(ForeignKey("drivers.id", ondelete="SET NULL"), index=True)
    waste_type: Mapped[WasteType] = mapped_column(
        Enum(WasteType, values_callable=lambda enum: [item.value for item in enum], native_enum=False),
        nullable=False,
    )
    status: Mapped[PickupStatus] = mapped_column(
        Enum(PickupStatus, values_callable=lambda enum: [item.value for item in enum], native_enum=False),
        default=PickupStatus.PENDING,
        nullable=False,
    )
    scheduled_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    scheduled_time: Mapped[time] = mapped_column(Time, nullable=False)
    coordinates: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    notes: Mapped[str | None] = mapped_column(Text)

    user = relationship("User", back_populates="pickup_requests", foreign_keys=[user_id])
    driver = relationship("Driver", back_populates="pickup_requests", foreign_keys=[driver_id])
    location_updates = relationship("DriverLocation", back_populates="pickup", cascade="all, delete-orphan")
