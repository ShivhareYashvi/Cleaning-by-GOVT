from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.phone import normalize_phone
from app.db import get_db
from app.schemas.auth import ForgotPasswordResetRequest, LoginRequest, OTPRequest, OTPResponse, OTPVerifyRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserRead
from app.services.auth_service import auth_service
from app.services.otp_service import otp_service

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/otp/request", response_model=OTPResponse)
def request_otp(payload: OTPRequest, session: Session = Depends(get_db)) -> OTPResponse:
    normalized_phone = normalize_phone(payload.phone)
    record = otp_service.create_code(session, normalized_phone)
    session.commit()
    message = "OTP sent to the registered phone number."
    if record.delivery_channel != "sms":
        message = "OTP generated but not sent. Ensure your Twilio account is configured and the number is verified on your trial account."
    return OTPResponse(
        phone=normalized_phone,
        expires_in_seconds=otp_service.ttl_seconds,
        delivery_channel=record.delivery_channel,
        message=message,
    )


@router.post("/otp/verify", response_model=OTPResponse)
def verify_otp(payload: OTPVerifyRequest, session: Session = Depends(get_db)) -> OTPResponse:
    normalized_phone = normalize_phone(payload.phone)
    if not otp_service.verify_code(session, normalized_phone, payload.code):
        session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP")
    auth_service.mark_phone_verified(session, normalized_phone)
    session.commit()
    return OTPResponse(phone=normalized_phone, expires_in_seconds=0, message="Phone number verified")


@router.post("/forgot-password", response_model=OTPResponse)
def forgot_password(payload: OTPRequest, session: Session = Depends(get_db)) -> OTPResponse:
    normalized_phone = normalize_phone(payload.phone)
    if auth_service.get_user_by_phone(session, normalized_phone) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return request_otp(OTPRequest(phone=normalized_phone), session)


@router.post("/forgot-password/reset", response_model=TokenResponse)
def reset_password(payload: ForgotPasswordResetRequest, session: Session = Depends(get_db)) -> TokenResponse:
    return auth_service.reset_password(session, payload.phone, payload.code, payload.new_password)


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, session: Session = Depends(get_db)) -> UserRead:
    return auth_service.register(session, payload)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, session: Session = Depends(get_db)) -> TokenResponse:
    return auth_service.login(session, payload)
