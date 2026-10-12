import React from "react";
import {
  LayoutDashboard,
  Building2,
  AlertTriangle,
  Lightbulb,
  Sliders,
  Trophy,
  FileText,
  Settings,
  Database,
  Flame,
  Zap,
  Droplets,
  Trash2
} from "lucide-react";

export default function Navbar({ activeTab, setActiveTab, summary, onQuickInjectOpen }) {
  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "buildings", label: "Buildings", icon: Building2 },
    { id: "anomalies", label: "Anomalies & Alerts", icon: AlertTriangle, badge: summary?.active_anomalies_count },
    { id: "recommendations", label: "Recommendations", icon: Lightbulb },
    { id: "what-if", label: "What-If Simulator", icon: Sliders },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "reports", label: "Weekly Report", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "data", label: "Data Hub", icon: Database },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0b0f17]/90 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab("overview")}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
              <Flame className="h-6 w-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  Campus<span className="text-emerald-400">Pulse</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Live Admin
                </span>
              </div>
              <p className="text-[11px] text-gray-400 hidden sm:block">Unified Resource Intelligence & Decarbonization</p>
            </div>
          </div>

          {/* Center / Right status badges & demo trigger */}
          <div className="flex items-center space-x-3">
            {/* Quick Demo Trigger Button */}
            <button
              onClick={onQuickInjectOpen}
              className="relative inline-flex items-center space-x-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all shadow-sm group"
              title="Inject on-stage anomaly for live judge presentation"
            >
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping group-hover:scale-125" />
              <span>Simulate On-Stage Anomaly</span>
            </button>

            {/* Sustainability score badge */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gray-900/80 border border-gray-800">
              <span className="text-xs text-gray-400">Campus Score:</span>
              <span className="text-sm font-bold text-emerald-400">
                {summary ? `${summary.campus_sustainability_score}/100` : "--"}
              </span>
            </div>
          </div>
        </div>

        {/* Horizontal Navigation Menu */}
        <nav className="flex space-x-1 overflow-x-auto no-scrollbar py-2 border-t border-gray-800/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-emerald-400" : "text-gray-400"}`} />
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
