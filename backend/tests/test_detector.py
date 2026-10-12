import pytest
from app.database import SessionLocal, Base, engine
from app.services.simulator import seed_database_with_simulator
from app.services.detector import AnomalyDetector
from app.services.injector import inject_anomaly_scenario
from app.models import Reading, AnomalyEvent


@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    seed_database_with_simulator(session, days=7)
    yield session
    session.close()


def test_anomaly_detection_scan(db_session):
    detector = AnomalyDetector(db_session)
    detected = detector.detect_recent_anomalies(hours_back=72)
    assert isinstance(detected, list)
    # Ensure any detected items have properly calculated loss fields
    for item in detected:
        assert "resource" in item
        assert "severity" in item
        assert "estimated_excess_inr" in item
        assert "estimated_excess_co2e" in item
        assert item["estimated_excess_inr"] >= 0
        assert item["estimated_excess_co2e"] >= 0


def test_live_anomaly_injection(db_session):
    res = inject_anomaly_scenario(
        db=db_session,
        scenario="hostel_water_leak",
        building_id="nilgiri-hostel",
        duration_hours=4
    )
    assert res["status"] == "injected"
    assert res["building_id"] == "nilgiri-hostel"
    assert res["resource"] == "water"
    assert res["loss_inr"] > 0
    assert res["loss_co2e"] > 0
    
    # Verify AnomalyEvent was stored
    event = db_session.query(AnomalyEvent).filter(AnomalyEvent.id == res["event_id"]).first()
    assert event is not None
    assert event.severity == "critical"
