from sqlalchemy import Boolean, Enum, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db_base import Base, TimestampMixin
from app.models.enums import UserRole


class User(TimestampMixin, Base):
    """Platform account for citizens, drivers, and municipal admins."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, values_callable=lambda enum: [item.value for item in enum], native_enum=False),
        default=UserRole.CITIZEN,
        nullable=False,
    )
    address: Mapped[str] = mapped_column(Text, nullable=False)
    verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    household_id: Mapped[str | None] = mapped_column(String(64), unique=True, index=True)
    electricity_bill_path: Mapped[str | None] = mapped_column(String(512))

    pickup_requests = relationship("PickupRequest", back_populates="user", foreign_keys="PickupRequest.user_id")
    complaints = relationship("Complaint", back_populates="user")
    rewards = relationship("Reward", back_populates="user")
    driver_profile = relationship("Driver", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user")
