import React from "react";

export default function MetricCard({
  title,
  value,
  unit,
  costInr,
  co2eKg,
  icon: Icon,
  accentColor = "emerald", // "emerald" | "cyan" | "amber" | "violet"
  trendText,
  subLabel
}) {
  const colorMap = {
    emerald: {
      border: "hover:border-emerald-500/40",
      iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      accentText: "text-emerald-400",
      badgeBg: "bg-emerald-500/10 text-emerald-400",
    },
    cyan: {
      border: "hover:border-cyan-500/40",
      iconBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      accentText: "text-cyan-400",
      badgeBg: "bg-cyan-500/10 text-cyan-400",
    },
    amber: {
      border: "hover:border-amber-500/40",
      iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      accentText: "text-amber-400",
      badgeBg: "bg-amber-500/10 text-amber-400",
    },
    violet: {
      border: "hover:border-purple-500/40",
      iconBg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      accentText: "text-purple-400",
      badgeBg: "bg-purple-500/10 text-purple-400",
    },
  };

  const scheme = colorMap[accentColor] || colorMap.emerald;

  return (
    <div className={`p-5 rounded-2xl bg-gray-900/70 border border-gray-800 transition-all duration-200 shadow-lg ${scheme.border}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-400 tracking-wide uppercase">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-xl border ${scheme.iconBg}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-2 mb-3">
        <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">{value}</span>
        {unit && <span className="text-xs font-semibold text-gray-400">{unit}</span>}
      </div>

      {/* Dual Impact translation: Cost & Carbon */}
      {(costInr !== undefined || co2eKg !== undefined) && (
        <div className="pt-3 border-t border-gray-800/80 grid grid-cols-2 gap-2 text-xs">
          {costInr !== undefined && (
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Fiscal Cost</span>
              <span className="font-semibold text-gray-200">
                ₹{Number(costInr).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
            </div>
          )}
          {co2eKg !== undefined && (
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Carbon Footprint</span>
              <span className="font-semibold text-gray-200">
                {Number(co2eKg).toLocaleString("en-IN", { maximumFractionDigits: 0 })} <span className="text-[10px] text-gray-400">kg CO₂e</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Sublabel / Trend */}
      {(trendText || subLabel) && (
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-400">
          <span>{subLabel}</span>
          {trendText && (
            <span className={`px-2 py-0.5 rounded-full font-medium ${scheme.badgeBg}`}>
              {trendText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
