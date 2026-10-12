import React, { useState } from "react";
import { Upload, Download, RefreshCw, CheckCircle2, FileText, Database, AlertCircle } from "lucide-react";
import { uploadReadingsCsv, triggerReSeed } from "../api/client";

export default function DataPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    try {
      setUploading(true);
      const res = await uploadReadingsCsv(file);
      setUploadResult(res);
      setFile(null);
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleReSeed = async () => {
    if (!window.confirm("Re-generate fresh 30 days of simulated campus readings? This will reset custom uploaded readings.")) return;
    try {
      setSeeding(true);
      const res = await triggerReSeed(30, true);
      setSeedResult(res);
    } catch (err) {
      alert("Re-seed failed: " + err.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Data Hub & Telemetry Ingestion
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Seamlessly transition from synthetic campus simulation to production IoT smart-meter CSV streams.
        </p>
      </div>

      {/* CSV Upload Section */}
      <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center">
              <Upload className="h-4 w-4 mr-2 text-emerald-400" />
              Upload Real Smart-Meter Readings (.CSV)
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Upload hourly power, water, and solid waste logs from campus BMS / IoT meters.
            </p>
          </div>

          <a
            href="http://localhost:8000/api/data/sample-template.csv"
            download
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 text-gray-200 hover:text-white border border-gray-700 hover:bg-gray-700 transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Template</span>
          </a>
        </div>

        {uploadResult && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2 font-semibold">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{uploadResult.message}</span>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="border-2 border-dashed border-gray-700 hover:border-emerald-500/50 rounded-2xl p-6 text-center cursor-pointer transition bg-gray-950/40">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files[0])}
              className="hidden"
              id="csvUploadInput"
            />
            <label htmlFor="csvUploadInput" className="cursor-pointer block">
              <Database className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <span className="text-xs font-bold text-white block">
                {file ? file.name : "Click to select a CSV file from your computer"}
              </span>
              <span className="text-[11px] text-gray-500 block mt-1">
                Required columns: building_id, timestamp, electricity_kwh, water_litres, waste_kg, waste_recycled_kg
              </span>
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!file || uploading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition disabled:opacity-40"
            >
              {uploading ? "Parsing & Ingesting..." : "Ingest Telemetry File"}
            </button>
          </div>
        </form>
      </div>

      {/* Re-seed Simulator Controls */}
      <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
        <div className="border-b border-gray-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center">
            <RefreshCw className="h-4 w-4 mr-2 text-cyan-400" />
            Deterministic Simulator Engine
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Reset or refresh the pre-calculated 30-day circadian time series across all 6 facilities.
          </p>
        </div>

        {seedResult && (
          <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs flex items-center space-x-2 font-semibold">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              Simulated {seedResult.readings_count} hourly records generated across {seedResult.buildings_count} facilities!
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">
            <span className="text-gray-300 font-semibold block">Generates realistic campus patterns:</span>
            <span>Diurnal solar curves, weekend drops, canteen meal surges, library exam-week spikes, and pre-seeded anomalies.</span>
          </div>

          <button
            onClick={handleReSeed}
            disabled={seeding}
            className="shrink-0 px-5 py-2.5 rounded-xl text-xs font-bold bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 transition flex items-center space-x-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${seeding ? "animate-spin text-cyan-400" : ""}`} />
            <span>{seeding ? "Synthesizing..." : "Reset to 30-Day Simulator"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
