from typing import List, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..models import Building, Reading, AnomalyEvent
from ..config import load_settings


def calculate_building_sustainability_scores(db: Session, days: int = 7) -> List[Dict[str, Any]]:
    """
    Computes a 0-100 score per building using the approved formula:
    Score = 100 - [w_e * P_elec + w_w * P_water + w_m * P_waste + w_a * P_anom]
    and determines trend (improving, steady, declining) against the preceding period.
    """
    settings = load_settings()
    weights = settings.get("score_weights", {
        "electricity_weight": 0.35,
        "water_weight": 0.25,
        "waste_weight": 0.20,
        "anomalies_weight": 0.20
    })

    w_e = weights["electricity_weight"]
    w_w = weights["water_weight"]
    w_m = weights["waste_weight"]
    w_a = weights["anomalies_weight"]

    latest_date = db.query(func.max(Reading.timestamp)).scalar() or datetime.utcnow()
    current_period_start = latest_date - timedelta(days=days)
    prev_period_start = current_period_start - timedelta(days=days)

    buildings = db.query(Building).all()
    results = []

    for b in buildings:
        # Current period metrics
        curr_kwh = db.query(func.sum(Reading.electricity_kwh)).filter(
            Reading.building_id == b.id,
            Reading.timestamp >= current_period_start
        ).scalar() or 0.0

        curr_water = db.query(func.sum(Reading.water_litres)).filter(
            Reading.building_id == b.id,
            Reading.timestamp >= current_period_start
        ).scalar() or 0.0

        curr_waste = db.query(func.sum(Reading.waste_kg)).filter(
            Reading.building_id == b.id,
            Reading.timestamp >= current_period_start
        ).scalar() or 0.0

        curr_recycled = db.query(func.sum(Reading.waste_recycled_kg)).filter(
            Reading.building_id == b.id,
            Reading.timestamp >= current_period_start
        ).scalar() or 0.0

        curr_anomalies = db.query(AnomalyEvent).filter(
            AnomalyEvent.building_id == b.id,
            AnomalyEvent.status != "resolved"
        ).count()

        # Expected baseline over period
        expected_kwh = (b.base_kwh_per_day * days)
        expected_water = (b.base_water_l_per_day * days)
        expected_waste = (b.base_waste_kg_per_day * days)

        # Penalty calculations (0 to 100 scale)
        p_elec = min(100.0, max(0.0, ((curr_kwh - expected_kwh) / max(1.0, expected_kwh)) * 150.0))
        p_water = min(100.0, max(0.0, ((curr_water - expected_water) / max(1.0, expected_water)) * 150.0))
        
        # Recycling credit: diversion reduces waste penalty
        diversion_rate = (curr_recycled / curr_waste * 100.0) if curr_waste > 0 else 0.0
        p_waste = max(0.0, 50.0 - (diversion_rate * 0.75))

        p_anom = min(100.0, curr_anomalies * 25.0)

        total_penalty = (w_e * p_elec) + (w_w * p_water) + (w_m * p_waste) + (w_a * p_anom)
        raw_score = 100.0 - total_penalty
        score = round(max(25.0, min(99.0, raw_score)), 1)

        # Preceding period score for trend determination
        prev_kwh = db.query(func.sum(Reading.electricity_kwh)).filter(
            Reading.building_id == b.id,
            Reading.timestamp >= prev_period_start,
            Reading.timestamp < current_period_start
        ).scalar() or expected_kwh

        diff_pct = ((curr_kwh - prev_kwh) / max(1.0, prev_kwh)) * 100.0
        if diff_pct < -3.0:
            trend = "improving"
            trend_arrow = "↑"
        elif diff_pct > 3.0:
            trend = "declining"
            trend_arrow = "↓"
        else:
            trend = "steady"
            trend_arrow = "→"

        # Intensity metrics
        kwh_per_sqm = round(curr_kwh / max(1.0, b.area_sqm), 2)
        water_l_per_capita = round(curr_water / max(1.0, b.occupancy), 1)

        results.append({
            "building_id": b.id,
            "building_name": b.name,
            "building_type": b.building_type,
            "score": score,
            "trend": trend,
            "trend_arrow": trend_arrow,
            "trend_delta_pct": round(abs(diff_pct), 1),
            "active_anomalies": curr_anomalies,
            "recycling_rate_pct": round(diversion_rate, 1),
            "kwh_per_sqm": kwh_per_sqm,
            "water_l_per_capita": water_l_per_capita,
            "grade": "A+" if score >= 90 else "A" if score >= 80 else "B" if score >= 70 else "C" if score >= 60 else "D"
        })

    # Sort descending by score for ranking
    results.sort(key=lambda x: x["score"], reverse=True)
    for idx, item in enumerate(results, start=1):
        item["rank"] = idx

    return results
