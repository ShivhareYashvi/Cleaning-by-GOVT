from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.enums import UserRole


class UserBase(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=7, max_length=30)
    email: EmailStr | None = None
    role: UserRole = UserRole.CITIZEN
    address: str = Field(min_length=5)


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)
    electricity_bill_path: str | None = None
    vehicle_number: str | None = None


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    email: EmailStr | None = None
    address: str | None = Field(default=None, min_length=5)
    verified: bool | None = None
    household_id: str | None = None
    electricity_bill_path: str | None = None


class UserRead(UserBase):
    id: int
    verified: bool
    household_id: str | None
    electricity_bill_path: str | None
    driver_id: int | None = None
    vehicle_number: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
