import React from "react";

export default function StatCard({ label, value, icon: Icon, tone = "default", trend, subtitle }) {
  const tones = {
    danger: "text-rose-600 bg-rose-50 border-rose-100",
    warning: "text-amber-600 bg-amber-50 border-amber-100",
    success: "text-emerald-600 bg-emerald-50 border-emerald-100",
    primary: "text-indigo-600 bg-indigo-50 border-indigo-100",
    default: "text-slate-700 bg-slate-50 border-slate-100",
  };

  const iconTones = {
    danger: "bg-rose-100 text-rose-600",
    warning: "bg-amber-100 text-amber-600",
    success: "bg-emerald-100 text-emerald-600",
    primary: "bg-indigo-100 text-indigo-600",
    default: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className={`p-2 rounded-xl ${iconTones[tone] || iconTones.default}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</span>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tones[tone] || tones.default}`}>
            {trend}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}
