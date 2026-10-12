from datetime import datetime, timedelta
from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..models import Reading, AnomalyEvent, Building
from ..config import load_settings
from .footprint import FootprintEngine


def inject_anomaly_scenario(
    db: Session,
    scenario: str,
    building_id: str = None,
    duration_hours: int = 6,
    multiplier: float = 2.5
) -> Dict[str, Any]:
    """
    Live on-stage anomaly injection engine. Modifies recent readings and creates
    an active AnomalyEvent immediately visible in the UI.
    """
    settings = load_settings()
    footprint = FootprintEngine(settings)
    now = datetime.utcnow().replace(minute=0, second=0, microsecond=0)

    # Scenarios mapping
    if scenario == "hostel_water_leak":
        target_bldg = building_id or "nilgiri-hostel"
        resource = "water"
        severity = "critical"
        excess_rate = 2600.0  # litres per hour leak
        cause = "Live Injected Leak: Underground riser joint rupture detected in Hostel B Block (continuous flow during 02:00-05:00 window)."
        anomaly_tag = "live_hostel_leak"

    elif scenario == "library_overnight_ac":
        target_bldg = building_id or "central-library"
        resource = "electricity"
        severity = "medium"
        excess_rate = 75.0  # kWh per hour
        cause = "Live Injected Load: Central chiller package and 3rd-floor stacks lighting running unattended after 22:00 closure."
        anomaly_tag = "live_library_ac"

    elif scenario == "labs_server_surge":
        target_bldg = building_id or "ramanujan-labs"
        resource = "electricity"
        severity = "critical"
        excess_rate = 140.0  # kWh per hour
        cause = "Live Injected Spike: Unthrottled GPU cluster test run with cooling fan failure triggering thermal overshoot."
        anomaly_tag = "live_server_surge"

    elif scenario == "canteen_waste_spike":
        target_bldg = building_id or "annapoorna-canteen"
        resource = "waste"
        severity = "medium"
        excess_rate = 180.0  # kg per hour
        cause = "Live Injected Overflow: Kitchen bulk spoilage disposal and unsegregated event food wastage overflowing loading docks."
        anomaly_tag = "live_canteen_waste"

    else:
        # Generic fallback
        target_bldg = building_id or "nilgiri-hostel"
        resource = "electricity"
        severity = "medium"
        excess_rate = 50.0
        cause = f"Injected test anomaly on {target_bldg}"
        anomaly_tag = "custom_injection"

    # Inject into the most recent readings
    recent_readings = db.query(Reading).filter(
        Reading.building_id == target_bldg
    ).order_by(desc(Reading.timestamp)).limit(duration_hours).all()

    total_excess = 0.0

    for r in recent_readings:
        r.is_anomaly = True
        r.anomaly_type = anomaly_tag
        if resource == "water":
            r.water_litres += excess_rate
            total_excess += excess_rate
        elif resource == "electricity":
            r.electricity_kwh += excess_rate
            total_excess += excess_rate
        elif resource == "waste":
            r.waste_kg += excess_rate
            total_excess += excess_rate

        # Recompute footprint cost & co2
        totals = footprint.calculate_total(r.electricity_kwh, r.water_litres, r.waste_kg, r.waste_recycled_kg)
        r.cost_inr = totals["total_cost_inr"]
        r.co2e_kg = totals["total_co2e_kg"]

    # Calculate losses
    if resource == "water":
        cost_loss, co2_loss = footprint.calculate_water(total_excess)
    elif resource == "electricity":
        cost_loss, co2_loss = footprint.calculate_electricity(total_excess)
    else:
        cost_loss, co2_loss = footprint.calculate_waste(total_excess)

    # Insert AnomalyEvent record
    event = AnomalyEvent(
        building_id=target_bldg,
        timestamp=now,
        resource=resource,
        severity=severity,
        duration_hours=float(duration_hours),
        estimated_excess_units=round(total_excess, 1),
        estimated_excess_inr=cost_loss,
        estimated_excess_co2e=co2_loss,
        probable_cause=cause,
        status="detected",
        notes=f"Injected on stage via Admin Control Panel for live demonstration."
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    return {
        "status": "injected",
        "event_id": event.id,
        "building_id": target_bldg,
        "resource": resource,
        "severity": severity,
        "total_excess_units": round(total_excess, 1),
        "loss_inr": cost_loss,
        "loss_co2e": co2_loss,
        "probable_cause": cause
    }
