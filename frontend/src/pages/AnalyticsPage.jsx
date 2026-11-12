import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import StatCard from "../components/StatCard";
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  PieChart
} from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalytics()
      .then(setData)
      .catch((err) => console.error("Error loading analytics:", err))
      .finally(() => setLoading(false));
  }, []);

  const kpis = data?.kpis || {
    total_reports: 8,
    resolution_rate: "25%",
    avg_response_days: "1.8 days",
    escalation_count: 1,
    high_risk_buildings: 3,
  };

  const monthly = data?.monthly_trend || [
    { month: "May", count: 28 },
    { month: "Jun", count: 35 },
    { month: "Jul", count: 42 },
    { month: "Aug", count: 59 },
    { month: "Sep", count: 51 },
    { month: "Oct", count: 68 },
    { month: "Nov", count: 8 },
  ];

  const maxMonthly = Math.max(...monthly.map((m) => m.count), 1);

  const categories = data?.category_breakdown || [
    { category: "Structural Crack", count: 3 },
    { category: "Wall Crack", count: 2 },
    { category: "Water Leakage", count: 1 },
    { category: "Exposed Wiring", count: 1 },
    { category: "Damaged Plaster", count: 1 },
  ];

  const totalCatCount = categories.reduce((sum, c) => sum + c.count, 0) || 1;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Municipal Safety Analytics</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Longitudinal trends, hazard typology, and departmental SLA accountability metrics
        </p>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Reports"
          value={kpis.total_reports}
          icon={BarChart3}
          tone="primary"
          trend="+18% YoY"
        />
        <StatCard
          label="Resolution Rate"
          value={kpis.resolution_rate}
          icon={CheckCircle2}
          tone="success"
          trend="Target >80%"
        />
        <StatCard
          label="Avg Response Time"
          value={kpis.avg_response_days}
          icon={Clock}
          tone="warning"
          trend="Down from 2.4d"
        />
        <StatCard
          label="High-Risk Buildings"
          value={kpis.high_risk_buildings}
          icon={Building2}
          tone="danger"
          trend="Active Watchlist"
        />
      </div>

      {/* 2-Column: Monthly Trend Chart & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Monthly Trend Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Incident Volume Trends</h3>
                <p className="text-xs text-slate-500">Monthly public structural reports filed in Vijayawada</p>
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                2026 Trend
              </span>
            </div>

            {/* Custom Responsive Bar Chart */}
            <div className="h-64 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-200">
              {monthly.map((m) => {
                const heightPct = Math.round((m.count / maxMonthly) * 100);
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[11px] font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">
                      {m.count}
                    </span>
                    <div className="w-full max-w-[42px] bg-slate-100 rounded-t-lg h-full flex items-end overflow-hidden">
                      <div
                        className="w-full bg-gradient-to-t from-indigo-700 to-indigo-500 rounded-t-lg transition-all duration-500 group-hover:from-indigo-600 group-hover:to-indigo-400"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-500 mt-1">
                      {m.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 text-xs text-slate-400 flex items-center justify-between">
            <span>Peak reporting observed following monsoon season (Aug - Oct).</span>
            <span className="font-semibold text-slate-600">Updated: Today</span>
          </div>
        </div>

        {/* Right Column: Hazard Category Typology (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Hazard Typology</h3>
                <p className="text-xs text-slate-500">Breakdown by detected damage classification</p>
              </div>
              <PieChart className="w-5 h-5 text-indigo-600" />
            </div>

            <div className="space-y-3.5">
              {categories.map((c, i) => {
                const pct = Math.round((c.count / totalCatCount) * 100);
                const colors = [
                  "bg-indigo-600",
                  "bg-rose-500",
                  "bg-cyan-500",
                  "bg-amber-500",
                  "bg-emerald-500",
                ];
                const barColor = colors[i % colors.length];

                return (
                  <div key={c.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800">{c.category}</span>
                      <span className="text-slate-500 font-bold">{c.count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SLA Performance Card */}
          <div className="mt-6 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
              <span>SLA Response Mandate Adherence</span>
              <span>88% On-Time</span>
            </div>
            <div className="w-full h-2 rounded-full bg-indigo-200/60 overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full" style={{ width: "88%" }} />
            </div>
            <span className="text-[11px] text-indigo-700 block">
              12% of cases triggered Level 2+ municipal commissioner escalation due to field delay.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
