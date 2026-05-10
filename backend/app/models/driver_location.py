from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db_base import Base, TimestampMixin
from app.models.enums import PickupStatus


class DriverLocation(TimestampMixin, Base):
    """Persisted live driver location update for map and websocket consumers."""

    __tablename__ = "driver_locations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    driver_id: Mapped[int] = mapped_column(ForeignKey("drivers.id", ondelete="CASCADE"), nullable=False, index=True)
    pickup_id: Mapped[int] = mapped_column(ForeignKey("pickup_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[PickupStatus] = mapped_column(
        Enum(PickupStatus, values_callable=lambda enum: [item.value for item in enum], native_enum=False),
        nullable=False,
    )
    note: Mapped[str | None] = mapped_column(Text)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    driver = relationship("Driver", back_populates="location_updates")
    pickup = relationship("PickupRequest", back_populates="location_updates")
