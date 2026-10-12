import math
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from ..models import Building, Reading, AnomalyEvent
from ..config import load_settings
from .footprint import FootprintEngine


def get_hourly_profile_multiplier(building_id: str, hour: int, is_weekend: bool, day_index: int) -> Dict[str, float]:
    """
    Returns multipliers for (elec, water, waste) based on realistic campus patterns.
    """
    # Default base multipliers
    elec_mult = 0.3
    water_mult = 0.08
    waste_mult = 0.05

    # Exam week spike (days 20-26 in a 30-day window)
    is_exam_week = (20 <= day_index <= 26)

    if building_id == "nilgiri-hostel":
        # Hostel: Morning prep & late evening study/living
        if 6 <= hour <= 9:
            elec_mult = 0.9 if not is_weekend else 0.7
            water_mult = 1.8 if not is_weekend else 1.4
            waste_mult = 0.8
        elif 10 <= hour <= 17:
            elec_mult = 0.4 if not is_weekend else 0.8
            water_mult = 0.3 if not is_weekend else 0.7
            waste_mult = 0.4
        elif 18 <= hour <= 23:
            elec_mult = 1.4 if not is_weekend else 1.3
            water_mult = 1.1
            waste_mult = 1.0
        else: # Night 00:00 - 05:00
            elec_mult = 0.35
            water_mult = 0.06  # Leaks stand out sharply here!
            waste_mult = 0.05

    elif building_id == "central-library":
        # Library: 09:00 - 22:00 operating hours. Exam week extends late into night.
        if 9 <= hour <= 21:
            elec_mult = 1.3 if not is_weekend else 1.1
            water_mult = 0.9
            waste_mult = 1.0
        elif 22 <= hour or hour <= 2:
            if is_exam_week:
                elec_mult = 1.2  # Exam night owls
                water_mult = 0.6
                waste_mult = 0.8
            else:
                elec_mult = 0.25  # Normal night baseload
                water_mult = 0.05
                waste_mult = 0.02
        else:
            elec_mult = 0.2
            water_mult = 0.04
            waste_mult = 0.01

    elif building_id == "ramanujan-labs":
        # High-compute lab: 24/7 server base load + daytime researcher boost
        if 9 <= hour <= 19 and not is_weekend:
            elec_mult = 1.35
            water_mult = 0.9
            waste_mult = 0.8
        elif is_weekend:
            elec_mult = 0.85  # servers still running
            water_mult = 0.3
            waste_mult = 0.2
        else:
            elec_mult = 0.75  # night compute
            water_mult = 0.15
            waste_mult = 0.05

    elif building_id == "annapoorna-canteen":
        # Food hall: Breakfast (7-9), Lunch (12-15), Dinner (19-21)
        if 7 <= hour <= 9:
            elec_mult = 1.3
            water_mult = 1.4
            waste_mult = 1.2
        elif 12 <= hour <= 15:
            elec_mult = 1.6
            water_mult = 1.9
            waste_mult = 1.8
        elif 19 <= hour <= 21:
            elec_mult = 1.5
            water_mult = 1.7
            waste_mult = 1.6
        elif 10 <= hour <= 11 or 16 <= hour <= 18:
            elec_mult = 0.6
            water_mult = 0.5
            waste_mult = 0.3
        else:
            elec_mult = 0.25
            water_mult = 0.08
            waste_mult = 0.02

    elif building_id == "admin-block":
        # Office block: strictly 9-6 on weekdays, ghost town on weekends
        if 8 <= hour <= 18 and not is_weekend:
            elec_mult = 1.3
            water_mult = 1.1
            waste_mult = 1.2
        elif is_weekend:
            elec_mult = 0.18
            water_mult = 0.05
            waste_mult = 0.05
        else:
            elec_mult = 0.15
            water_mult = 0.03
            waste_mult = 0.01

    elif building_id == "sports-complex":
        # Sports: Morning (6-9) and evening (16-21) spikes
        if (6 <= hour <= 9) or (16 <= hour <= 21):
            elec_mult = 1.3
            water_mult = 1.7
            waste_mult = 1.1
        elif 10 <= hour <= 15:
            elec_mult = 0.5
            water_mult = 0.4
            waste_mult = 0.3
        else:
            elec_mult = 0.3  # pool pump filtration
            water_mult = 0.1
            waste_mult = 0.02

    return {"elec": elec_mult, "water": water_mult, "waste": waste_mult}


