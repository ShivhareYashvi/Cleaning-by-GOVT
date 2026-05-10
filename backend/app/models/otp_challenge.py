from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db_base import Base, TimestampMixin


class OTPChallenge(TimestampMixin, Base):
    """Persisted OTP challenge for SMS verification workflows."""

    __tablename__ = "otp_challenges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    phone: Mapped[str] = mapped_column(String(30), index=True, nullable=False)
    code_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    delivery_channel: Mapped[str] = mapped_column(String(30), default="sms", nullable=False)
    delivery_reference: Mapped[str | None] = mapped_column(String(255))
