from datetime import datetime

from pydantic import BaseModel, Field


class NotificationBase(BaseModel):
    message: str = Field(min_length=1, max_length=1000)


class NotificationCreate(NotificationBase):
    user_id: int


class NotificationRead(NotificationBase):
    id: int
    user_id: int
    sent_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
