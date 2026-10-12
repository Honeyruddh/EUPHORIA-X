from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import WhatIfSimulateRequest, WhatIfSimulateResponse
from ..services.simulator_whatif import simulate_savings

router = APIRouter(prefix="/api/simulate", tags=["Simulator"])


@router.post("/what-if", response_model=WhatIfSimulateResponse)
def run_simulation(request: WhatIfSimulateRequest, db: Session = Depends(get_db)):
    return simulate_savings(db, request)
