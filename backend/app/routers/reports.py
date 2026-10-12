from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..services.reporter import generate_sustainability_report

router = APIRouter(prefix="/api/report", tags=["Executive Reports"])


@router.get("")
def get_report(days: int = Query(7, ge=1, le=30), db: Session = Depends(get_db)):
    return generate_sustainability_report(db, days=days)