def seed_database_with_simulator(db: Session, days: int = 30) -> Dict[str, Any]:
    """
    Populates database with 30 days of realistic hourly readings for all configured buildings,
    plus initial historical anomalies.
    """
    settings = load_settings()
    footprint = FootprintEngine(settings)
    
    # 1. Sync buildings
    building_configs = settings.get("buildings", [])
    buildings_created = 0
    for b_conf in building_configs:
        existing = db.query(Building).filter(Building.id == b_conf["id"]).first()
        if not existing:
            building = Building(
                id=b_conf["id"],
                name=b_conf["name"],
                building_type=b_conf["type"],
                occupancy=b_conf.get("occupancy", 100),
                area_sqm=b_conf.get("area_sqm", 1000.0),
                base_kwh_per_day=b_conf.get("base_kwh_per_day", 1000.0),
                base_water_l_per_day=b_conf.get("base_water_l_per_day", 10000.0),
                base_waste_kg_per_day=b_conf.get("base_waste_kg_per_day", 100.0)
            )
            db.add(building)
            buildings_created += 1
    db.commit()

    # 2. Check if readings already exist
    existing_count = db.query(Reading).count()
    if existing_count > 0:
        return {
            "status": "already_seeded",
            "readings_count": existing_count,
            "buildings_count": len(building_configs)
        }

    random.seed(42)  # Deterministic seed for reproducible baseline demo
    end_time = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    start_time = end_time - timedelta(days=days)

    all_buildings = db.query(Building).all()
    readings_to_add: List[Reading] = []

    # Historical anomalies to pre-seed for realistic demo presentation
    # Anomaly 1: Water leak in Nilgiri Hostel 3 days ago (nighttime leak)
    leak_start = end_time - timedelta(days=3, hours=18)
    leak_end = end_time - timedelta(days=2, hours=6)

    # Anomaly 2: AC left running in Central Library 5 days ago overnight
    ac_start = end_time - timedelta(days=5, hours=22)
    ac_end = end_time - timedelta(days=4, hours=8)

    # Anomaly 3: Canteen waste surge last weekend
    waste_surge_start = end_time - timedelta(days=7, hours=12)
    waste_surge_end = end_time - timedelta(days=7, hours=18)

    cur_time = start_time
    total_hours = days * 24

    for hour_idx in range(total_hours):
        hour_stamp = start_time + timedelta(hours=hour_idx)
        hour_of_day = hour_stamp.hour
        is_weekend = hour_stamp.weekday() >= 5
        day_idx = hour_idx // 24

        for b in all_buildings:
            mults = get_hourly_profile_multiplier(b.id, hour_of_day, is_weekend, day_idx)

            # Average hourly base
            avg_hourly_kwh = b.base_kwh_per_day / 24.0
            avg_hourly_water = b.base_water_l_per_day / 24.0
            avg_hourly_waste = b.base_waste_kg_per_day / 24.0

            # Add stochastic natural variance (+- 7%)
            noise_elec = random.uniform(0.93, 1.07)
            noise_water = random.uniform(0.92, 1.08)
            noise_waste = random.uniform(0.88, 1.12)

            kwh = avg_hourly_kwh * mults["elec"] * noise_elec
            water_l = avg_hourly_water * mults["water"] * noise_water
            waste_kg = avg_hourly_waste * mults["waste"] * noise_waste

            is_anomaly = False
            anomaly_type = None

            # Inject pre-seeded anomaly 1: Hostel water leak
            if b.id == "nilgiri-hostel" and (leak_start <= hour_stamp <= leak_end):
                water_l += 2400.0  # continuous severe leak
                is_anomaly = True
                anomaly_type = "hostel_water_leak"

            # Inject pre-seeded anomaly 2: Library overnight AC
            if b.id == "central-library" and (ac_start <= hour_stamp <= ac_end):
                kwh += 65.0  # heavy chiller left on
                is_anomaly = True
                anomaly_type = "library_overnight_ac"

            # Inject pre-seeded anomaly 3: Canteen waste surge
            if b.id == "annapoorna-canteen" and (waste_surge_start <= hour_stamp <= waste_surge_end):
                waste_kg += 180.0
                is_anomaly = True
                anomaly_type = "canteen_waste_spike"

            # Recycling portion (typically 25-45% depending on building)
            recycling_ratio = 0.40 if b.id in ["central-library", "admin-block"] else 0.25
            waste_recycled_kg = waste_kg * recycling_ratio

            totals = footprint.calculate_total(kwh, water_l, waste_kg, waste_recycled_kg)

            reading = Reading(
                building_id=b.id,
                timestamp=hour_stamp,
                electricity_kwh=round(kwh, 2),
                water_litres=round(water_l, 2),
                waste_kg=round(waste_kg, 2),
                waste_recycled_kg=round(waste_recycled_kg, 2),
                cost_inr=totals["total_cost_inr"],
                co2e_kg=totals["total_co2e_kg"],
                is_anomaly=is_anomaly,
                anomaly_type=anomaly_type
            )
            readings_to_add.append(reading)

        # Batch insert every 24 hours to keep memory optimal
        if len(readings_to_add) >= 500:
            db.bulk_save_objects(readings_to_add)
            readings_to_add = []

    if readings_to_add:
        db.bulk_save_objects(readings_to_add)
    db.commit()

    # Pre-seed initial detected Anomaly Events
    preseeded_events = [
        AnomalyEvent(
            building_id="nilgiri-hostel",
            timestamp=leak_start + timedelta(hours=3),
            resource="water",
            severity="critical",
            duration_hours=12.0,
            estimated_excess_units=28800.0,
            estimated_excess_inr=28800.0 * 0.045,
            estimated_excess_co2e=28800.0 * 0.00035,
            probable_cause="Continuous baseload leak (01:00-05:00) indicative of a fractured flush valve or distribution pipe",
            status="detected",
            notes="Observed steady 2,400 L/hr draw throughout 01:00-05:00 quiet period."
        ),
        AnomalyEvent(
            building_id="central-library",
            timestamp=ac_start + timedelta(hours=2),
            resource="electricity",
            severity="medium",
            duration_hours=10.0,
            estimated_excess_units=650.0,
            estimated_excess_inr=650.0 * 8.50,
            estimated_excess_co2e=650.0 * 0.716,
            probable_cause="HVAC chillers & 2nd floor lighting left active past 22:00 closing schedule",
            status="acknowledged",
            notes="BMS timer override suspected in West Wing reading hall."
        ),
        AnomalyEvent(
            building_id="annapoorna-canteen",
            timestamp=waste_surge_start + timedelta(hours=2),
            resource="waste",
            severity="medium",
            duration_hours=6.0,
            estimated_excess_units=1080.0,
            estimated_excess_inr=1080.0 * 3.20,
            estimated_excess_co2e=1080.0 * 1.25,
            probable_cause="Bulk food disposal spike following weekend university symposium banquet",
            status="resolved",
            resolved_at=waste_surge_end,
            notes="Composting contractor dispatched to clear overflow bins."
        )
    ]
    db.add_all(preseeded_events)
    db.commit()

    total_readings = db.query(Reading).count()
    return {
        "status": "success",
        "readings_count": total_readings,
        "buildings_count": len(all_buildings),
        "anomalies_seeded": len(preseeded_events)
    }
