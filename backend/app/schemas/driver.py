from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import DriverAvailability


class DriverBase(BaseModel):
    vehicle_number: str = Field(min_length=3, max_length=40)
    availability: DriverAvailability = DriverAvailability.AVAILABLE


class DriverCreate(DriverBase):
    user_id: int


class DriverUpdate(BaseModel):
    vehicle_number: str | None = Field(default=None, min_length=3, max_length=40)
    availability: DriverAvailability | None = None


class DriverRead(DriverBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
