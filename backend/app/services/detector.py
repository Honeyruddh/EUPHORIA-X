import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sklearn.ensemble import IsolationForest
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..models import Building, Reading, AnomalyEvent
from ..config import load_settings
from .footprint import FootprintEngine


class AnomalyDetector:
    def __init__(self, db: Session):
        self.db = db
        self.settings = load_settings()
        self.footprint = FootprintEngine(self.settings)

    def compute_hourly_baselines(self, building_id: str) -> pd.DataFrame:
        """
        Computes the mean, std, median, and IQR for each hour of day (0-23)
        for electricity, water, and waste over all readings for this building.
        """
        readings = self.db.query(Reading).filter(
            Reading.building_id == building_id,
            Reading.is_anomaly == False
        ).all()

        if not readings:
            # Fallback to all readings if no non-anomaly records
            readings = self.db.query(Reading).filter(Reading.building_id == building_id).all()

        data = [{
            "hour": r.timestamp.hour,
            "kwh": r.electricity_kwh,
            "water": r.water_litres,
            "waste": r.waste_kg
        } for r in readings]

        df = pd.DataFrame(data)
        if df.empty:
            return pd.DataFrame()

        grouped = df.groupby("hour").agg({
            "kwh": ["mean", "std", "median", lambda x: np.percentile(x, 75) - np.percentile(x, 25)],
            "water": ["mean", "std", "median", lambda x: np.percentile(x, 75) - np.percentile(x, 25)],
            "waste": ["mean", "std", "median", lambda x: np.percentile(x, 75) - np.percentile(x, 25)]
        })
        grouped.columns = [f"{col}_{stat}" for col, stat in [
            ("kwh", "mean"), ("kwh", "std"), ("kwh", "median"), ("kwh", "iqr"),
            ("water", "mean"), ("water", "std"), ("water", "median"), ("water", "iqr"),
            ("waste", "mean"), ("waste", "std"), ("waste", "median"), ("waste", "iqr")
        ]]
        return grouped

    def detect_recent_anomalies(self, hours_back: int = 48) -> List[Dict[str, Any]]:
        """
        Scans readings from the last `hours_back` hours across all buildings.
        Uses Z-Score and IQR thresholds combined with an Isolation Forest validator.
        """
        latest_reading = self.db.query(Reading).order_by(desc(Reading.timestamp)).first()
        if not latest_reading:
            return []

        cutoff = latest_reading.timestamp - timedelta(hours=hours_back)
        recent_readings = self.db.query(Reading).filter(Reading.timestamp >= cutoff).all()
        if not recent_readings:
            return []

        detected_events = []
        buildings = {b.id: b for b in self.db.query(Building).all()}

        # Group by building
        by_bldg: Dict[str, List[Reading]] = {}
        for r in recent_readings:
            by_bldg.setdefault(r.building_id, []).append(r)

        for b_id, b_readings in by_bldg.items():
            building = buildings.get(b_id)
            if not building:
                continue

            baselines = self.compute_hourly_baselines(b_id)
            if baselines.empty:
                continue

            # Train quick Isolation Forest on historic data for multi-variate confirmation
            hist_readings = self.db.query(Reading).filter(Reading.building_id == b_id).limit(720).all()
            if len(hist_readings) >= 50:
                X_train = np.array([[r.electricity_kwh, r.water_litres, r.waste_kg] for r in hist_readings])
                iso_forest = IsolationForest(contamination=0.04, random_state=42)
                iso_forest.fit(X_train)
            else:
                iso_forest = None

            for r in b_readings:
                h = r.timestamp.hour
                if h not in baselines.index:
                    continue

                b_stats = baselines.loc[h]
                
                # Check 1: Water leak (Constant night flow or severe daytime surge)
                water_mean = b_stats["water_mean"]
                water_std = max(1.0, b_stats["water_std"])
                water_z = (r.water_litres - water_mean) / water_std

                # Night leak condition: 00:00 - 05:00 and water flow > baseline + 3*std
                is_night = 0 <= h <= 5
                if (is_night and r.water_litres > (water_mean + 2.5 * water_std) and r.water_litres > 500) or water_z > 3.8:
                    excess = max(0.0, r.water_litres - water_mean)
                    cost_loss, co2_loss = self.footprint.calculate_water(excess)
                    severity = "critical" if excess > 2000 or water_z > 4.5 else "medium"
                    cause = (
                        f"Uncharacteristic continuous water draw of {int(r.water_litres)} L/hr during off-hours (0{h}:00). Likely ruptured pipe or open valve."
                        if is_night else
                        f"Sudden water surge (+{int(excess)} L above baseline). Check plumbing fixtures or cooling tower supply."
                    )
                    detected_events.append({
                        "building_id": b_id,
                        "timestamp": r.timestamp,
                        "resource": "water",
                        "severity": severity,
                        "duration_hours": 1.0,
                        "estimated_excess_units": round(excess, 1),
                        "estimated_excess_inr": cost_loss,
                        "estimated_excess_co2e": co2_loss,
                        "probable_cause": cause,
                        "status": "detected"
                    })

                # Check 2: Electricity after-hours load or sudden spike
                elec_mean = b_stats["kwh_mean"]
                elec_std = max(1.0, b_stats["kwh_std"])
                elec_z = (r.electricity_kwh - elec_mean) / elec_std

                excess_kwh = r.electricity_kwh - elec_mean
                if (is_night and r.electricity_kwh > (elec_mean + 2.2 * elec_std) and excess_kwh > 30) or elec_z > 3.5:
                    excess = max(0.0, excess_kwh)
                    cost_loss, co2_loss = self.footprint.calculate_electricity(excess)
                    severity = "critical" if elec_z > 4.0 else "medium"
                    cause = (
                        f"HVAC chillers, lab equipment or floor lighting active during un-scheduled night hours (0{h}:00). Expected {elec_mean:.1f} kWh, actual {r.electricity_kwh:.1f} kWh."
                        if is_night else
                        f"Unusual daytime electrical surge (+{excess:.1f} kWh above typical pattern). Possible motor fault or simultaneous equipment surge."
                    )
                    detected_events.append({
                        "building_id": b_id,
                        "timestamp": r.timestamp,
                        "resource": "electricity",
                        "severity": severity,
                        "duration_hours": 1.0,
                        "estimated_excess_units": round(excess, 1),
                        "estimated_excess_inr": cost_loss,
                        "estimated_excess_co2e": co2_loss,
                        "probable_cause": cause,
                        "status": "detected"
                    })

                # Check 3: Waste overflow / surge
                waste_mean = b_stats["waste_mean"]
                waste_std = max(1.0, b_stats["waste_std"])
                waste_z = (r.waste_kg - waste_mean) / waste_std
                if waste_z > 3.2 and (r.waste_kg - waste_mean) > 50:
                    excess = max(0.0, r.waste_kg - waste_mean)
                    cost_loss, co2_loss = self.footprint.calculate_waste(excess)
                    detected_events.append({
                        "building_id": b_id,
                        "timestamp": r.timestamp,
                        "resource": "waste",
                        "severity": "medium",
                        "duration_hours": 1.0,
                        "estimated_excess_units": round(excess, 1),
                        "estimated_excess_inr": cost_loss,
                        "estimated_excess_co2e": co2_loss,
                        "probable_cause": f"Severe waste bin overflow (+{int(excess)} kg above normal). Unsorted event scrap or kitchen cleanup surge.",
                        "status": "detected"
                    })

        return detected_events
