from pydantic import BaseModel


class WasteDistributionPoint(BaseModel):
    waste_type: str
    requests: int


class EfficiencyMetric(BaseModel):
    label: str
    value: float


class AnalyticsSummary(BaseModel):
    waste_distribution: list[WasteDistributionPoint]
    pickup_efficiency: EfficiencyMetric
    area_wise_pickups: list[EfficiencyMetric]
    complaint_trends: list[EfficiencyMetric]
    recycling_participation: EfficiencyMetric
