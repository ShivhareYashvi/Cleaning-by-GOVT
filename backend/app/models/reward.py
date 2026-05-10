from sqlalchemy import Boolean, Enum, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db_base import Base, TimestampMixin
from app.models.enums import RewardSource


class Reward(TimestampMixin, Base):
    """Reward points issued for sustainable citizen participation."""

    __tablename__ = "rewards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    points: Mapped[int] = mapped_column(Integer, nullable=False)
    source: Mapped[RewardSource] = mapped_column(
        Enum(RewardSource, values_callable=lambda enum: [item.value for item in enum], native_enum=False),
        nullable=False,
    )
    redeemed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="rewards")
