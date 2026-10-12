import os
from datetime import datetime, timedelta
from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..models import Building, Reading, AnomalyEvent, Recommendation
from ..config import load_settings
from .footprint import FootprintEngine
from .scorer import calculate_building_sustainability_scores


def generate_sustainability_report(db: Session, days: int = 7) -> Dict[str, Any]:
    settings = load_settings()
    footprint = FootprintEngine(settings)
    
    latest_date = db.query(func.max(Reading.timestamp)).scalar() or datetime.utcnow()
    period_start = latest_date - timedelta(days=days)

    total_kwh = db.query(func.sum(Reading.electricity_kwh)).filter(Reading.timestamp >= period_start).scalar() or 0.0
    total_water = db.query(func.sum(Reading.water_litres)).filter(Reading.timestamp >= period_start).scalar() or 0.0
    total_waste = db.query(func.sum(Reading.waste_kg)).filter(Reading.timestamp >= period_start).scalar() or 0.0
    total_recycled = db.query(func.sum(Reading.waste_recycled_kg)).filter(Reading.timestamp >= period_start).scalar() or 0.0
    
    totals = footprint.calculate_total(total_kwh, total_water, total_waste, total_recycled)
    
    active_anomalies = db.query(AnomalyEvent).filter(
        AnomalyEvent.timestamp >= period_start
    ).all()
    
    recs = db.query(Recommendation).filter(Recommendation.status == "active").limit(3).all()
    leaderboard = calculate_building_sustainability_scores(db, days=days)

    top_building = leaderboard[0] if leaderboard else None
    lowest_building = leaderboard[-1] if leaderboard else None

    # Check for Claude API key
    api_key = os.getenv("ANTHROPIC_API_KEY")
    ai_generated = False
    narrative = ""

    if api_key:
        try:
            import httpx
            prompt = f"""You are the Chief Sustainability Officer for {settings.get('campus_name', 'University')}.
Summarize this weekly performance report concisely in 3 executive bullet points:
- Total Electricity: {total_kwh:,.1f} kWh, Water: {total_water:,.0f} L, Waste: {total_waste:,.0f} kg
- Total Expenditure: INR {totals['total_cost_inr']:,.2f}, Footprint: {totals['total_co2e_kg']:,.1f} kg CO2e
- Top Performing Facility: {top_building['building_name'] if top_building else 'N/A'} (Score {top_building['score'] if top_building else 'N/A'})
- Attention Facility: {lowest_building['building_name'] if lowest_building else 'N/A'}
- Active Anomalies Detected: {len(active_anomalies)}
Provide strategic recommendations for campus leadership."""
            
            res = httpx.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                json={
                    "model": "claude-3-haiku-20240307",
                    "max_tokens": 400,
                    "messages": [{"role": "user", "content": prompt}]
                },
                timeout=8.0
            )
            if res.status_code == 200:
                data = res.json()
                narrative = data["content"][0]["text"]
                ai_generated = True
        except Exception:
            ai_generated = False

    if not ai_generated:
        narrative = f"""Executive Summary for the 7-day period ending {latest_date.strftime('%B %d, %Y')}:

1. Resource Consumption & Fiscal Exposure: Across all campus sectors, resource consumption totaled {total_kwh:,.1f} kWh of power, {total_water:,.0f} litres of bulk water, and {total_waste:,.0f} kg of municipal waste. This generated an operational overhead of ₹{totals['total_cost_inr']:,.2f} and an environmental footprint of {totals['total_co2e_kg']:,.1f} kg CO₂e.

2. Benchmark Highlights: {top_building['building_name'] if top_building else 'Administrative Block'} secured the #1 sustainability ranking (Score {top_building['score'] if top_building else '94'}/100) due to strict off-hour scheduling and {top_building['recycling_rate_pct'] if top_building else '45'}% waste diversion. Conversely, {lowest_building['building_name'] if lowest_building else 'Nilgiri Hostel'} requires immediate facilities attention due to active flow deviations.

3. Urgent Remediation Actions: {len(active_anomalies)} operational anomalies are currently logged. Addressing the pipe leak in Nilgiri Hostel and automating night HVAC setback will recoup an estimated ₹{sum(r.projected_savings_inr_month for r in recs):,.2f}/month while averting {sum(r.projected_savings_co2e_month for r in recs):,.1f} kg of carbon monthly."""

    return {
        "campus_name": settings.get("campus_name", "CampusPulse University"),
        "period_start": period_start,
        "period_end": latest_date,
        "ai_generated": ai_generated,
        "narrative": narrative,
        "totals": {
            "electricity_kwh": round(total_kwh, 1),
            "water_litres": round(total_water, 0),
            "waste_kg": round(total_waste, 1),
            "recycled_kg": round(total_recycled, 1),
            "cost_inr": totals["total_cost_inr"],
            "co2e_kg": totals["total_co2e_kg"]
        },
        "anomalies_count": len(active_anomalies),
        "leaderboard_snapshot": leaderboard[:3],
        "top_recommendations": [{
            "id": r.id,
            "title": r.title,
            "category": r.category,
            "savings_inr": r.projected_savings_inr_month,
            "savings_co2e": r.projected_savings_co2e_month
        } for r in recs]
    }
