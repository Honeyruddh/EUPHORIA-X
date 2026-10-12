import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import QuickDemoModal from "./components/QuickDemoModal";
import OverviewPage from "./pages/OverviewPage";
import BuildingsPage from "./pages/BuildingsPage";
import AnomaliesPage from "./pages/AnomaliesPage";
import RecommendationsPage from "./pages/RecommendationsPage";
import WhatIfPage from "./pages/WhatIfPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import DataPage from "./pages/DataPage";
import { fetchCampusSummary } from "./api/client";

export default function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [summary, setSummary] = useState(null);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const refreshSummary = async () => {
    try {
      const data = await fetchCampusSummary(30);
      setSummary(data);
    } catch (err) {
      console.error("Failed to fetch campus summary:", err);
    }
  };

  useEffect(() => {
    refreshSummary();
  }, []);

  const handleInjected = () => {
    refreshSummary();
    setActiveTab("anomalies");
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        summary={summary}
        onQuickInjectOpen={() => setIsDemoModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {activeTab === "overview" && (
          <OverviewPage onNavigateToAnomalies={() => setActiveTab("anomalies")} />
        )}
        {activeTab === "buildings" && <BuildingsPage />}
        {activeTab === "anomalies" && (
          <AnomaliesPage onAnomalyUpdated={refreshSummary} />
        )}
        {activeTab === "recommendations" && <RecommendationsPage />}
        {activeTab === "what-if" && <WhatIfPage />}
        {activeTab === "leaderboard" && <LeaderboardPage />}
        {activeTab === "reports" && <ReportsPage />}
        {activeTab === "settings" && <SettingsPage />}
        {activeTab === "data" && <DataPage />}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/80 bg-gray-950/60 py-6 text-center text-xs text-gray-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CampusPulse — Operational Decarbonization Intelligence Platform</span>
          <span className="text-[11px] text-gray-500">
            FastAPI • SQLite • scikit-learn Isolation Forest • React + Vite
          </span>
        </div>
      </footer>

      {/* Quick Demo Anomaly Injection Modal */}
      <QuickDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onInjected={handleInjected}
      />
    </div>
  );
}
