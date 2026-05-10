from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "EcoSync API"
    environment: Literal["local", "staging", "production"] = "local"
    api_v1_prefix: str = "/api/v1"
    database_url: str = Field(default="postgresql://ecosync:ecosync@localhost:5432/ecosync")
    jwt_secret_key: str = Field(default="change-me-in-production")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    frontend_origin: AnyHttpUrl | str = "http://localhost:5173"
    upload_dir: str = str((Path(__file__).resolve().parents[2] / "uploads").resolve())
    max_upload_size_mb: int = 10
    twilio_account_sid: str | None = None
    twilio_auth_token: str | None = None
    twilio_from_phone: str | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()
