import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Droplets,
  Zap,
  Trash2,
  Flame,
  ShieldAlert,
  Play,
  RotateCcw,
  Check,
  Building2,
  FileSearch
} from "lucide-react";
import { fetchAnomalies, updateAnomalyStatus, injectAnomaly } from "../api/client";

export default function AnomaliesPage({ onAnomalyUpdated }) {
  const [anomalies, setAnomalies] = useState([]);
  const [filter, setFilter] = useState("all"); // "all" | "active" | "resolved" | "critical" | "water" | "electricity"
  const [loading, setLoading] = useState(true);
  const [injectingScenario, setInjectingScenario] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchAnomalies();
      setAnomalies(data);
    } catch (err) {
      console.error("Failed to load anomalies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateAnomalyStatus(id, newStatus, `Status updated to ${newStatus} by facilities admin.`);
      await loadData();
      if (onAnomalyUpdated) onAnomalyUpdated();
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleInjectLive = async (scenarioId) => {
    try {
      setInjectingScenario(scenarioId);
      await injectAnomaly({ scenario: scenarioId, duration_hours: 6 });
      await loadData();
      if (onAnomalyUpdated) onAnomalyUpdated();
    } catch (err) {
      alert("Failed to inject live demo anomaly: " + err.message);
    } finally {
      setInjectingScenario(null);
    }
  };

  // Filter anomalies
  const filteredList = anomalies.filter((a) => {
    if (filter === "active") return a.status !== "resolved";
    if (filter === "resolved") return a.status === "resolved";
    if (filter === "critical") return a.severity === "critical";
    if (filter === "water") return a.resource === "water";
    if (filter === "electricity") return a.resource === "electricity";
    if (filter === "waste") return a.resource === "waste";
    return true;
  });

  const resourceIcon = (res) => {
    if (res === "water") return Droplets;
    if (res === "electricity") return Zap;
    return Trash2;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Anomalies & Operational Alerts
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30">
              {anomalies.filter((a) => a.status !== "resolved").length} Active
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Automated Z-score & Isolation Forest detection of leaks, off-hour chiller loads, and power surges.
          </p>
        </div>

        {/* Live Stage Demo Injection Pill Panel */}
        <div className="bg-gray-900 border border-gray-800 p-2 rounded-2xl flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2">
            Stage Demo Controls:
          </span>
          <button
            onClick={() => handleInjectLive("hostel_water_leak")}
            disabled={injectingScenario !== null}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition flex items-center space-x-1"
          >
            <Droplets className="h-3 w-3" />
            <span>+ Simulate Leak in Hostel</span>
          </button>
          <button
            onClick={() => handleInjectLive("library_overnight_ac")}
            disabled={injectingScenario !== null}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition flex items-center space-x-1"
          >
            <Zap className="h-3 w-3" />
            <span>+ Simulate AC in Library</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: "all", label: "All Incidents" },
          { id: "active", label: "Active Only" },
          { id: "critical", label: "Critical Severity" },
          { id: "water", label: "Water Leaks" },
          { id: "electricity", label: "Power & HVAC" },
          { id: "waste", label: "Waste Overflows" },
          { id: "resolved", label: "Resolved" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              filter === tab.id
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "bg-gray-900/60 text-gray-400 hover:text-white border border-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Incident Cards Feed */}
      <div className="space-y-4">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center bg-gray-900/40 rounded-2xl border border-gray-800">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">All Facilities Operating Normally</h3>
            <p className="text-xs text-gray-400 mt-1">
              No anomalies matching the current filter. Use the Demo Controls above to simulate live incidents.
            </p>
          </div>
        ) : (
          filteredList.map((item) => {
            const Icon = resourceIcon(item.resource);
            const isResolved = item.status === "resolved";
            const isCritical = item.severity === "critical";

            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all duration-200 ${
                  isResolved
                    ? "bg-gray-900/30 border-gray-800/60 opacity-75"
                    : isCritical
                    ? "bg-gray-900/80 border-red-500/40 shadow-lg shadow-red-950/20"
                    : "bg-gray-900/80 border-amber-500/30 shadow-md"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left: Info */}
                  <div className="flex items-start space-x-3.5">
                    <div
                      className={`p-2.5 rounded-xl border shrink-0 ${
                        isCritical
                          ? "bg-red-500/10 border-red-500/30 text-red-400"
                          : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-bold text-white text-sm sm:text-base">
                          {item.building_id.replace("-", " ").toUpperCase()}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${
                            isCritical
                              ? "bg-red-500/20 text-red-400 border border-red-500/40"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                          }`}
                        >
                          {item.severity}
                        </span>
                        <span className="text-[11px] text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(item.timestamp).toLocaleString("en-IN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <p className="text-xs text-gray-300 font-medium leading-relaxed max-w-3xl">
                        {item.probable_cause}
                      </p>

                      {item.notes && (
                        <div className="text-[11px] text-gray-400 bg-gray-950/50 px-3 py-1.5 rounded-lg border border-gray-800/80 mt-2">
                          <span className="text-gray-500 font-semibold mr-1">Log:</span>
                          {item.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Quantified Loss & Actions */}
                  <div className="flex flex-row md:flex-col md:items-end justify-between items-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-800">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">
                        Estimated Loss
                      </span>
                      <div className="flex items-baseline md:justify-end space-x-1.5">
                        <span className="text-base font-extrabold text-red-400">
                          ₹{Number(item.estimated_excess_inr).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({Number(item.estimated_excess_co2e).toLocaleString("en-IN", { maximumFractionDigits: 1 })} kg CO₂e)
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 block">
                        +{Number(item.estimated_excess_units).toLocaleString("en-IN", { maximumFractionDigits: 0 })}{" "}
                        {item.resource === "electricity" ? "kWh" : item.resource === "water" ? "Litres" : "kg"}
                      </span>
                    </div>

                    {/* Status Toggle Buttons */}
                    <div className="flex items-center space-x-2">
                      {item.status === "detected" && (
                        <button
                          onClick={() => handleStatusChange(item.id, "acknowledged")}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 transition border border-gray-700"
                        >
                          Acknowledge
                        </button>
                      )}

                      {!isResolved ? (
                        <button
                          onClick={() => handleStatusChange(item.id, "resolved")}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center space-x-1 shadow-md shadow-emerald-500/10"
                        >
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                          <span>Resolve</span>
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-400 flex items-center bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Resolved
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
