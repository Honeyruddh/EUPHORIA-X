from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class BuildingBase(BaseModel):
    id: str
    name: str
    building_type: str
    occupancy: int
    area_sqm: float
    base_kwh_per_day: float
    base_water_l_per_day: float
    base_waste_kg_per_day: float


class BuildingOut(BuildingBase):
    class Config:
        from_attributes = True


class ReadingOut(BaseModel):
    id: int
    building_id: str
    timestamp: datetime
    electricity_kwh: float
    water_litres: float
    waste_kg: float
    waste_recycled_kg: float
    cost_inr: float
    co2e_kg: float
    is_anomaly: bool
    anomaly_type: Optional[str] = None

    class Config:
        from_attributes = True


class AnomalyEventOut(BaseModel):
    id: int
    building_id: str
    timestamp: datetime
    resource: str
    severity: str
    duration_hours: float
    estimated_excess_units: float
    estimated_excess_inr: float
    estimated_excess_co2e: float
    probable_cause: str
    status: str
    resolved_at: Optional[datetime] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class RecommendationOut(BaseModel):
    id: int
    building_id: Optional[str] = None
    title: str
    category: str
    description: str
    trigger_data: str
    projected_savings_inr_month: float
    projected_savings_co2e_month: float
    investment_cost_inr: float
    payback_months: float
    status: str
    applied_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CampusSummary(BaseModel):
    period_start: datetime
    period_end: datetime
    total_electricity_kwh: float
    total_water_litres: float
    total_waste_kg: float
    total_waste_recycled_kg: float
    recycling_rate_pct: float
    total_cost_inr: float
    total_co2e_kg: float
    active_anomalies_count: int
    campus_sustainability_score: float
    cost_breakdown: Dict[str, float]
    co2e_breakdown: Dict[str, float]


class AnomalyInjectRequest(BaseModel):
    scenario: str  # "hostel_water_leak" | "library_overnight_ac" | "labs_server_surge" | "canteen_waste_spike"
    building_id: Optional[str] = None
    duration_hours: Optional[int] = 6
    multiplier: Optional[float] = 2.5


class WhatIfSimulateRequest(BaseModel):
    electricity_reduction_pct: float = 0.0  # 0 to 50%
    night_load_cut_pct: float = 0.0         # 0 to 60%
    fix_active_leaks: bool = True
    water_efficiency_pct: float = 0.0       # 0 to 40%
    recycling_diversion_pct: float = 0.0    # 0 to 80%


class WhatIfSimulateResponse(BaseModel):
    current_monthly_cost_inr: float
    projected_monthly_cost_inr: float
    monthly_savings_inr: float
    yearly_savings_inr: float
    monthly_co2e_saved_kg: float
    yearly_co2e_saved_kg: float
    equivalent_trees_monthly: float
    equivalent_car_km_monthly: float
    equivalent_homes_powered_days: float
    breakdown_by_resource: Dict[str, Dict[str, float]]


class SettingsUpdate(BaseModel):
    factors: Dict[str, Any]
    score_weights: Optional[Dict[str, float]] = None
    equivalents: Optional[Dict[str, float]] = None
