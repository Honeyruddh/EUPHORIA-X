import React, { useState, useEffect } from "react";
import {
  Zap,
  Droplets,
  Trash2,
  IndianRupee,
  CloudRain,
  AlertTriangle,
  ArrowUpRight,
  TrendingDown,
  Calendar,
  Building,
  RefreshCw
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import MetricCard from "../components/MetricCard";
import { fetchCampusSummary, fetchReadings, fetchBuildings } from "../api/client";

export default function OverviewPage({ onNavigateToAnomalies }) {
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState(null);
  const [readings, setReadings] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sumData, readData, bldgData] = await Promise.all([
        fetchCampusSummary(days),
        fetchReadings({ limit: 720 }), // recent 30-day hourly sample
        fetchBuildings()
      ]);
      setSummary(sumData);
      setReadings(readData);
      setBuildings(bldgData);
    } catch (err) {
      console.error("Failed to load overview data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [days]);

  // Aggregate readings into daily data for timeline chart
  const timelineData = React.useMemo(() => {
    if (!readings || readings.length === 0) return [];
    const grouped = {};
    readings.forEach((r) => {
      const dateKey = r.timestamp.slice(0, 10);
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey.slice(5), // MM-DD
          electricity: 0,
          water: 0,
          waste: 0,
          cost: 0,
        };
      }
      grouped[dateKey].electricity += r.electricity_kwh;
      grouped[dateKey].water += r.water_litres / 1000; // in kL for readability
      grouped[dateKey].waste += r.waste_kg;
      grouped[dateKey].cost += r.cost_inr;
    });

    return Object.values(grouped).map((d) => ({
      ...d,
      electricity: Math.round(d.electricity),
      water: Math.round(d.water),
      waste: Math.round(d.waste),
      cost: Math.round(d.cost),
    }));
  }, [readings]);

  // Aggregate per-building stats for comparison chart
  const buildingComparisonData = React.useMemo(() => {
    if (!readings || readings.length === 0 || !buildings) return [];
    const bMap = {};
    buildings.forEach((b) => {
      bMap[b.id] = { name: b.name.split(" ")[0], kwh: 0, water_kl: 0, waste: 0, cost: 0 };
    });
    readings.forEach((r) => {
      if (bMap[r.building_id]) {
        bMap[r.building_id].kwh += r.electricity_kwh;
        bMap[r.building_id].water_kl += r.water_litres / 1000;
        bMap[r.building_id].waste += r.waste_kg;
        bMap[r.building_id].cost += r.cost_inr;
      }
    });
    return Object.values(bMap).map((item) => ({
      ...item,
      kwh: Math.round(item.kwh),
      water_kl: Math.round(item.water_kl),
      waste: Math.round(item.waste),
      cost: Math.round(item.cost),
    }));
  }, [readings, buildings]);

  const costBreakdownData = [
    { name: "Electricity", value: summary?.cost_breakdown?.electricity || 0, color: "#10b981" },
    { name: "Water", value: summary?.cost_breakdown?.water || 0, color: "#06b6d4" },
    { name: "Waste Haulage", value: summary?.cost_breakdown?.waste || 0, color: "#f59e0b" },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Header & Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Campus Operations Intelligence
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Real-time unified tracking across 6 campus facilities • Auto-audited for anomalies
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <div className="flex items-center bg-gray-900 border border-gray-800 rounded-xl p-1 text-xs">
            <Calendar className="h-3.5 w-3.5 text-gray-400 ml-2 mr-1" />
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  days === d
                    ? "bg-emerald-500 text-slate-950 font-bold shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {d} Days
              </button>
            ))}
          </div>

          <button
            onClick={loadData}
            title="Refresh metrics"
            className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Active Anomaly Banner if detected */}
      {summary?.active_anomalies_count > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-500/15 via-red-950/20 to-transparent border border-red-500/30 flex items-center justify-between gap-4 shadow-lg shadow-red-950/20">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 shrink-0 animate-pulse">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-200">
                {summary.active_anomalies_count} Active Operational Anomalies Detected
              </h4>
              <p className="text-xs text-red-300/80 mt-0.5">
                Continuous baseline deviations in water flow & off-hours electrical chillers are currently bleeding resources.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToAnomalies}
            className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-400 text-slate-950 transition flex items-center space-x-1.5 shadow-md shadow-red-500/10"
          >
            <span>Review & Resolve</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 5 Core Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Electricity"
          value={summary ? Number(summary.total_electricity_kwh).toLocaleString("en-IN") : "--"}
          unit="kWh"
          costInr={summary?.cost_breakdown?.electricity}
          co2eKg={summary?.co2e_breakdown?.electricity}
          icon={Zap}
          accentColor="emerald"
          trendText="Baseline ~9.2 MWh/day"
        />

        <MetricCard
          title="Total Water"
          value={summary ? (summary.total_water_litres / 1000).toLocaleString("en-IN", { maximumFractionDigits: 1 }) : "--"}
          unit="kL (Thousand L)"
          costInr={summary?.cost_breakdown?.water}
          co2eKg={summary?.co2e_breakdown?.water}
          icon={Droplets}
          accentColor="cyan"
          trendText="Municipal bulk rate"
        />

        <MetricCard
          title="Waste Generated"
          value={summary ? Number(summary.total_waste_kg).toLocaleString("en-IN") : "--"}
          unit="kg"
          costInr={summary?.cost_breakdown?.waste}
          co2eKg={summary?.co2e_breakdown?.waste}
          icon={Trash2}
          accentColor="amber"
          trendText={`${summary?.recycling_rate_pct || 0}% Diverted`}
          subLabel="Composted & Recycled"
        />

        <MetricCard
          title="Total Expenditure"
          value={summary ? `₹${(summary.total_cost_inr / 100000).toFixed(2)}` : "--"}
          unit="Lakhs INR"
          icon={IndianRupee}
          accentColor="emerald"
          trendText="Combined Utilities"
          subLabel={`₹${Number(summary?.total_cost_inr || 0).toLocaleString("en-IN")} total`}
        />

        <MetricCard
          title="Carbon Footprint"
          value={summary ? (summary.total_co2e_kg / 1000).toFixed(1) : "--"}
          unit="Tonnes CO₂e"
          icon={CloudRain}
          accentColor="violet"
          trendText="Scope 1 & Scope 2"
          subLabel={`${Number(summary?.total_co2e_kg || 0).toLocaleString("en-IN")} kg CO₂e`}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resource Consumption Timeline */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-gray-900/60 border border-gray-800 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Daily Campus Resource Timeline</h3>
              <p className="text-xs text-gray-400">Electricity (kWh) & Water (kL) multi-day trajectory</p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-semibold">
              <span className="flex items-center text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mr-1.5" /> Electricity (kWh)
              </span>
              <span className="flex items-center text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 mr-1.5" /> Water (kL)
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="elecGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", borderRadius: "12px" }}
                  itemStyle={{ fontSize: "12px" }}
                />
                <Area type="monotone" dataKey="electricity" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#elecGrad)" name="Electricity (kWh)" />
                <Area type="monotone" dataKey="water" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#waterGrad)" name="Water (kL)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Distribution Donut */}
        <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Fiscal Cost Distribution</h3>
            <p className="text-xs text-gray-400 mb-4">Operational spend split by resource</p>
            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {costBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", borderRadius: "12px" }}
                    formatter={(val) => `₹${Number(val).toLocaleString("en-IN")}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 border-t border-gray-800 pt-4">
            {costBreakdownData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center text-gray-300">
                  <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-semibold text-white">
                  ₹{Number(item.value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Building Comparison Bar Chart */}
      <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-white">Facility-by-Facility Electricity Footprint</h3>
            <p className="text-xs text-gray-400">Total consumption (kWh) across all 6 campus blocks</p>
          </div>
          <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
            6 Campus Facilities Synced
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buildingComparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
              <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", borderRadius: "12px" }}
                formatter={(val, name) => [
                  `${Number(val).toLocaleString("en-IN")} ${name === "kwh" ? "kWh" : ""}`,
                  name === "kwh" ? "Electricity" : name
                ]}
              />
              <Bar dataKey="kwh" fill="#10b981" radius={[6, 6, 0, 0]} name="Electricity (kWh)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
