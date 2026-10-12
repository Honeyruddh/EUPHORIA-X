from typing import Dict, Any, Tuple
from ..config import load_settings


class FootprintEngine:
    def __init__(self, settings: Dict[str, Any] = None):
        if settings is None:
            settings = load_settings()
        self.factors = settings.get("factors", {})
        
        # Tariffs (INR)
        self.elec_tariff = float(self.factors.get("electricity_tariff_inr_per_kwh", 8.50))
        self.water_tariff = float(self.factors.get("water_tariff_inr_per_litre", 0.045))
        self.waste_cost_per_kg = float(self.factors.get("waste_disposal_inr_per_kg", 3.20))
        
        # Emission Factors (kg CO2e)
        self.elec_emission_factor = float(self.factors.get("electricity_emission_kg_co2e_per_kwh", 0.716))
        self.water_emission_factor = float(self.factors.get("water_emission_kg_co2e_per_litre", 0.00035))
        self.waste_landfill_factor = float(self.factors.get("waste_landfill_emission_kg_co2e_per_kg", 1.250))
        self.waste_recycled_offset = float(self.factors.get("waste_recycled_offset_kg_co2e_per_kg", -0.850))

    def calculate_electricity(self, kwh: float) -> Tuple[float, float]:
        """Returns (cost_inr, co2e_kg)"""
        cost = kwh * self.elec_tariff
        co2e = kwh * self.elec_emission_factor
        return round(cost, 2), round(co2e, 2)

    def calculate_water(self, litres: float) -> Tuple[float, float]:
        """Returns (cost_inr, co2e_kg)"""
        cost = litres * self.water_tariff
        co2e = litres * self.water_emission_factor
        return round(cost, 2), round(co2e, 2)

    def calculate_waste(self, total_kg: float, recycled_kg: float = 0.0) -> Tuple[float, float]:
        """Returns (cost_inr, co2e_kg)"""
        landfilled_kg = max(0.0, total_kg - recycled_kg)
        cost = total_kg * self.waste_cost_per_kg
        co2e = (landfilled_kg * self.waste_landfill_factor) + (recycled_kg * self.waste_recycled_offset)
        return round(cost, 2), round(co2e, 2)

    def calculate_total(self, kwh: float, water_l: float, waste_kg: float, recycled_kg: float = 0.0) -> Dict[str, Any]:
        elec_cost, elec_co2e = self.calculate_electricity(kwh)
        water_cost, water_co2e = self.calculate_water(water_l)
        waste_cost, waste_co2e = self.calculate_waste(waste_kg, recycled_kg)

        total_cost = elec_cost + water_cost + waste_cost
        total_co2e = elec_co2e + water_co2e + waste_co2e

        return {
            "total_cost_inr": round(total_cost, 2),
            "total_co2e_kg": round(total_co2e, 2),
            "breakdown": {
                "electricity": {"cost_inr": elec_cost, "co2e_kg": elec_co2e},
                "water": {"cost_inr": water_cost, "co2e_kg": water_co2e},
                "waste": {"cost_inr": waste_cost, "co2e_kg": waste_co2e}
            }
        }
