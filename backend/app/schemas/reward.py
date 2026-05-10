from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import RewardSource


class RewardBase(BaseModel):
    points: int = Field(gt=0)
    source: RewardSource
    redeemed: bool = False


class RewardCreate(RewardBase):
    user_id: int


class RewardRedeem(BaseModel):
    redeemed: bool = True


class RewardRead(RewardBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
