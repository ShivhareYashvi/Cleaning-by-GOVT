from enum import StrEnum


class UserRole(StrEnum):
    CITIZEN = "citizen"
    DRIVER = "driver"
    ADMIN = "admin"


class WasteType(StrEnum):
    WET = "wet"
    DRY = "dry"
    E_WASTE = "e-waste"
    BULKY = "bulky"


class PickupStatus(StrEnum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ComplaintCategory(StrEnum):
    MISSED_PICKUP = "missed_pickup"
    ILLEGAL_DUMPING = "illegal_dumping"
    DAMAGED_BIN = "damaged_bin"
    DRIVER_BEHAVIOR = "driver_behavior"
    OTHER = "other"


class ComplaintStatus(StrEnum):
    OPEN = "open"
    IN_REVIEW = "in_review"
    RESOLVED = "resolved"
    REJECTED = "rejected"


class RewardSource(StrEnum):
    PICKUP_COMPLETION = "pickup_completion"
    RECYCLING_PARTICIPATION = "recycling_participation"
    COMPLAINT_RESOLUTION = "complaint_resolution"
    ADMIN_ADJUSTMENT = "admin_adjustment"


class DriverAvailability(StrEnum):
    AVAILABLE = "available"
    ON_ROUTE = "on_route"
    OFF_DUTY = "off_duty"
    SUSPENDED = "suspended"
