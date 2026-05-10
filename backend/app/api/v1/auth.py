from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.auth import LoginRequest, OTPRequest, OTPResponse, OTPVerifyRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserRead
from app.services.auth_service import auth_service
from app.services.otp_service import otp_service

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/otp/request", response_model=OTPResponse)
def request_otp(payload: OTPRequest, session: Session = Depends(get_db)) -> OTPResponse:
    record = otp_service.create_code(session, payload.phone)
    session.commit()
    message = "OTP sent to the registered phone number."
    if record.delivery_channel != "sms":
        message = "OTP generated but not sent. Configure Twilio SMS credentials to enable automatic delivery."
    return OTPResponse(
        phone=payload.phone,
        expires_in_seconds=otp_service.ttl_seconds,
        delivery_channel=record.delivery_channel,
        message=message,
    )


@router.post("/otp/verify", response_model=OTPResponse)
def verify_otp(payload: OTPVerifyRequest, session: Session = Depends(get_db)) -> OTPResponse:
    if not otp_service.verify_code(session, payload.phone, payload.code):
        session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP")
    auth_service.mark_phone_verified(session, payload.phone)
    session.commit()
    return OTPResponse(phone=payload.phone, expires_in_seconds=0, message="Phone number verified")


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, session: Session = Depends(get_db)) -> UserRead:
    return auth_service.register(session, payload)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, session: Session = Depends(get_db)) -> TokenResponse:
    return auth_service.login(session, payload)
