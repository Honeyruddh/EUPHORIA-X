from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..models import Reading, AnomalyEvent
from ..config import load_settings
from .footprint import FootprintEngine
from ..schemas import WhatIfSimulateRequest, WhatIfSimulateResponse


def simulate_savings(db: Session, request: WhatIfSimulateRequest) -> WhatIfSimulateResponse:
    settings = load_settings()
    footprint = FootprintEngine(settings)
    equiv = settings.get("equivalents", {})
    tree_factor = float(equiv.get("kg_co2e_per_tree_per_month", 1.75))
    car_factor = float(equiv.get("kg_co2e_per_car_km", 0.120))
    home_kwh_day = float(equiv.get("kwh_per_household_day", 10.0))

    # Baseline 30-day usage across the campus
    total_kwh = db.query(func.sum(Reading.electricity_kwh)).scalar() or 30000.0
    total_water = db.query(func.sum(Reading.water_litres)).scalar() or 600000.0
    total_waste = db.query(func.sum(Reading.waste_kg)).scalar() or 25000.0
    total_recycled = db.query(func.sum(Reading.waste_recycled_kg)).scalar() or 7500.0

    current_totals = footprint.calculate_total(total_kwh, total_water, total_waste, total_recycled)
    current_cost = current_totals["total_cost_inr"]

    # Savings calculations
    # 1. Electricity overall reduction
    elec_pct = max(0.0, min(60.0, request.electricity_reduction_pct)) / 100.0
    saved_kwh_base = total_kwh * elec_pct

    # 2. Night load cut: approx 30% of total load is night load
    night_pct = max(0.0, min(70.0, request.night_load_cut_pct)) / 100.0
    saved_kwh_night = (total_kwh * 0.32) * night_pct

    total_saved_kwh = saved_kwh_base + saved_kwh_night
    elec_saved_cost, elec_saved_co2 = footprint.calculate_electricity(total_saved_kwh)

    # 3. Water savings: leak fixes + general efficiency
    water_leak_savings_l = 0.0
    if request.fix_active_leaks:
        active_leaks = db.query(AnomalyEvent).filter(
            AnomalyEvent.resource == "water",
            AnomalyEvent.status != "resolved"
        ).all()
        for leak in active_leaks:
            # Monthly projected loss
            water_leak_savings_l += (leak.estimated_excess_units / max(1.0, leak.duration_hours)) * 24 * 30

    water_eff_pct = max(0.0, min(50.0, request.water_efficiency_pct)) / 100.0
    saved_water_eff_l = (total_water - water_leak_savings_l) * water_eff_pct
    total_saved_water_l = water_leak_savings_l + saved_water_eff_l
    water_saved_cost, water_saved_co2 = footprint.calculate_water(total_saved_water_l)

    # 4. Waste recycling diversion increase
    extra_diversion_pct = max(0.0, min(80.0, request.recycling_diversion_pct)) / 100.0
    diverted_kg = (total_waste - total_recycled) * extra_diversion_pct
    new_recycled = total_recycled + diverted_kg

    # Recalculate waste cost and emissions with new diverted quantity
    new_waste_cost, new_waste_co2 = footprint.calculate_waste(total_waste, new_recycled)
    old_waste_cost, old_waste_co2 = footprint.calculate_waste(total_waste, total_recycled)
    waste_saved_cost = max(0.0, old_waste_cost - new_waste_cost)
    waste_saved_co2 = max(0.0, old_waste_co2 - new_waste_co2)

    # Totals
    monthly_savings_inr = round(elec_saved_cost + water_saved_cost + waste_saved_cost, 2)
    yearly_savings_inr = round(monthly_savings_inr * 12.0, 2)

    monthly_co2e_saved_kg = round(elec_saved_co2 + water_saved_co2 + waste_saved_co2, 2)
    yearly_co2e_saved_kg = round(monthly_co2e_saved_kg * 12.0, 2)

    projected_monthly_cost = round(max(0.0, current_cost - monthly_savings_inr), 2)

    # Relatable equivalents
    equivalent_trees = round(monthly_co2e_saved_kg / max(0.01, tree_factor), 1)
    equivalent_car_km = round(monthly_co2e_saved_kg / max(0.001, car_factor), 0)
    equivalent_homes = round(total_saved_kwh / max(1.0, home_kwh_day * 30), 1)

    return WhatIfSimulateResponse(
        current_monthly_cost_inr=current_cost,
        projected_monthly_cost_inr=projected_monthly_cost,
        monthly_savings_inr=monthly_savings_inr,
        yearly_savings_inr=yearly_savings_inr,
        monthly_co2e_saved_kg=monthly_co2e_saved_kg,
        yearly_co2e_saved_kg=yearly_co2e_saved_kg,
        equivalent_trees_monthly=equivalent_trees,
        equivalent_car_km_monthly=equivalent_car_km,
        equivalent_homes_powered_days=equivalent_homes,
        breakdown_by_resource={
            "electricity": {
                "saved_units": round(total_saved_kwh, 1),
                "saved_cost_inr": elec_saved_cost,
                "saved_co2e_kg": elec_saved_co2
            },
            "water": {
                "saved_units": round(total_saved_water_l, 1),
                "saved_cost_inr": water_saved_cost,
                "saved_co2e_kg": water_saved_co2
            },
            "waste": {
                "saved_units": round(diverted_kg, 1),
                "saved_cost_inr": waste_saved_cost,
                "saved_co2e_kg": waste_saved_co2
            }
        }
    )
