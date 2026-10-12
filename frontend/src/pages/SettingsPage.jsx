import React, { useState, useEffect } from "react";
import { Settings, Save, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { fetchSettings, updateSettings } from "../api/client";

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [factors, setFactors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchSettings();
        setSettings(data);
        setFactors(data.factors || {});
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    }
    load();
  }, []);

  const handleChange = (key, val) => {
    setFactors((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateSettings({
        factors: {
          electricity_tariff_inr_per_kwh: Number(factors.electricity_tariff_inr_per_kwh),
          electricity_emission_kg_co2e_per_kwh: Number(factors.electricity_emission_kg_co2e_per_kwh),
          water_tariff_inr_per_litre: Number(factors.water_tariff_inr_per_litre),
          water_emission_kg_co2e_per_litre: Number(factors.water_emission_kg_co2e_per_litre),
          waste_disposal_inr_per_kg: Number(factors.waste_disposal_inr_per_kg),
          waste_landfill_emission_kg_co2e_per_kg: Number(factors.waste_landfill_emission_kg_co2e_per_kg),
          waste_recycled_offset_kg_co2e_per_kg: Number(factors.waste_recycled_offset_kg_co2e_per_kg),
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert("Failed to save settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return null;

  return (
    <div className="space-y-8 animate-fade-in pb-12 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Tariffs & Emission Factors Configuration
          </h1>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          Customize campus utility rates and carbon conversion factors. Real values persist across all calculations.
        </p>
      </div>

      {/* Mandatory Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-3 text-xs">
        <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-300">
            Audit Requirement Notice (placeholder - verify source)
          </span>
          <p className="text-gray-300 mt-0.5 leading-relaxed">
            Real-world figures for tariffs, water supply rates, and CEA/IPCC emission coefficients are pre-seeded with representative national baselines. Please adjust and confirm with your institution's utility bills.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>Settings successfully updated and applied across all engines!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Electricity Section */}
        <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <h3 className="text-base font-bold text-white">Electricity Parameters</h3>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              placeholder - verify source
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Commercial Electricity Tariff (₹ / kWh)
              </label>
              <input
                type="number"
                step="0.01"
                value={factors.electricity_tariff_inr_per_kwh || ""}
                onChange={(e) => handleChange("electricity_tariff_inr_per_kwh", e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-gray-500 block mt-1">Default: ₹8.50 / kWh (HT Institutional)</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Grid Emission Factor (kg CO₂e / kWh)
              </label>
              <input
                type="number"
                step="0.001"
                value={factors.electricity_emission_kg_co2e_per_kwh || ""}
                onChange={(e) => handleChange("electricity_emission_kg_co2e_per_kwh", e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-gray-500 block mt-1">Default: 0.716 kg CO₂e / kWh (CEA India Database)</span>
            </div>
          </div>
        </div>

        {/* Water Section */}
        <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <h3 className="text-base font-bold text-white">Water Parameters</h3>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              placeholder - verify source
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Bulk Water Tariff (₹ / Litre)
              </label>
              <input
                type="number"
                step="0.001"
                value={factors.water_tariff_inr_per_litre || ""}
                onChange={(e) => handleChange("water_tariff_inr_per_litre", e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-gray-500 block mt-1">Default: ₹0.045 / L (₹45 / kilo-litre)</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Pumping & Treatment Footprint (kg CO₂e / Litre)
              </label>
              <input
                type="number"
                step="0.00001"
                value={factors.water_emission_kg_co2e_per_litre || ""}
                onChange={(e) => handleChange("water_emission_kg_co2e_per_litre", e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-gray-500 block mt-1">Default: 0.00035 kg CO₂e / L</span>
            </div>
          </div>
        </div>

        {/* Waste Section */}
        <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <h3 className="text-base font-bold text-white">Solid Waste & Recycling Parameters</h3>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              placeholder - verify source
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Disposal Haulage Cost (₹ / kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={factors.waste_disposal_inr_per_kg || ""}
                onChange={(e) => handleChange("waste_disposal_inr_per_kg", e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-gray-500 block mt-1">Default: ₹3.20 / kg</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Landfill Factor (kg CO₂e / kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={factors.waste_landfill_emission_kg_co2e_per_kg || ""}
                onChange={(e) => handleChange("waste_landfill_emission_kg_co2e_per_kg", e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-gray-500 block mt-1">Default: 1.250 kg CO₂e / kg</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Recycling Offset (kg CO₂e / kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={factors.waste_recycled_offset_kg_co2e_per_kg || ""}
                onChange={(e) => handleChange("waste_recycled_offset_kg_co2e_per_kg", e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-gray-500 block mt-1">Default: -0.850 kg CO₂e / kg</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Updating Factors..." : "Save & Recalculate Metrics"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
