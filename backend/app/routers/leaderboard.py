from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..services.scorer import calculate_building_sustainability_scores

router = APIRouter(prefix="/api/leaderboard", tags=["Leaderboard & Scoring"])


@router.get("")
def get_leaderboard(days: int = Query(7, ge=1, le=30), db: Session = Depends(get_db)):
    return calculate_building_sustainability_scores(db, days=days)
