from datetime import datetime, timedelta, timezone
from typing import Any

from jose import jwt
from passlib.context import CryptContext

from app.core.config import get_settings

password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a plaintext password for safe persistence."""

    return password_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Verify a plaintext password against a stored password hash."""

    return password_context.verify(plain_password, password_hash)


def create_access_token(subject: str, claims: dict[str, Any] | None = None, expires_delta: timedelta | None = None) -> str:
    """Create a signed JWT access token for an authenticated EcoSync user."""

    settings = get_settings()
    expires_at = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    payload: dict[str, Any] = {"sub": subject, "exp": expires_at}
    if claims:
        payload.update(claims)
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
