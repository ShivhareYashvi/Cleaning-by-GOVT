from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import DriverAvailability, PickupStatus


class DriverRead(BaseModel):
    id: int
    user_id: int
    vehicle_number: str
    availability: DriverAvailability

    model_config = {"from_attributes": True}


class DriverLocationCreate(BaseModel):
    driver_id: int
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    status: PickupStatus
    note: str | None = Field(default=None, max_length=1000)


class DriverLocationRead(BaseModel):
    id: int
    driver_id: int
    pickup_id: int
    latitude: float
    longitude: float
    status: PickupStatus
    note: str | None
    recorded_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
