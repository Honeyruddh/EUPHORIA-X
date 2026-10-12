# CampusPulse — Unified Campus Resource & Decarbonization Intelligence

> **Hackathon MVP**: A software-only, zero-hardware resource intelligence platform for campus facilities managers. Tracks **Electricity**, **Water**, and **Waste** across all campus buildings, detects anomalies automatically using Z-score & Isolation Forest baselines, translates all consumption and wastage into **Cost (INR)** and **Carbon Footprint ($\text{kg CO}_2\text{e}$)**, ranks actionable interventions, and simulates decarbonization ROI.

---

## 🚀 One-Command Quick Start

### 1. Prerequisites
- Python 3.10+ (tested on Python 3.13)
- Node.js 18+ and npm

### 2. Backend Setup & Run
```bash
cd campuspulse/backend

# Create & activate virtual environment
python3 -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run test suite
PYTHONPATH=. pytest -v

# Start FastAPI server
PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*The database automatically seeds 30 days of hourly realistic readings (4,320 records across 6 buildings) on first startup.*
API Documentation (Swagger UI): `http://localhost:8000/docs`

### 3. Frontend Setup & Run
```bash
cd campuspulse/frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev -- --host 0.0.0.0 --port 5173
```
Dashboard URL: `http://localhost:5173/`

---

## 🏛️ Seeded Campus Facilities (6 Buildings)
1. **Nilgiri Hostel**: Residential/Dormitory (650 occupants, 8,200 m²). High morning/evening water and evening electricity.
2. **Central Library**: Academic/Study (1,200 seats, 6,500 m²). Daytime HVAC load + late-night exam-week surge.
3. **Ramanujan Computing & Labs**: Research/High-Load (800 seats, 9,800 m²). 24/7 server base-load + daytime compute peaks.
4. **Annapoorna Canteen & Food Hall**: Dining/Kitchen (1,500 meals/day, 3,200 m²). Tri-modal breakfast, lunch, and dinner load.
5. **Administrative Block**: Offices/Administration (180 staff, 4,000 m²). Standard 9-to-6 weekday curve; low weekend load.
6. **Indoor Sports & Aquatics Complex**: Recreation/Athletics (450 capacity, 5,400 m²). High morning and evening water draw.

---

## 🧠 Core Technical Choices & Architecture

### 1. Footprint & Conversion Engine (`app/services/footprint.py`)
All physical quantities are converted into dual impact units using configurable parameters in `backend/config/settings.json` (also editable via the UI Settings page):
- **Electricity**: ₹8.50 / kWh tariff • 0.716 kg CO₂e / kWh (CEA India Grid Baseline)
- **Water**: ₹0.045 / Litre (₹45 / kL) • 0.00035 kg CO₂e / Litre embedded pumping/treatment
- **Solid Waste**: ₹3.20 / kg haulage • 1.250 kg CO₂e / kg landfill factor • -0.850 kg CO₂e / kg recycling avoidance credit

### 2. Multi-Tier Anomaly Detection (`app/services/detector.py`)
- **Hourly Baseline Modeling**: Computes $\mu$, $\sigma$, median, and Interquartile Range (IQR) per facility for every hour of the day (0–23).
- **Z-Score & Thresholding**: Detects off-hours electrical chillers ($Z > 3.5$) and nighttime baseload leaks ($01:00-05:00$, continuous flow $> 2.5\sigma$).
- **Isolation Forest Validation**: Multi-variate scikit-learn anomaly scoring to filter out normal noisy spikes from genuine sustained incidents.
- **Impact Loss Quantification**: Every detected anomaly computes excess units, financial loss (INR), and carbon emissions incurred.

### 3. Live On-Stage Anomaly Injector (`app/services/injector.py`)
Facilitates live demonstration for judges with 1-click on-stage scenarios:
- `hostel_water_leak`: Underground riser joint rupture in Nilgiri Hostel (2,600 L/hr continuous flow).
- `library_overnight_ac`: Chiller timer override in Central Library after 22:00 closing (+75 kWh/hr).
- `labs_server_surge`: Thermal fan failure and power surge in Ramanujan Labs (+140 kWh/hr).
- `canteen_waste_spike`: Bulk unsorted food waste surge in Annapoorna Canteen (+180 kg/hr).

### 4. Recommendation Engine (`app/services/recommender.py`)
Translates anomalies and baseload audits into ranked, explainable interventions:
- Shows the exact triggering data condition.
- Computes monthly savings (INR & CO₂), estimated capital cost (Capex), and simple payback period in months.
- Allows admins to mark recommendations as "Implemented" with an active savings impact tracker.

### 5. What-If Decarbonization Simulator (`app/services/simulator_whatif.py`)
Interactive real-time sliders allow facility leaders to test policies:
- Off-hours night load setback cut (0–60%)
- Campus general electrical efficiency (0–40%)
- Water leak remediation toggle
- Low-flow plumbing fixtures (0–40%)
- Waste recycling diversion (0–80%)
Converts net savings into relatable equivalents:
- **Urban Trees Equivalent**: 1.75 kg CO₂e/tree/month (US EPA / IPCC default).
- **Passenger Car Km Avoided**: 0.120 kg CO₂e/km.
- **Urban Homes Powered**: 10.0 kWh/day per household.

### 6. Sustainability Scoring & Public Leaderboard (`app/services/scorer.py`)
Normalized 0–100 score per building:
$$\text{Score} = 100 - [0.35 \cdot P_{\text{elec}} + 0.25 \cdot P_{\text{water}} + 0.20 \cdot P_{\text{waste}} + 0.20 \cdot P_{\text{anomaly}}]$$
Includes rolling 7-day trend indicators (↑ Improving, → Steady, ↓ Declining) and a student-friendly Public Kiosk Mode.

---

## 📁 Repository Structure
```
campuspulse/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app & router registry
│   │   ├── database.py              # SQLite + SQLAlchemy session
│   │   ├── models.py                # Database models
│   │   ├── schemas.py               # Pydantic schemas
│   │   ├── config.py                # Configuration loader
│   │   ├── services/
│   │   │   ├── simulator.py         # 30-day realistic circadian generator
│   │   │   ├── footprint.py         # INR & CO2e footprint engine
│   │   │   ├── detector.py          # Z-score + Isolation Forest detector
│   │   │   ├── injector.py          # On-stage live anomaly injection
│   │   │   ├── recommender.py       # Ranked explainable recommendations
│   │   │   ├── simulator_whatif.py  # What-if scenario simulation
│   │   │   ├── scorer.py            # 0-100 score & leaderboard logic
│   │   │   └── reporter.py          # Executive report generator
│   │   └── routers/                 # Modular REST API endpoints
│   ├── config/
│   │   └── settings.json            # Editable factors & tariffs
│   ├── tests/
│   │   ├── test_footprint.py        # Footprint engine tests
│   │   └── test_detector.py         # Anomaly detector & injection tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/client.js            # Unified FastAPI client
│   │   ├── components/              # Navbar, MetricCard, QuickDemoModal
│   │   ├── pages/                   # Overview, Buildings, Anomalies, What-If, etc.
│   │   ├── App.jsx                  # Main dashboard controller
│   │   └── index.css                # Eco-Tech Obsidian design system
│   ├── package.json
│   └── vite.config.js
└── docs/
    ├── DEMO_SCRIPT.md               # 3-4 minute live demo pitch walkthrough
    ├── DEPENDENCIES.md              # Open source license disclosures
    └── ASSUMPTIONS_AND_QUESTIONS.md # Architecture clarifications log
```
