from datetime import date, datetime, time
from typing import Any

from pydantic import BaseModel, Field

from app.models.enums import PickupStatus, WasteType


class Coordinates(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class PickupRequestBase(BaseModel):
    waste_type: WasteType
    scheduled_date: date
    scheduled_time: time
    coordinates: Coordinates | dict[str, Any] | None = None
    notes: str | None = Field(default=None, max_length=1000)


class PickupRequestCreate(PickupRequestBase):
    user_id: int


class PickupAssignment(BaseModel):
    driver_id: int


class PickupStatusUpdate(BaseModel):
    status: PickupStatus
    notes: str | None = Field(default=None, max_length=1000)


class PickupRequestRead(PickupRequestBase):
    id: int
    user_id: int
    driver_id: int | None
    status: PickupStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
