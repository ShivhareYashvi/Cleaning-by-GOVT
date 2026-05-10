from sqlalchemy import Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db_base import Base, TimestampMixin
from app.models.enums import ComplaintCategory, ComplaintStatus


class Complaint(TimestampMixin, Base):
    """Citizen complaint record for municipal issue resolution."""

    __tablename__ = "complaints"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category: Mapped[ComplaintCategory] = mapped_column(
        Enum(ComplaintCategory, values_callable=lambda enum: [item.value for item in enum], native_enum=False),
        nullable=False,
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    image: Mapped[str | None] = mapped_column(String(512))
    status: Mapped[ComplaintStatus] = mapped_column(
        Enum(ComplaintStatus, values_callable=lambda enum: [item.value for item in enum], native_enum=False),
        default=ComplaintStatus.OPEN,
        nullable=False,
    )

    user = relationship("User", back_populates="complaints")
