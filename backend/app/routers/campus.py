from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db, engine, Base
from ..models import Building, Reading, AnomalyEvent
from ..schemas import BuildingOut, ReadingOut, CampusSummary, SettingsUpdate
from ..config import load_settings, save_settings
from ..services.simulator import seed_database_with_simulator

router = APIRouter(prefix="/api", tags=["Campus Core"])


@router.post("/seed")
def seed_data(days: int = 30, reset: bool = False, db: Session = Depends(get_db)):
    if reset:
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
    return seed_database_with_simulator(db, days=days)


@router.get("/buildings", response_model=List[BuildingOut])
def get_buildings(db: Session = Depends(get_db)):
    buildings = db.query(Building).all()
    if not buildings:
        # Auto-seed on first empty request
        seed_database_with_simulator(db)
        buildings = db.query(Building).all()
    return buildings


@router.get("/buildings/{building_id}", response_model=BuildingOut)
def get_building(building_id: str, db: Session = Depends(get_db)):
    building = db.query(Building).filter(Building.id == building_id).first()
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")
    return building


@router.get("/readings", response_model=List[ReadingOut])
def get_readings(
    building_id: Optional[str] = Query(None),
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
    limit: int = Query(500, le=2000),
    db: Session = Depends(get_db)
):
    query = db.query(Reading)
    if building_id:
        query = query.filter(Reading.building_id == building_id)
    if start:
        query = query.filter(Reading.timestamp >= start)
    if end:
        query = query.filter(Reading.timestamp <= end)
    
    return query.order_by(Reading.timestamp.asc()).limit(limit).all()


@router.get("/summary", response_model=CampusSummary)
def get_campus_summary(
    days: int = Query(30, ge=1, le=90),
    building_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    # Ensure data exists
    if db.query(Reading).count() == 0:
        seed_database_with_simulator(db)

    latest_reading = db.query(func.max(Reading.timestamp)).scalar()
    if not latest_reading:
        latest_reading = datetime.utcnow()
    
    period_start = latest_reading - timedelta(days=days)

    query = db.query(Reading).filter(Reading.timestamp >= period_start)
    if building_id:
        query = query.filter(Reading.building_id == building_id)

    total_kwh = query.with_entities(func.sum(Reading.electricity_kwh)).scalar() or 0.0
    total_water = query.with_entities(func.sum(Reading.water_litres)).scalar() or 0.0
    total_waste = query.with_entities(func.sum(Reading.waste_kg)).scalar() or 0.0
    total_recycled = query.with_entities(func.sum(Reading.waste_recycled_kg)).scalar() or 0.0
    total_cost = query.with_entities(func.sum(Reading.cost_inr)).scalar() or 0.0
    total_co2e = query.with_entities(func.sum(Reading.co2e_kg)).scalar() or 0.0

    # Active anomalies
    anomaly_query = db.query(AnomalyEvent).filter(AnomalyEvent.status != "resolved")
    if building_id:
        anomaly_query = anomaly_query.filter(AnomalyEvent.building_id == building_id)
    active_anomalies_count = anomaly_query.count()

    # Recyclability percentage
    recycling_rate = (total_recycled / total_waste * 100.0) if total_waste > 0 else 0.0

    # Score calculation baseline
    settings = load_settings()
    weights = settings.get("score_weights", {})
    w_elec = weights.get("electricity_weight", 0.35)
    w_water = weights.get("water_weight", 0.25)
    w_waste = weights.get("waste_weight", 0.20)
    w_anom = weights.get("anomalies_weight", 0.20)

    # Simplified campus-wide sustainability baseline deduction
    anomaly_penalty = min(25.0, active_anomalies_count * 5.0)
    waste_penalty = max(0.0, 15.0 - (recycling_rate * 0.25))
    score = round(max(30.0, min(100.0, 100.0 - (anomaly_penalty * w_anom * 2) - (waste_penalty * w_waste * 1.5))), 1)

    factors = settings.get("factors", {})
    cost_elec = total_kwh * factors.get("electricity_tariff_inr_per_kwh", 8.5)
    cost_water = total_water * factors.get("water_tariff_inr_per_litre", 0.045)
    cost_waste = total_waste * factors.get("waste_disposal_inr_per_kg", 3.2)

    co2e_elec = total_kwh * factors.get("electricity_emission_kg_co2e_per_kwh", 0.716)
    co2e_water = total_water * factors.get("water_emission_kg_co2e_per_litre", 0.00035)
    co2e_waste = ((total_waste - total_recycled) * factors.get("waste_landfill_emission_kg_co2e_per_kg", 1.25)) + \
                 (total_recycled * factors.get("waste_recycled_offset_kg_co2e_per_kg", -0.85))

    return CampusSummary(
        period_start=period_start,
        period_end=latest_reading,
        total_electricity_kwh=round(total_kwh, 2),
        total_water_litres=round(total_water, 2),
        total_waste_kg=round(total_waste, 2),
        total_waste_recycled_kg=round(total_recycled, 2),
        recycling_rate_pct=round(recycling_rate, 1),
        total_cost_inr=round(total_cost, 2),
        total_co2e_kg=round(total_co2e, 2),
        active_anomalies_count=active_anomalies_count,
        campus_sustainability_score=score,
        cost_breakdown={
            "electricity": round(cost_elec, 2),
            "water": round(cost_water, 2),
            "waste": round(cost_waste, 2)
        },
        co2e_breakdown={
            "electricity": round(co2e_elec, 2),
            "water": round(co2e_water, 2),
            "waste": round(co2e_waste, 2)
        }
    )


@router.get("/settings")
def get_system_settings():
    return load_settings()


@router.post("/settings")
def update_system_settings(update: SettingsUpdate):
    settings = load_settings()
    settings["factors"].update(update.factors)
    if update.score_weights:
        settings["score_weights"].update(update.score_weights)
    if update.equivalents:
        settings["equivalents"].update(update.equivalents)
    save_settings(settings)
    return {"status": "success", "settings": settings}
