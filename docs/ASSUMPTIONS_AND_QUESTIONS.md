# Assumptions and Clarifications Log — CampusPulse

This document records all questions raised with the user and the confirmed design decisions and parameters.

## 1. Project Directory & Workspace Layout
- **Decision:** Dedicated directory at `/Users/honeyruddh/antigravity workspace/campuspulse/` with `/backend`, `/frontend`, `/data`, and `/docs`.

## 2. Campus Buildings & Characteristics
- **Buildings Seeded:**
  1. **Nilgiri Hostel**: Residential/Dormitory, 650 students, 8,200 m². High morning/evening water & evening electricity.
  2. **Central Library**: Academic/Study, 1,200 capacity, 6,500 m². High afternoon/evening HVAC load, exam-week spike.
  3. **Ramanujan Computing & Labs**: High-load Research/Labs, 800 seats, 9,800 m². Continuous 24/7 server base-load with daytime peaks.
  4. **Annapoorna Canteen & Food Hall**: Dining/Services, 1,500 meals/day, 3,200 m². Tri-modal water & electricity spikes at breakfast, lunch, and dinner; high organic waste.
  5. **Administrative Block**: Offices, 180 staff, 4,000 m². Standard 9-to-6 weekday curve, minimal weekend load.
  6. **Indoor Sports & Aquatics**: Recreation/Athletics, 450 capacity, 5,400 m². High water consumption (pool/showers) during early morning and late afternoon.

## 3. Tariffs & Emission Factors (Editable Placeholders)
*Note: All items marked as "placeholder - verify source" in `backend/config/settings.json` and in the UI Settings page.*
- **Electricity Tariff:** ₹8.50 / kWh
- **Electricity Emission Factor:** 0.716 kg CO₂e / kWh (CEA India Grid Baseline)
- **Water Tariff:** ₹0.045 / Litre (₹45 / kL)
- **Water Emission Factor:** 0.00035 kg CO₂e / Litre (Pumping, aeration & treatment energy proxy)
- **Waste Disposal Cost:** ₹3.20 / kg (Municipal haulage & tipping)
- **Landfill Waste Factor:** 1.250 kg CO₂e / kg (Methane & decomposition lifecycle)
- **Recycling Avoided Factor:** -0.850 kg CO₂e / kg (Offset from virgin material avoidance)

## 4. Sustainability Scoring Formula (0–100)
- $\text{Score} = 100 - (0.35 \times P_{\text{elec}} + 0.25 \times P_{\text{water}} + 0.20 \times P_{\text{waste}} + 0.20 \times P_{\text{anomalies}})$
- Normalized against baseline target per building.
- Trend arrows determined by comparing current score against trailing 7-day average.

## 5. What-If Savings Relatable Equivalents
- **Urban Trees Equivalent:** 1.75 kg CO₂e per tree per month (21.0 kg CO₂e/yr) (US EPA / IPCC Biomass default).
- **Passenger Car Distance:** 0.120 kg CO₂e per km driven (Standard petrol vehicle).
- **Homes Powered:** 10.0 kWh per day per average urban household.

## 6. UI Aesthetic
- **Eco-Tech Obsidian:** High-contrast dark theme with emerald (#10b981), cyan (#06b6d4), and amber alerts. Accessible, responsive, with light-mode toggle.
