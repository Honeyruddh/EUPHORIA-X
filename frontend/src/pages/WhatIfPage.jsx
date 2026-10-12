import React, { useState, useEffect } from "react";
import { Sliders, Trees, Car, Home, IndianRupee, Sparkles, RefreshCw, Check } from "lucide-react";
import { runWhatIfSimulation } from "../api/client";

export default function WhatIfPage() {
  const [elecPct, setElecPct] = useState(10);
  const [nightCutPct, setNightCutPct] = useState(25);
  const [fixLeaks, setFixLeaks] = useState(true);
  const [waterEffPct, setWaterEffPct] = useState(15);
  const [recyclingPct, setRecyclingPct] = useState(30);

  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const executeSimulation = async () => {
    try {
      setLoading(true);
      const res = await runWhatIfSimulation({
        electricity_reduction_pct: elecPct,
        night_load_cut_pct: nightCutPct,
        fix_active_leaks: fixLeaks,
        water_efficiency_pct: waterEffPct,
        recycling_diversion_pct: recyclingPct,
      });
      setSimResult(res);
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Run simulation automatically when sliders change
    const timeout = setTimeout(() => {
      executeSimulation();
    }, 150);
    return () => clearTimeout(timeout);
  }, [elecPct, nightCutPct, fixLeaks, waterEffPct, recyclingPct]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          What-If Decarbonization Simulator
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Simulate operational policies and capital retrofits to forecast immediate financial ROI and carbon abatement.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Interactive Controls */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-gray-900/70 border border-gray-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-800">
            <h3 className="text-base font-bold text-white flex items-center">
              <Sliders className="h-4 w-4 mr-2 text-emerald-400" />
              Policy Levers & Sliders
            </h3>
            <span className="text-xs text-gray-400">Live Dynamic Compute</span>
          </div>

          {/* Slider 1: Night Baseload Cut */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-gray-300">Automate Off-Hours Night Setback</span>
              <span className="text-emerald-400 font-bold">{nightCutPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="5"
              value={nightCutPct}
              onChange={(e) => setNightCutPct(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-gray-800 h-2 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-gray-500">
              Curtails unneeded chillers, ventilation, and corridor lighting between 22:00 and 06:00.
            </p>
          </div>

          {/* Slider 2: Electricity General Reduction */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-gray-300">Campus Energy Efficiency Levers</span>
              <span className="text-emerald-400 font-bold">{elecPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="5"
              value={elecPct}
              onChange={(e) => setElecPct(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-gray-800 h-2 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-gray-500">
              LED retrofits, VFD motors, and AC thermostat setpoint calibration to 24°C.
            </p>
          </div>

          {/* Checkbox: Fix Active Leaks */}
          <div className="p-3.5 rounded-xl bg-gray-800/40 border border-gray-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-white block">Aero-Seal Plumbing Pipe Leaks</span>
              <span className="text-[11px] text-gray-400">Fixes active detected pipe breaches immediately</span>
            </div>
            <button
              onClick={() => setFixLeaks(!fixLeaks)}
              className={`w-6 h-6 rounded-lg flex items-center justify-center border transition ${
                fixLeaks ? "bg-cyan-500 border-cyan-400 text-slate-950" : "bg-gray-800 border-gray-700 text-transparent"
              }`}
            >
              <Check className="h-4 w-4 stroke-[3]" />
            </button>
          </div>

          {/* Slider 3: Water Aerators */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-gray-300">Low-Flow Fixtures & Water Aerators</span>
              <span className="text-cyan-400 font-bold">{waterEffPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="5"
              value={waterEffPct}
              onChange={(e) => setWaterEffPct(Number(e.target.value))}
              className="w-full accent-cyan-500 bg-gray-800 h-2 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-gray-500">
              Dual-flush retrofits in hostels and tap aerators in library & dining halls.
            </p>
          </div>

          {/* Slider 4: Recycling Diversion */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-gray-300">Expand Composting & Segregation</span>
              <span className="text-amber-400 font-bold">+{recyclingPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="5"
              value={recyclingPct}
              onChange={(e) => setRecyclingPct(Number(e.target.value))}
              className="w-full accent-amber-500 bg-gray-800 h-2 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-gray-500">
              Food waste biomethanation in canteen and paper baling in academic blocks.
            </p>
          </div>
        </div>

        {/* Right: Projected Impact Cards */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Hero Savings Card */}
          <div className="p-7 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-gray-900 to-gray-950 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center">
                <Sparkles className="h-4 w-4 mr-1.5" />
                Projected Impact Summary
              </span>
              <span className="text-xs text-gray-400">
                Current Monthly Bill: ₹{Number(simResult?.current_monthly_cost_inr || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6">
              <div>
                <span className="text-xs text-gray-400 block font-medium">Monthly Cost Reduction</span>
                <div className="flex items-baseline space-x-1.5 mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-400">
                    ₹{Number(simResult?.monthly_savings_inr || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-xs text-gray-400">/ month</span>
                </div>
                <span className="text-xs text-emerald-300 font-semibold block mt-1">
                  Annualized: ₹{Number(simResult?.yearly_savings_inr || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })} / year
                </span>
              </div>

              <div>
                <span className="text-xs text-gray-400 block font-medium">Carbon Abatement</span>
                <div className="flex items-baseline space-x-1.5 mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-cyan-400">
                    {Number(simResult?.monthly_co2e_saved_kg || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-xs text-gray-400">kg CO₂e / mo</span>
                </div>
                <span className="text-xs text-cyan-300 font-semibold block mt-1">
                  Annualized: {(Number(simResult?.yearly_co2e_saved_kg || 0) / 1000).toFixed(1)} Tonnes CO₂e / year
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
              <span>New Projected Monthly Operating Cost:</span>
              <span className="font-extrabold text-white text-sm">
                ₹{Number(simResult?.projected_monthly_cost_inr || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          {/* Relatable Impact Equivalents */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Relatable Environmental Equivalents (Cited EPA / IPCC)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800 flex flex-col justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 w-fit mb-3">
                  <Trees className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-2xl font-black text-white">
                    {Number(simResult?.equivalent_trees_monthly || 0).toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-gray-400 block mt-1">Urban Trees Planted</span>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Equivalent annual carbon sequestration (1.75 kg/tree/month)
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800 flex flex-col justify-between">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 w-fit mb-3">
                  <Car className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-2xl font-black text-white">
                    {Number(simResult?.equivalent_car_km_monthly || 0).toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-gray-400 block mt-1">Passenger Car Km Avoided</span>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Equivalent tailpipe emissions eliminated (0.12 kg CO₂e/km)
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800 flex flex-col justify-between">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 w-fit mb-3">
                  <Home className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-2xl font-black text-white">
                    {Number(simResult?.equivalent_homes_powered_days || 0).toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-gray-400 block mt-1">Homes Powered for a Month</span>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Saved energy equivalent to standard urban households (10 kWh/day)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
