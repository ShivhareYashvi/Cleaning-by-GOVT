from app.schemas.analytics import AnalyticsSummary, EfficiencyMetric, WasteDistributionPoint
from app.schemas.auth import LoginRequest, OTPRequest, OTPResponse, OTPVerifyRequest, RegisterRequest, TokenResponse
from app.schemas.complaint import ComplaintCreate, ComplaintRead, ComplaintStatusUpdate
from app.schemas.driver import DriverCreate, DriverRead as DriverProfileRead, DriverUpdate
from app.schemas.notification import NotificationCreate, NotificationRead
from app.schemas.pickup_request import PickupAssignment, PickupRequestCreate, PickupRequestRead, PickupStatusUpdate
from app.schemas.reward import RewardCreate, RewardRead, RewardRedeem
from app.schemas.tracking import DriverLocationCreate, DriverLocationRead, DriverRead
from app.schemas.upload import UploadResponse
from app.schemas.user import UserCreate, UserRead, UserUpdate

__all__ = [
    "AnalyticsSummary",
    "ComplaintCreate",
    "ComplaintRead",
    "ComplaintStatusUpdate",
    "DriverCreate",
    "DriverLocationCreate",
    "DriverLocationRead",
    "DriverProfileRead",
    "DriverRead",
    "DriverUpdate",
    "EfficiencyMetric",
    "LoginRequest",
    "NotificationCreate",
    "NotificationRead",
    "OTPRequest",
    "OTPResponse",
    "OTPVerifyRequest",
    "PickupAssignment",
    "PickupRequestCreate",
    "PickupRequestRead",
    "PickupStatusUpdate",
    "RegisterRequest",
    "RewardCreate",
    "RewardRead",
    "RewardRedeem",
    "TokenResponse",
    "UploadResponse",
    "UserCreate",
    "UserRead",
    "UserUpdate",
    "WasteDistributionPoint",
]
