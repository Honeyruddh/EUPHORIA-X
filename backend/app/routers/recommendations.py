from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Recommendation
from ..schemas import RecommendationOut
from ..services.recommender import generate_recommendations

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])


@router.get("", response_model=List[RecommendationOut])
def list_recommendations(db: Session = Depends(get_db)):
    recs = generate_recommendations(db)
    return recs


@router.post("/{rec_id}/apply")
def apply_rec(rec_id: int, db: Session = Depends(get_db)):
    rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    
    rec.status = "applied"
    rec.applied_at = datetime.utcnow()
    db.commit()
    db.refresh(rec)
    return rec
