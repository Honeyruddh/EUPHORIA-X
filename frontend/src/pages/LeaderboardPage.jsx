import React, { useState, useEffect } from "react";
import { Trophy, Medal, TrendingUp, TrendingDown, Minus, Info, Sparkles, Building2, Eye } from "lucide-react";
import { fetchLeaderboard } from "../api/client";

export default function LeaderboardPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPublicMode, setIsPublicMode] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetchLeaderboard(7);
        setData(res);
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getMedalColor = (rank) => {
    if (rank === 1) return "text-amber-400 bg-amber-400/10 border-amber-400/30";
    if (rank === 2) return "text-slate-300 bg-slate-300/10 border-slate-300/30";
    if (rank === 3) return "text-amber-600 bg-amber-600/10 border-amber-600/30";
    return "text-gray-400 bg-gray-800 border-gray-700";
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Campus Sustainability Leaderboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              0–100 Normalized Scoring
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Facility rankings driven by power intensity, water conservation, waste diversion, and operational uptime.
          </p>
        </div>

        {/* Public Student View Toggle */}
        <button
          onClick={() => setIsPublicMode(!isPublicMode)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
            isPublicMode
              ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md"
              : "bg-gray-900 text-gray-300 border-gray-800 hover:text-white"
          }`}
        >
          <Eye className="h-4 w-4" />
          <span>{isPublicMode ? "Exit Public Kiosk View" : "Public Student Kiosk View"}</span>
        </button>
      </div>

      {/* Formula Transparency Banner */}
      {!isPublicMode && (
        <div className="p-4 rounded-2xl bg-gray-900/50 border border-gray-800 flex items-start space-x-3 text-xs text-gray-400">
          <Info className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-gray-200">Scoring Engine Formulation:</span>
            <p className="mt-0.5 leading-relaxed text-gray-400">
              Score = 100 - (0.35 × Elec Penalty + 0.25 × Water Penalty + 0.20 × Waste Penalty + 0.20 × Anomaly Penalty).
              Penalties are measured relative to each building's historical design baseline.
            </p>
          </div>
        </div>
      )}

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.slice(0, 3).map((item) => (
          <div
            key={item.building_id}
            className={`p-6 rounded-2xl border transition shadow-xl relative overflow-hidden ${
              item.rank === 1
                ? "bg-gradient-to-b from-amber-500/10 via-gray-900 to-gray-900 border-amber-500/40"
                : "bg-gray-900/70 border-gray-800"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className={`w-8 h-8 rounded-xl border flex items-center justify-center font-black text-sm ${getMedalColor(item.rank)}`}>
                #{item.rank}
              </span>
              <span className="text-xs font-bold text-gray-400">{item.building_type}</span>
            </div>

            <h3 className="text-xl font-black text-white">{item.building_name}</h3>

            <div className="my-5 flex items-baseline space-x-2">
              <span className="text-4xl font-black text-emerald-400">{item.score}</span>
              <span className="text-xs text-gray-400">/ 100</span>
              <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                Grade {item.grade}
              </span>
            </div>

            <div className="pt-4 border-t border-gray-800 grid grid-cols-2 gap-2 text-xs text-gray-400">
              <div>
                <span className="text-[10px] uppercase text-gray-500 block">Recycling Rate</span>
                <span className="font-semibold text-white">{item.recycling_rate_pct}%</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-gray-500 block">7-Day Trend</span>
                <span className={`font-semibold flex items-center ${
                  item.trend === "improving" ? "text-emerald-400" : item.trend === "declining" ? "text-red-400" : "text-gray-300"
                }`}>
                  {item.trend_arrow} {item.trend} ({item.trend_delta_pct}%)
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Complete Rankings Table */}
      <div className="rounded-2xl bg-gray-900/70 border border-gray-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center">
            <Trophy className="h-4 w-4 mr-2 text-amber-400" />
            Complete Facility Performance Table
          </h3>
          <span className="text-xs text-gray-400">Updated hourly from sensor telemetry</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-950/60 text-gray-400 uppercase text-[10px] font-semibold border-b border-gray-800">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Facility Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4 text-center">Grade</th>
                <th className="py-3 px-4">Power Intensity</th>
                <th className="py-3 px-4">Water Intensity</th>
                <th className="py-3 px-4">Diversion %</th>
                <th className="py-3 px-4 text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-gray-300 font-medium">
              {data.map((row) => (
                <tr key={row.building_id} className="hover:bg-gray-800/40 transition">
                  <td className="py-4 px-4 font-black">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs border ${getMedalColor(row.rank)}`}>
                      {row.rank}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-bold text-white">
                    {row.building_name}
                  </td>
                  <td className="py-4 px-4 text-gray-400">{row.building_type}</td>
                  <td className="py-4 px-4 text-center font-black text-emerald-400 text-sm">
                    {row.score}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-200 font-bold">
                      {row.grade}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-300">{row.kwh_per_sqm} kWh/m²</td>
                  <td className="py-4 px-4 text-gray-300">{row.water_l_per_capita} L/person</td>
                  <td className="py-4 px-4 text-emerald-400 font-semibold">{row.recycling_rate_pct}%</td>
                  <td className="py-4 px-4 text-right">
                    <span className={`inline-flex items-center font-bold ${
                      row.trend === "improving" ? "text-emerald-400" : row.trend === "declining" ? "text-red-400" : "text-gray-400"
                    }`}>
                      {row.trend_arrow} {row.trend_delta_pct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
