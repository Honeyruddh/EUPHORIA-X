import csv
import io
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Reading, Building
from ..config import load_settings
from ..services.footprint import FootprintEngine

router = APIRouter(prefix="/api/data", tags=["Data Import/Export"])


@router.get("/sample-template.csv")
def get_sample_csv():
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["building_id", "timestamp", "electricity_kwh", "water_litres", "waste_kg", "waste_recycled_kg"])
    writer.writerow(["nilgiri-hostel", "2026-10-01 08:00:00", "75.4", "3200.0", "14.2", "4.5"])
    writer.writerow(["central-library", "2026-10-01 08:00:00", "58.1", "450.0", "3.8", "1.5"])
    writer.writerow(["ramanujan-labs", "2026-10-01 08:00:00", "165.2", "920.0", "5.1", "2.0"])
    
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=campuspulse_readings_template.csv"}
    )


@router.post("/upload")
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported")

    content = await file.read()
    try:
        decoded = content.decode("utf-8")
    except UnicodeDecodeError:
        decoded = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(decoded))
    required_cols = {"building_id", "timestamp", "electricity_kwh", "water_litres", "waste_kg"}
    if not required_cols.issubset(set(reader.fieldnames or [])):
        raise HTTPException(
            status_code=400,
            detail=f"CSV must contain headers: {', '.join(required_cols)}"
        )

    settings = load_settings()
    footprint = FootprintEngine(settings)
    inserted_count = 0
    readings = []

    for row in reader:
        try:
            b_id = row["building_id"].strip()
            ts = datetime.fromisoformat(row["timestamp"].strip())
            kwh = float(row["electricity_kwh"])
            water = float(row["water_litres"])
            waste = float(row["waste_kg"])
            recycled = float(row.get("waste_recycled_kg", 0.0) or 0.0)

            # Ensure building exists
            bldg = db.query(Building).filter(Building.id == b_id).first()
            if not bldg:
                bldg = Building(
                    id=b_id,
                    name=b_id.replace("-", " ").title(),
                    building_type="Institutional",
                    occupancy=200,
                    area_sqm=3000.0
                )
                db.add(bldg)
                db.commit()

            totals = footprint.calculate_total(kwh, water, waste, recycled)
            r = Reading(
                building_id=b_id,
                timestamp=ts,
                electricity_kwh=kwh,
                water_litres=water,
                waste_kg=waste,
                waste_recycled_kg=recycled,
                cost_inr=totals["total_cost_inr"],
                co2e_kg=totals["total_co2e_kg"],
                is_anomaly=False
            )
            readings.append(r)
            inserted_count += 1
            if len(readings) >= 500:
                db.bulk_save_objects(readings)
                readings = []
        except Exception as e:
            continue

    if readings:
        db.bulk_save_objects(readings)
    db.commit()

    return {
        "status": "success",
        "message": f"Successfully parsed and imported {inserted_count} smart-meter readings",
        "rows_imported": inserted_count
    }
