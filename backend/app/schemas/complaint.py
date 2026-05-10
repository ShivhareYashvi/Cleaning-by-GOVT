from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import ComplaintCategory, ComplaintStatus


class ComplaintBase(BaseModel):
    category: ComplaintCategory
    description: str = Field(min_length=10, max_length=2000)
    image: str | None = Field(default=None, max_length=512)


class ComplaintCreate(ComplaintBase):
    user_id: int


class ComplaintStatusUpdate(BaseModel):
    status: ComplaintStatus


class ComplaintRead(ComplaintBase):
    id: int
    user_id: int
    status: ComplaintStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
