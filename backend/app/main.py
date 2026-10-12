from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .routers import campus, anomalies, recommendations, simulate, leaderboard, reports, data
from .services.simulator import seed_database_with_simulator

# Create all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CampusPulse API",
    description="Unified Resource-Intelligence & Decarbonization Dashboard for Campus Admins",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register feature routers
app.include_router(campus.router)
app.include_router(anomalies.router)
app.include_router(recommendations.router)
app.include_router(simulate.router)
app.include_router(leaderboard.router)
app.include_router(reports.router)
app.include_router(data.router)


@app.on_event("startup")
def startup_populate():
    db = SessionLocal()
    try:
        seed_database_with_simulator(db)
    finally:
        db.close()


@app.get("/")
def root():
    return {
        "app": "CampusPulse",
        "tagline": "Resource-intelligence & Decarbonization Dashboard",
        "status": "online",
        "docs_url": "/docs",
        "version": "1.0.0"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
