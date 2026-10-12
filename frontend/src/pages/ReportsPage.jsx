import React, { useState, useEffect } from "react";
import { Printer, Download, Sparkles, Building, Calendar, FileText, CheckCircle2 } from "lucide-react";
import { fetchReport } from "../api/client";

export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchReport(7);
        setReport(data);
      } catch (err) {
        console.error("Failed to load report:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Weekly Sustainability Report
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Executive operations brief with fiscal exposure, carbon footprint, and strategic remediation steps.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow-lg shadow-emerald-500/10"
          >
            <Printer className="h-4 w-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Sheet */}
      <div className="p-8 sm:p-12 rounded-3xl bg-[#111827] border border-gray-800 shadow-2xl max-w-4xl mx-auto space-y-8 text-slate-100 print:border-none print:shadow-none print:bg-white print:text-black print:p-0">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-gray-800 pb-6 print:border-black">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black tracking-tight text-white print:text-black">
                Campus<span className="text-emerald-400 print:text-emerald-700">Pulse</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 print:border print:border-black">
                Official Facilities Brief
              </span>
            </div>
            <h2 className="text-lg font-bold text-gray-200 print:text-black mt-2">
              Executive Weekly Resource & Decarbonization Audit
            </h2>
            <p className="text-xs text-gray-400 print:text-gray-600">
              Campus Facilities & Infrastructure Governance Board
            </p>
          </div>

          <div className="text-right text-xs text-gray-400 print:text-gray-700">
            <span className="block font-semibold">Reporting Window</span>
            <span className="block mt-0.5 text-gray-300 print:text-black font-medium">Trailing 7 Days</span>
            <span className="block text-[11px] text-gray-500">
              Generated: {new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
        </div>

        {/* Executive Summary Narrative */}
        <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800 print:border-gray-300 print:bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 print:text-emerald-800 flex items-center">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Strategic Narrative & Synthesis
            </h3>
            {report?.ai_generated ? (
              <span className="text-[10px] font-semibold text-purple-400">Claude AI Engine</span>
            ) : (
              <span className="text-[10px] font-semibold text-gray-400">Deterministic Analytics Engine</span>
            )}
          </div>
          <div className="text-xs text-gray-300 print:text-black leading-relaxed whitespace-pre-line font-medium">
            {report?.narrative}
          </div>
        </div>

        {/* 7-Day Performance Metrics Grid */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 print:text-black mb-3">
            Resource Consumption & Fiscal Balance
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800 print:border-gray-300">
              <span className="text-[10px] text-gray-500 uppercase block font-semibold">Electricity</span>
              <span className="text-base font-extrabold text-white print:text-black">
                {Number(report?.totals?.electricity_kwh || 0).toLocaleString("en-IN")}
              </span>
              <span className="text-[11px] text-gray-400 ml-1">kWh</span>
            </div>

            <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800 print:border-gray-300">
              <span className="text-[10px] text-gray-500 uppercase block font-semibold">Water Volume</span>
              <span className="text-base font-extrabold text-white print:text-black">
                {(Number(report?.totals?.water_litres || 0) / 1000).toLocaleString("en-IN", { maximumFractionDigits: 1 })}
              </span>
              <span className="text-[11px] text-gray-400 ml-1">kL</span>
            </div>

            <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800 print:border-gray-300">
              <span className="text-[10px] text-gray-500 uppercase block font-semibold">Haulage & Tariffs</span>
              <span className="text-base font-extrabold text-emerald-400 print:text-black">
                ₹{Number(report?.totals?.cost_inr || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800 print:border-gray-300">
              <span className="text-[10px] text-gray-500 uppercase block font-semibold">Carbon Incurred</span>
              <span className="text-base font-extrabold text-cyan-400 print:text-black">
                {(Number(report?.totals?.co2e_kg || 0) / 1000).toFixed(1)}
              </span>
              <span className="text-[11px] text-gray-400 ml-1">Tonnes CO₂e</span>
            </div>
          </div>
        </div>

        {/* Priority Actions */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 print:text-black mb-3">
            Top 3 High-Impact Remediation Actions
          </h4>
          <div className="space-y-2">
            {report?.top_recommendations?.map((item, idx) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-gray-900/40 border border-gray-800 print:border-gray-300 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-white print:text-black">{item.title}</span>
                    <span className="text-gray-400 print:text-gray-600 block text-[11px] capitalize">{item.category} efficiency action</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-emerald-400 print:text-black block">
                    Save ₹{Number(item.savings_inr).toLocaleString("en-IN", { maximumFractionDigits: 0 })}/mo
                  </span>
                  <span className="text-[10px] text-gray-500 print:text-gray-600">
                    -{Number(item.savings_co2e).toLocaleString("en-IN", { maximumFractionDigits: 0 })} kg CO₂/mo
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-gray-800 print:border-gray-300 flex justify-between items-center text-[11px] text-gray-500 print:text-gray-600">
          <span>CampusPulse Automated Operational Governance Engine</span>
          <span>Verified against CEA Grid Baseline & Municipal Standards</span>
        </div>
      </div>
    </div>
  );
}
