# CampusPulse — 3-4 Minute Live Demo & Pitch Script

**Target Audience:** Hackathon Judges & Campus Sustainability Committee  
**Speaker Role:** Lead Product Architect / Full-Stack Engineer  
**Live URL:** `http://localhost:5173/` (Backend running on `http://localhost:8000/`)

---

## ⏱️ Minute 0:00 – 0:45: The Problem & The Core Philosophy

> *"Judges, university campuses are small cities. They consume megawatts of power and millions of litres of water daily. But across higher education, facilities managers face a chronic problem: **fragmentation and invisibility**.*
> 
> *Electricity is buried in a utility PDF bill that arrives 30 days late. Water leaks under a hostel go unnoticed for weeks until the ground is soaked. Solid waste haulage is an operational afterthought.*
> 
> *We built **CampusPulse** — a zero-hardware, software-only resource intelligence platform that unifies Electricity, Water, and Waste. It detects operational bleeding in real-time, converts every kilowatt-hour and litre into **hard rupees (INR)** and **carbon ($\text{kg CO}_2\text{e}$)**, and shows facilities leaders the exact high-impact actions to take."*

---

## ⏱️ Minute 0:45 – 1:30: The Live Operations Center (Overview Dashboard)

*(Action: Display `Overview` tab on screen)*

> *"Here on the Campus Overview dashboard, we are tracking 6 campus facilities across 30 days of sub-hourly telemetry.*
> 
> *Notice our philosophy right away: **No detached engineering units.** Beside our 277,000 kWh of electricity and 5.6 million litres of water, the admin immediately sees the financial exposure: **₹26.8 Lakhs in utility expenditure** and **202 Tonnes of $\text{CO}_2\text{e}$**.*
> 
> *Our charts reveal circadian rhythms: the day/night solar curves, weekend drops in the Admin Block, and meal-time surges in Annapoorna Canteen.*
> 
> *At the top right, our campus-wide **Sustainability Score (84/100)** gives leadership an instant pulse on whether operations are improving or deteriorating."*

---

## ⏱️ Minute 1:30 – 2:15: Live Anomaly Injection & Detection (The "Magic" Moment)

*(Action: Click the glowing red button in top bar: **"Simulate On-Stage Anomaly"**)*

> *"Now let's test what happens when an operational failure occurs right now in real life.*
> 
> *I’m going to click **'Simulate Live'** on an underground pipe leak in Nilgiri Hostel.*
> 
> *(Click button → Success banner appears)*
> 
> *The system just injected an uncharacteristic continuous draw of 2,600 litres/hour during the 2:00 AM off-peak window. Let's switch to the **Anomalies & Alerts** tab.*
> 
> *(Navigate to 'Anomalies & Alerts')*
> 
> *Instantly, our dual-tier engine — combining per-hour Z-Score modeling and Isolation Forest multi-variate validation — flags this incident with **Critical Severity**.*
> 
> *It doesn't just say 'high water': it explains in plain language: **'Continuous off-hours draw indicative of fractured flush valve or distribution pipe'**, and quantifies the damage: **₹702/day in wasted municipal tariff** and **5.5 kg $\text{CO}_2\text{e}$**.*
> 
> *The facilities team can hit **'Acknowledge'** or dispatch maintenance and click **'Resolve'**, closing the operational feedback loop."*

---

## ⏱️ Minute 2:15 – 2:50: Prescriptive Recommendations & What-If Simulation

*(Action: Navigate to **Recommendations** tab, then **What-If Simulator**)*

> *"Detection is useless without actionable decisions. On the **Recommendations** page, the algorithm ranks interventions by return on investment.*
> 
> *Notice that each recommendation is fully explainable: it cites the exact sensor data that triggered it — whether it's an off-peak baseload drift in Central Library or low recycling diversion in the canteen.*
> 
> *When the facilities admin implements a recommendation, they click **'Mark Implemented'** — locking in recurring monthly savings on our Impact Tracker.*
> 
> *(Switch to 'What-If Simulator')*
> 
> *Now let’s look at the **What-If Decarbonization Simulator**. University leadership needs to justify budget requests. By adjusting our policy sliders:*
> - *Curtailing off-hours HVAC by 25%,*
> - *Fixing active leaks,*
> - *And increasing canteen composting by 30%,*
> 
> *CampusPulse recalculates in real-time: **₹5.49 Lakhs in monthly fiscal savings** and **relatable equivalents cited from US EPA & IPCC**: equivalent to **planting 14,000 urban trees** or taking **200,000 passenger car km off the road**."*

---

## ⏱️ Minute 2:50 – 3:30: Facility Leaderboard & The Scalability Story

*(Action: Navigate to **Leaderboard** tab, then mention Data Hub)*

> *"Finally, we believe in healthy institutional competition. Our **0–100 Sustainability Leaderboard** ranks every facility based on documented weights. The Administrative Block holds #1 due to tight off-hours shutdown, while hostels with leaks fall into warning grades. Admins can even toggle **Public Student Kiosk View** to engage student dorms in campus conservation.*
> 
> *How does this scale beyond today's hackathon demo?*
> 1. **Zero Hardware Lock-In**: In our **Data Hub**, you can upload real CSV telemetry from existing Schneider, Siemens, or IoT smart meters today, or connect directly to BACnet/Modbus/REST BMS APIs.
> 2. **Multi-Campus Fleet Governance**: The same architecture extends across multi-campus university systems or corporate facility portfolios.
> 3. **Student Gamification**: Connecting building scores to campus student apps for inter-hostel conservation hackathons.
> 
> *CampusPulse takes unread utility meters and turns them into measurable rupees saved and carbon eliminated. Thank you, and we’re excited for your questions!"*

---

## 💡 Quick Q&A Cheat Sheet for Judges

| Question | Answer |
|---|---|
| **"Where do the emission factors and tariffs come from?"** | All figures are transparently stored in `backend/config/settings.json` and editable on the **Settings** page (marked clearly as *placeholder - verify source*). They reference the Central Electricity Authority (CEA) India baseline ($0.716\text{ kg CO}_2/\text{kWh}$) and municipal water supply benchmarks. |
| **"How does the anomaly detection avoid false positives?"** | It uses an hourly envelope ($\mu \pm 2.5\sigma$ and IQR per hour-of-day), and cross-validates through a scikit-learn `IsolationForest` trained on non-anomalous baseline data. |
| **"Does this require new sensors?"** | No. Campuses already have main digital meters or bulk water meters. CampusPulse can ingest data via CSV upload, smart-meter API webhooks, or existing BMS loggers. |
