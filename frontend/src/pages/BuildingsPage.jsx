import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle,
  FileText,
  ArrowRight
} from "lucide-react";

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBuildings()
      .then(setBuildings)
      .catch((err) => console.error("Error loading buildings:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Building Registry &amp; Risk Profiles</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Comprehensive inventory of monitored structural assets and historical damage patterns
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 mt-3 font-semibold">Loading building directory...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {buildings.map((b) => {
            const isHigh = b.risk === "High";
            const isMed = b.risk === "Medium";
            const trendIcon = b.trend === "Increasing" 
              ? TrendingUp 
              : b.trend === "Decreasing" 
              ? TrendingDown 
              : Minus;

            const TrendIcon = trendIcon;

            return (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isHigh ? "bg-red-50 text-red-600" : isMed ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                      }`}>
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 text-sm block leading-tight">
                          {b.building_code}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          ID: #{b.id}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                      isHigh
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : isMed
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}>
                      {b.risk} Risk
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium line-clamp-2 mb-3">
                    {b.address}
                  </p>

                  {/* 3 Metric Pills */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-3 border-t border-slate-100">
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block font-medium">Total</span>
                      <strong className="text-slate-800 text-sm">{b.total_reports}</strong>
                    </div>
                    <div className="bg-rose-50 p-2 rounded-lg">
                      <span className="text-[10px] text-rose-600 block font-medium">High Risk</span>
                      <strong className="text-rose-700 text-sm">{b.high_priority}</strong>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded-lg">
                      <span className="text-[10px] text-emerald-600 block font-medium">Resolved</span>
                      <strong className="text-emerald-700 text-sm">{b.resolved}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <TrendIcon className={`w-3.5 h-3.5 ${
                      b.trend === "Increasing" ? "text-red-500" : b.trend === "Decreasing" ? "text-emerald-500" : "text-slate-400"
                    }`} />
                    <span>Trend: <strong>{b.trend}</strong></span>
                  </div>

                  <Link
                    to={`/buildings/${b.id}`}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    View History &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
