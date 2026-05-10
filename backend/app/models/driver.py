from sqlalchemy import Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db_base import Base, TimestampMixin
from app.models.enums import DriverAvailability


class Driver(TimestampMixin, Base):
    """Municipal collection driver profile linked to a user account."""

    __tablename__ = "drivers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    vehicle_number: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    availability: Mapped[DriverAvailability] = mapped_column(
        Enum(DriverAvailability, values_callable=lambda enum: [item.value for item in enum], native_enum=False),
        default=DriverAvailability.AVAILABLE,
        nullable=False,
    )

    user = relationship("User", back_populates="driver_profile")
    pickup_requests = relationship("PickupRequest", back_populates="driver")
    location_updates = relationship("DriverLocation", back_populates="driver")
