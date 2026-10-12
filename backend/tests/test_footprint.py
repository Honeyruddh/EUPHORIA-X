import pytest
from app.services.footprint import FootprintEngine


def test_footprint_electricity_calculation():
    custom_settings = {
        "factors": {
            "electricity_tariff_inr_per_kwh": 10.0,
            "electricity_emission_kg_co2e_per_kwh": 0.8
        }
    }
    engine = FootprintEngine(custom_settings)
    cost, co2 = engine.calculate_electricity(100.0)
    assert cost == 1000.0
    assert co2 == 80.0


def test_footprint_water_calculation():
    custom_settings = {
        "factors": {
            "water_tariff_inr_per_litre": 0.05,
            "water_emission_kg_co2e_per_litre": 0.0004
        }
    }
    engine = FootprintEngine(custom_settings)
    cost, co2 = engine.calculate_water(1000.0)
    assert cost == 50.0
    assert co2 == 0.40


def test_footprint_waste_calculation_with_recycling():
    custom_settings = {
        "factors": {
            "waste_disposal_inr_per_kg": 4.0,
            "waste_landfill_emission_kg_co2e_per_kg": 1.20,
            "waste_recycled_offset_kg_co2e_per_kg": -0.80
        }
    }
    engine = FootprintEngine(custom_settings)
    # 100 kg total, 40 kg recycled, 60 kg landfilled
    cost, co2 = engine.calculate_waste(100.0, 40.0)
    assert cost == 400.0
    # Landfill: 60 * 1.2 = 72.0; Recycled offset: 40 * -0.8 = -32.0; Net: 40.0
    assert co2 == 40.0


def test_footprint_total_aggregation():
    engine = FootprintEngine()
    result = engine.calculate_total(kwh=500, water_l=10000, waste_kg=120, recycled_kg=40)
    assert result["total_cost_inr"] > 0
    assert result["total_co2e_kg"] > 0
    assert "breakdown" in result
    assert "electricity" in result["breakdown"]
    assert "water" in result["breakdown"]
    assert "waste" in result["breakdown"]
