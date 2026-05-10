from pydantic import BaseModel, EmailStr, Field

from app.models.enums import UserRole
from app.schemas.user import UserRead


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=7, max_length=30)
    email: EmailStr | None = None
    password: str = Field(min_length=8, max_length=128)
    address: str = Field(min_length=5)
    role: UserRole = UserRole.CITIZEN
    vehicle_number: str | None = Field(default=None, max_length=40)
    electricity_bill_path: str | None = Field(default=None, max_length=512)


class LoginRequest(BaseModel):
    phone: str = Field(min_length=7, max_length=30)
    password: str = Field(min_length=8, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class OTPRequest(BaseModel):
    phone: str = Field(min_length=7, max_length=30)


class OTPVerifyRequest(OTPRequest):
    code: str = Field(min_length=4, max_length=8)


class OTPResponse(BaseModel):
    phone: str
    expires_in_seconds: int
    delivery_channel: str = "sms"
    message: str
