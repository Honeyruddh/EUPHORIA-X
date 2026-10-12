import React, { useState, useEffect } from "react";
import { Building2, Users, Maximize2, Zap, Droplets, Trash2, TrendingUp, AlertCircle } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { fetchBuildings, fetchReadings } from "../api/client";

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState("nilgiri-hostel");
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const bldgs = await fetchBuildings();
        setBuildings(bldgs);
        if (bldgs.length > 0 && !selectedBuildingId) {
          setSelectedBuildingId(bldgs[0].id);
        }
      } catch (err) {
        console.error("Failed to load buildings:", err);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!selectedBuildingId) return;
    async function loadBuildingReadings() {
      try {
        setLoading(true);
        const data = await fetchReadings({
          building_id: selectedBuildingId,
          limit: 168 // trailing 7 days
        });
        setReadings(data);
      } catch (err) {
        console.error("Failed to load readings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBuildingReadings();
  }, [selectedBuildingId]);

  const activeBuilding = buildings.find((b) => b.id === selectedBuildingId) || buildings[0];

  // Compute 24-hour average profile vs baseline for this building
  const hourlyProfileData = React.useMemo(() => {
    if (!readings || readings.length === 0 || !activeBuilding) return [];
    const hourly = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, "0")}:00`,
      actual_kwh: 0,
      actual_water: 0,
      count: 0,
      baseline_kwh: Math.round(activeBuilding.base_kwh_per_day / 24),
    }));

    readings.forEach((r) => {
      const h = new Date(r.timestamp).getHours();
      hourly[h].actual_kwh += r.electricity_kwh;
      hourly[h].actual_water += r.water_litres;
      hourly[h].count += 1;
    });

    return hourly.map((item) => ({
      ...item,
      actual_kwh: item.count > 0 ? Math.round(item.actual_kwh / item.count) : 0,
      actual_water: item.count > 0 ? Math.round(item.actual_water / item.count) : 0,
    }));
  }, [readings, activeBuilding]);

  // Aggregate totals for the building
  const totals = React.useMemo(() => {
    if (!readings || readings.length === 0) return { kwh: 0, water: 0, waste: 0, cost: 0, co2e: 0 };
    return readings.reduce(
      (acc, r) => ({
        kwh: acc.kwh + r.electricity_kwh,
        water: acc.water + r.water_litres,
        waste: acc.waste + r.waste_kg,
        cost: acc.cost + r.cost_inr,
        co2e: acc.co2e + r.co2e_kg,
      }),
      { kwh: 0, water: 0, waste: 0, cost: 0, co2e: 0 }
    );
  }, [readings]);

  // Intensity metrics
  const kwhPerSqm = activeBuilding ? (totals.kwh / (activeBuilding.area_sqm || 1)).toFixed(1) : "0";
  const waterPerCapita = activeBuilding ? Math.round(totals.water / (activeBuilding.occupancy || 1)) : "0";

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Facility Diagnostics</h1>
          <p className="text-sm text-gray-400 mt-1">
            Deep-dive operational baselines, circadian load profiles, and resource intensity.
          </p>
        </div>

        {/* Building Selector */}
        <div className="flex items-center space-x-2">
          <select
            value={selectedBuildingId}
            onChange={(e) => setSelectedBuildingId(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:border-emerald-500"
          >
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.building_type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Building Header Card */}
      {activeBuilding && (
        <div className="p-6 rounded-2xl bg-gray-900/70 border border-gray-800 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                <Building2 className="h-4 w-4" />
                <span>{activeBuilding.building_type}</span>
              </div>
              <h2 className="text-2xl font-black text-white">{activeBuilding.name}</h2>
              <p className="text-xs text-gray-400 mt-1">
                Monitored 24/7 with sub-hourly baseline envelope analysis
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-gray-800 border border-gray-700 text-gray-300">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] text-gray-400 uppercase tracking-wider block">Occupancy</span>
                <span className="text-lg font-bold text-white">{activeBuilding.occupancy}</span>
                <span className="text-xs text-gray-400 ml-1">people</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-gray-800 border border-gray-700 text-gray-300">
                <Maximize2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] text-gray-400 uppercase tracking-wider block">Floor Area</span>
                <span className="text-lg font-bold text-white">{activeBuilding.area_sqm.toLocaleString()}</span>
                <span className="text-xs text-gray-400 ml-1">m²</span>
              </div>
            </div>
          </div>

          {/* Intensity Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-800">
            <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-800">
              <span className="text-[10px] text-gray-400 uppercase font-semibold block">Electricity Intensity</span>
              <span className="text-base font-bold text-emerald-400">{kwhPerSqm}</span>
              <span className="text-[11px] text-gray-400 ml-1">kWh / m²</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-800">
              <span className="text-[10px] text-gray-400 uppercase font-semibold block">Water Intensity</span>
              <span className="text-base font-bold text-cyan-400">{waterPerCapita}</span>
              <span className="text-[11px] text-gray-400 ml-1">L / occupant</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-800">
              <span className="text-[10px] text-gray-400 uppercase font-semibold block">Period Fiscal Spend</span>
              <span className="text-base font-bold text-white">₹{Math.round(totals.cost).toLocaleString("en-IN")}</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-800">
              <span className="text-[10px] text-gray-400 uppercase font-semibold block">Carbon Emitted</span>
              <span className="text-base font-bold text-purple-400">{Math.round(totals.co2e).toLocaleString("en-IN")}</span>
              <span className="text-[11px] text-gray-400 ml-1">kg CO₂e</span>
            </div>
          </div>
        </div>
      )}

      {/* Hourly Baseline vs Actual Curve */}
      <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-white">24-Hour Diurnal Load Profile vs Baseline</h3>
            <p className="text-xs text-gray-400">
              Hourly average demand compared to expected normal operating baseline
            </p>
          </div>
          <div className="flex items-center space-x-4 text-xs font-semibold">
            <span className="flex items-center text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mr-1.5" /> Actual Load (kWh)
            </span>
            <span className="flex items-center text-gray-400">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-400 mr-1.5" /> Expected Baseline
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourlyProfileData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="hour" stroke="#6b7280" fontSize={11} tickLine={false} />
              <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", borderRadius: "12px" }}
              />
              <Line
                type="monotone"
                dataKey="actual_kwh"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 3, fill: "#10b981" }}
                name="Actual Load (kWh)"
              />
              <Line
                type="stepAfter"
                dataKey="baseline_kwh"
                stroke="#6b7280"
                strokeDasharray="4 4"
                strokeWidth={2}
                dot={false}
                name="Baseline Target (kWh)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
