import React, { useState } from "react";
import { X, Play, AlertOctagon, CheckCircle2, Droplets, Zap, Flame, Trash2 } from "lucide-react";
import { injectAnomaly } from "../api/client";

export default function QuickDemoModal({ isOpen, onClose, onInjected }) {
  const [loadingScenario, setLoadingScenario] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  if (!isOpen) return null;

  const scenarios = [
    {
      id: "hostel_water_leak",
      name: "Water Leak in Nilgiri Hostel",
      desc: "Simulates an underground valve rupture causing continuous 2,600 L/hr flow during off-peak night hours (02:00-05:00).",
      icon: Droplets,
      color: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
      lossPreview: "₹702/day & 5.5 kg CO₂e/day",
    },
    {
      id: "library_overnight_ac",
      name: "Overnight AC Left Running in Central Library",
      desc: "Simulates building chillers and reading hall lighting left energized past the 22:00 campus closing time.",
      icon: Zap,
      color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
      lossPreview: "₹3,825/night & 322 kg CO₂e/night",
    },
    {
      id: "labs_server_surge",
      name: "Server Power Spike in Ramanujan Labs",
      desc: "Simulates unthrottled research GPU cluster power surge and HVAC override (+140 kWh/hr).",
      icon: Flame,
      color: "border-red-500/30 bg-red-500/10 text-red-400",
      lossPreview: "₹7,140/day & 601 kg CO₂e/day",
    },
    {
      id: "canteen_waste_spike",
      name: "Bulk Waste Surge at Annapoorna Canteen",
      desc: "Simulates sudden +180 kg/hr food waste surge from unsegregated campus symposium leftovers.",
      icon: Trash2,
      color: "border-amber-500/30 bg-amber-500/10 text-amber-400",
      lossPreview: "₹3,456/event & 1,350 kg CO₂e/event",
    },
  ];

  const handleInject = async (scenarioId) => {
    try {
      setLoadingScenario(scenarioId);
      const res = await injectAnomaly({ scenario: scenarioId, duration_hours: 6 });
      setLastResult(res);
      if (onInjected) onInjected(res);
    } catch (err) {
      console.error("Injection failed:", err);
      alert("Failed to inject anomaly: " + err.message);
    } finally {
      setLoadingScenario(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#111827] border border-gray-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
            <AlertOctagon className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Live On-Stage Anomaly Injector</h2>
            <p className="text-xs text-gray-400">Trigger live operational disruptions to demonstrate real-time detection on stage.</p>
          </div>
        </div>

        {lastResult && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start space-x-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-emerald-300">Anomaly Injected Live!</span>
              <p className="text-gray-300 mt-1">{lastResult.probable_cause}</p>
              <div className="mt-2 flex space-x-4 text-[11px] font-semibold">
                <span className="text-emerald-400">Loss: ₹{Number(lastResult.loss_inr).toLocaleString("en-IN")}</span>
                <span className="text-cyan-400">Carbon: {Number(lastResult.loss_co2e).toLocaleString("en-IN")} kg CO₂e</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {scenarios.map((sc) => {
            const Icon = sc.icon;
            const isLoading = loadingScenario === sc.id;
            return (
              <div
                key={sc.id}
                className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 hover:border-gray-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg border shrink-0 ${sc.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{sc.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{sc.desc}</p>
                    <span className="inline-block mt-1 text-[11px] text-gray-500 font-medium">
                      Projected loss: <span className="text-gray-300">{sc.lossPreview}</span>
                    </span>
                  </div>
                </div>

                <button
                  disabled={isLoading}
                  onClick={() => handleInject(sc.id)}
                  className="sm:self-center shrink-0 flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition disabled:opacity-50 shadow-md shadow-emerald-500/10"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>{isLoading ? "Injecting..." : "Simulate Live"}</span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition"
          >
            Close & View Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
