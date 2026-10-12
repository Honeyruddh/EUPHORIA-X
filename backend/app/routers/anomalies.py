from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..models import AnomalyEvent
from ..schemas import AnomalyEventOut, AnomalyInjectRequest
from ..services.detector import AnomalyDetector
from ..services.injector import inject_anomaly_scenario

router = APIRouter(prefix="/api/anomalies", tags=["Anomalies"])


class StatusUpdate(BaseModel):
    status: str  # "acknowledged" | "resolved"
    notes: Optional[str] = None


@router.get("", response_model=List[AnomalyEventOut])
def list_anomalies(
    building_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(AnomalyEvent)
    if building_id:
        query = query.filter(AnomalyEvent.building_id == building_id)
    if status:
        query = query.filter(AnomalyEvent.status == status)
    return query.order_by(desc(AnomalyEvent.timestamp)).all()


@router.post("/detect")
def trigger_detection(hours_back: int = 48, db: Session = Depends(get_db)):
    detector = AnomalyDetector(db)
    detected = detector.detect_recent_anomalies(hours_back=hours_back)
    
    # Save newly detected items that aren't duplicates
    added = 0
    for d in detected:
        existing = db.query(AnomalyEvent).filter(
            AnomalyEvent.building_id == d["building_id"],
            AnomalyEvent.resource == d["resource"],
            AnomalyEvent.timestamp == d["timestamp"]
        ).first()
        if not existing:
            event = AnomalyEvent(**d)
            db.add(event)
            added += 1
    db.commit()

    return {"detected_count": len(detected), "newly_saved": added, "events": detected}


@router.post("/inject")
def inject_scenario(payload: AnomalyInjectRequest, db: Session = Depends(get_db)):
    result = inject_anomaly_scenario(
        db=db,
        scenario=payload.scenario,
        building_id=payload.building_id,
        duration_hours=payload.duration_hours or 6,
        multiplier=payload.multiplier or 2.5
    )
    return result


@router.patch("/{event_id}/status")
def update_status(event_id: int, update: StatusUpdate, db: Session = Depends(get_db)):
    event = db.query(AnomalyEvent).filter(AnomalyEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Anomaly event not found")
    
    event.status = update.status
    if update.notes:
        event.notes = f"{event.notes or ''}\n[{datetime.utcnow().strftime('%Y-%m-%d %H:%M')}] {update.notes}".strip()
    if update.status == "resolved":
        event.resolved_at = datetime.utcnow()
    
    db.commit()
    db.refresh(event)
    return event
