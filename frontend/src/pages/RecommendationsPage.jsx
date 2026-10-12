import React, { useState, useEffect } from "react";
import { Lightbulb, CheckCircle2, TrendingUp, IndianRupee, CloudRain, Clock, ShieldCheck, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";
import { fetchRecommendations, applyRecommendation } from "../api/client";

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchRecommendations();
      setRecommendations(data);
    } catch (err) {
      console.error("Failed to load recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApply = async (id) => {
    try {
      await applyRecommendation(id);
      // Confetti celebration
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.7 }
      });
      await loadData();
    } catch (err) {
      alert("Failed to apply recommendation: " + err.message);
    }
  };

  const totalProjectedInr = recommendations
    .filter((r) => r.status === "active")
    .reduce((sum, r) => sum + r.projected_savings_inr_month, 0);

  const totalProjectedCo2 = recommendations
    .filter((r) => r.status === "active")
    .reduce((sum, r) => sum + r.projected_savings_co2e_month, 0);

  const appliedCount = recommendations.filter((r) => r.status === "applied").length;
  const appliedSavingsInr = recommendations
    .filter((r) => r.status === "applied")
    .reduce((sum, r) => sum + r.projected_savings_inr_month, 0);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Prescriptive Decarbonization Actions
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Data-backed efficiency interventions ranked by return on investment and carbon abatement potential.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
            <span className="text-gray-400 block font-medium">Potential Monthly Savings:</span>
            <span className="text-base font-extrabold text-emerald-400">
              ₹{totalProjectedInr.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </span>
            <span className="text-gray-400 ml-1">/ month</span>
          </div>
        </div>
      </div>

      {/* Applied Impact Tracker */}
      {appliedCount > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-emerald-950/20 to-transparent border border-emerald-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                {appliedCount} Interventions Successfully Implemented
              </h4>
              <p className="text-xs text-emerald-300 mt-0.5">
                Targeted recurring operational reduction locked in: ₹{appliedSavingsInr.toLocaleString("en-IN")}/month.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 shrink-0">
            Active Impact
          </span>
        </div>
      )}

      {/* Recommendations Cards */}
      <div className="space-y-4">
        {recommendations.map((rec) => {
          const isApplied = rec.status === "applied";
          return (
            <div
              key={rec.id}
              className={`p-6 rounded-2xl border transition-all ${
                isApplied
                  ? "bg-gray-900/30 border-gray-800/80 opacity-80"
                  : "bg-gray-900/70 border-gray-800 hover:border-emerald-500/30 shadow-lg"
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                {/* Left content */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {rec.category}
                    </span>
                    {rec.building_id && (
                      <span className="text-xs font-semibold text-gray-400">
                        {rec.building_id.replace("-", " ").toUpperCase()}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white">{rec.title}</h3>
                  <p className="text-xs text-gray-300 leading-relaxed max-w-3xl">{rec.description}</p>

                  {/* Explainability data badge */}
                  <div className="p-3 rounded-xl bg-gray-950/60 border border-gray-800 text-xs">
                    <span className="text-emerald-400 font-bold block mb-0.5">Why this was triggered:</span>
                    <span className="text-gray-400">{rec.trigger_data}</span>
                  </div>
                </div>

                {/* Right impact metrics & action */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-800">
                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 text-left lg:text-right w-full sm:w-auto">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-semibold block">Monthly Savings</span>
                      <span className="text-base font-extrabold text-emerald-400">
                        ₹{Number(rec.projected_savings_inr_month).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">
                        ({Number(rec.projected_savings_co2e_month).toLocaleString("en-IN", { maximumFractionDigits: 0 })} kg CO₂)
                      </span>
                    </div>

                    <div className="mt-1">
                      <span className="text-[10px] text-gray-500 uppercase font-semibold block">Capex & Payback</span>
                      <span className="text-xs font-bold text-gray-300">
                        ₹{Number(rec.investment_cost_inr).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-[11px] text-gray-500 ml-1">
                        ({rec.payback_months} mo payback)
                      </span>
                    </div>
                  </div>

                  {isApplied ? (
                    <span className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1.5 self-stretch lg:self-auto justify-center">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Implemented</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApply(rec.id)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center space-x-2 self-stretch lg:self-auto justify-center shadow-lg shadow-emerald-500/15"
                    >
                      <span>Mark Implemented</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
