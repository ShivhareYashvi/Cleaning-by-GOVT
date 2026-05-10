from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.core.config import get_settings
from app.core.security import create_access_token, hash_password, verify_password
from app.models.driver import Driver
from app.models.enums import DriverAvailability, UserRole
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserRead
from app.services.otp_service import otp_service

_settings = get_settings()


class AuthService:
    """Authentication service backed by the shared PostgreSQL database."""

    def register(self, session: Session, payload: RegisterRequest) -> UserRead:
        existing_by_phone = session.scalar(select(User).where(User.phone == payload.phone))
        if existing_by_phone is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone number is already registered")
        if payload.email:
            existing_by_email = session.scalar(select(User).where(User.email == payload.email))
            if existing_by_email is not None:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")
        # Skip OTP gate in local dev — enforce in staging/production only
        if _settings.environment != "local" and not otp_service.is_verified(session, payload.phone):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Phone number must be OTP verified before registration")
        if payload.role == UserRole.DRIVER and not payload.vehicle_number:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Driver registrations require a vehicle number")

        now = datetime.now(timezone.utc)
        user = User(
            name=payload.name,
            phone=payload.phone,
            email=payload.email,
            password_hash=hash_password(payload.password),
            role=payload.role,
            address=payload.address,
            verified=True,
            electricity_bill_path=payload.electricity_bill_path,
            created_at=now,
            updated_at=now,
        )
        session.add(user)
        try:
            session.flush()
            user.household_id = f"ECO-{now.year}-{user.id:06d}"
            if payload.role == UserRole.DRIVER and payload.vehicle_number:
                session.add(
                    Driver(
                        user_id=user.id,
                        vehicle_number=payload.vehicle_number,
                        availability=DriverAvailability.AVAILABLE,
                    )
                )
            session.commit()
        except IntegrityError as exc:
            session.rollback()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Registration conflicts with an existing record") from exc

        persisted = session.scalar(select(User).options(selectinload(User.driver_profile)).where(User.id == user.id))
        if persisted is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to load registered user")
        return self._to_read_model(persisted)

    def login(self, session: Session, payload: LoginRequest) -> TokenResponse:
        user = session.scalar(select(User).options(selectinload(User.driver_profile)).where(User.phone == payload.phone))
        if user is None or not verify_password(payload.password, str(user.password_hash)):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid phone or password")
        read_model = self._to_read_model(user)
        token = create_access_token(subject=str(read_model.id), claims={"role": read_model.role.value, "phone": read_model.phone})
        return TokenResponse(access_token=token, user=read_model)

    def mark_phone_verified(self, session: Session, phone: str) -> None:
        user = session.scalar(select(User).where(User.phone == phone))
        if user is not None:
            user.verified = True
            user.updated_at = datetime.now(timezone.utc)
            session.flush()

    @staticmethod
    def _to_read_model(user: User) -> UserRead:
        return UserRead(
            id=user.id,
            name=user.name,
            phone=user.phone,
            email=user.email,
            role=user.role if isinstance(user.role, UserRole) else UserRole(str(user.role)),
            address=user.address,
            verified=user.verified,
            household_id=user.household_id,
            electricity_bill_path=user.electricity_bill_path,
            driver_id=user.driver_profile.id if user.driver_profile else None,
            vehicle_number=user.driver_profile.vehicle_number if user.driver_profile else None,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )


auth_service = AuthService()
