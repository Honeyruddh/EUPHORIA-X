from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..models import Building, Reading, AnomalyEvent, Recommendation
from ..config import load_settings
from .footprint import FootprintEngine


def generate_recommendations(db: Session) -> List[Dict[str, Any]]:
    """
    Analyzes historical data, active anomalies, and off-hour baseloads
    to generate data-backed, explainable recommendations with ROI and CO2e impact.
    """
    settings = load_settings()
    footprint = FootprintEngine(settings)
    recs = []

    # 1. Analyze active water anomalies (Leaks)
    water_anomalies = db.query(AnomalyEvent).filter(
        AnomalyEvent.resource == "water",
        AnomalyEvent.status != "resolved"
    ).all()

    for wa in water_anomalies:
        b = db.query(Building).filter(Building.id == wa.building_id).first()
        b_name = b.name if b else wa.building_id
        # Projected monthly loss if leak continues (assume 24 hrs/day if continuous or night-time leak)
        daily_loss_litres = wa.estimated_excess_units / max(1.0, wa.duration_hours) * 12.0
        monthly_litres = daily_loss_litres * 30.0
        cost_savings, co2_savings = footprint.calculate_water(monthly_litres)

        recs.append({
            "building_id": wa.building_id,
            "title": f"Fix Pressurized Pipe Leak in {b_name}",
            "category": "water",
            "description": f"Dispatch plumbing maintenance to inspect the sub-distribution line and pressure valves in {b_name}. Continuous flow of {int(wa.estimated_excess_units / max(1.0, wa.duration_hours))} L/hr observed during zero-occupancy night hours.",
            "trigger_data": f"Triggered by Active Anomaly #{wa.id}: {wa.estimated_excess_units:,.0f} L excess flow detected ({wa.severity.upper()} severity).",
            "projected_savings_inr_month": cost_savings,
            "projected_savings_co2e_month": co2_savings,
            "investment_cost_inr": 2500.0,  # valve replacement / plumber cost
            "payback_months": round(2500.0 / max(1.0, cost_savings), 2)
        })

    # 2. Analyze overnight electrical baseload in Library & Admin Block
    for b_id in ["central-library", "admin-block"]:
        night_readings = db.query(Reading).filter(
            Reading.building_id == b_id,
            func.strftime('%H', Reading.timestamp).in_(["00", "01", "02", "03", "04", "05"])
        ).limit(100).all()

        if night_readings:
            avg_night_kwh = sum(r.electricity_kwh for r in night_readings) / len(night_readings)
            b = db.query(Building).filter(Building.id == b_id).first()
            b_name = b.name if b else b_id
            
            # If night baseload > 25% of expected daytime base
            if avg_night_kwh > (b.base_kwh_per_day / 24.0 * 0.35):
                excess_hourly = avg_night_kwh - (b.base_kwh_per_day / 24.0 * 0.20)
                monthly_excess_kwh = excess_hourly * 6 * 30  # 6 hours per night, 30 days
                cost_savings, co2_savings = footprint.calculate_electricity(monthly_excess_kwh)

                recs.append({
                    "building_id": b_id,
                    "title": f"Deploy Smart IoT Schedule Relays in {b_name}",
                    "category": "electricity",
                    "description": f"Automate HVAC setback and schedule smart lighting shutdown at 21:30. Currently running an unnecessary {avg_night_kwh:.1f} kWh/hr off-peak baseload.",
                    "trigger_data": f"Triggered by off-hours baseload audit: Night consumption averages {avg_night_kwh:.1f} kWh/hr (35% above optimum setback limit).",
                    "projected_savings_inr_month": cost_savings,
                    "projected_savings_co2e_month": co2_savings,
                    "investment_cost_inr": 12000.0,
                    "payback_months": round(12000.0 / max(1.0, cost_savings), 2)
                })

    # 3. Analyze Waste Segregation & Organic Composting at Annapoorna Canteen
    canteen = db.query(Building).filter(Building.id == "annapoorna-canteen").first()
    if canteen:
        # Total waste
        total_waste = db.query(func.sum(Reading.waste_kg)).filter(Reading.building_id == "annapoorna-canteen").scalar() or 0.0
        recycled_waste = db.query(func.sum(Reading.waste_recycled_kg)).filter(Reading.building_id == "annapoorna-canteen").scalar() or 0.0
        diversion_rate = (recycled_waste / total_waste * 100.0) if total_waste > 0 else 0.0

        if diversion_rate < 50.0:
            potential_diverted_monthly = (canteen.base_waste_kg_per_day * 30) * 0.40
            # Financial and carbon savings from composting & recycling
            cost_savings = potential_diverted_monthly * (footprint.waste_cost_per_kg * 0.6)
            co2_savings = potential_diverted_monthly * (footprint.waste_landfill_factor - footprint.waste_recycled_offset)

            recs.append({
                "building_id": "annapoorna-canteen",
                "title": "On-Campus Biogas / Composting Digester for Canteen",
                "category": "waste",
                "description": f"Install a 250kg wet-waste organic biomethanation unit at Annapoorna Canteen. Diverts wet food waste from municipal landfill, producing cooking gas and rich organic fertilizer for campus landscaping.",
                "trigger_data": f"Triggered by waste audit: Current canteen diversion rate is only {diversion_rate:.1f}%, dumping ~{canteen.base_waste_kg_per_day:,.0f} kg/day into landfill streams.",
                "projected_savings_inr_month": round(cost_savings, 2),
                "projected_savings_co2e_month": round(co2_savings, 2),
                "investment_cost_inr": 45000.0,
                "payback_months": round(45000.0 / max(1.0, cost_savings), 2)
            })

    # 4. Solar PV Rooftop Integration at Computing Labs
    labs = db.query(Building).filter(Building.id == "ramanujan-labs").first()
    if labs:
        # 30 kWp rooftop array proposal
        solar_monthly_gen_kwh = 3600.0  # ~120 kWh/day
        cost_savings, co2_savings = footprint.calculate_electricity(solar_monthly_gen_kwh)
        recs.append({
            "building_id": "ramanujan-labs",
            "title": "30 kWp Rooftop Solar PV Installation on Labs Complex",
            "category": "electricity",
            "description": "Utilize 280 m² of unshaded rooftop on Ramanujan Labs for a grid-tied solar photovoltaic array. Offsets continuous daytime workstation and server power demands.",
            "trigger_data": f"Triggered by peak daytime load: High continuous baseline of {labs.base_kwh_per_day:,.0f} kWh/day with optimal rooftop solar insolation.",
            "projected_savings_inr_month": cost_savings,
            "projected_savings_co2e_month": co2_savings,
            "investment_cost_inr": 1350000.0,
            "payback_months": round(1350000.0 / max(1.0, cost_savings), 1)
        })

    # Sync into database Recommendations table
    for r in recs:
        existing = db.query(Recommendation).filter(
            Recommendation.title == r["title"],
            Recommendation.building_id == r["building_id"]
        ).first()
        if not existing:
            new_rec = Recommendation(
                building_id=r["building_id"],
                title=r["title"],
                category=r["category"],
                description=r["description"],
                trigger_data=r["trigger_data"],
                projected_savings_inr_month=r["projected_savings_inr_month"],
                projected_savings_co2e_month=r["projected_savings_co2e_month"],
                investment_cost_inr=r["investment_cost_inr"],
                payback_months=r["payback_months"],
                status="active"
            )
            db.add(new_rec)
    db.commit()

    return db.query(Recommendation).order_by(Recommendation.projected_savings_inr_month.desc()).all()
