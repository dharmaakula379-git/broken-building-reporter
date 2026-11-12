import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import SeverityBadge from "../components/SeverityBadge";
import StatusBadge from "../components/StatusBadge";
import {
  Building2,
  ChevronLeft,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Clock,
  ArrowRight
} from "lucide-react";

export default function BuildingProfile() {
  const { id } = useParams();
  const [building, setBuilding] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBuilding(id)
      .then(setBuilding)
      .catch((err) => console.error("Error loading building profile:", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 mt-3 font-semibold">Loading building history...</p>
      </div>
    );
  }

  if (!building) {
    return (
      <div className="py-16 text-center space-y-3">
        <p className="text-sm text-slate-600">Building #{id} not found.</p>
        <Link to="/buildings" className="text-xs font-bold text-indigo-600 hover:underline">
          &larr; Back to building directory
        </Link>
      </div>
    );
  }

  const isHigh = building.risk === "High";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <Link to="/buildings" className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 mb-1">
          <ChevronLeft className="w-3.5 h-3.5" /> Back to building registry
        </Link>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
              isHigh ? "bg-red-50 text-red-600" : "bg-indigo-50 text-indigo-600"
            }`}>
              🏢
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                {building.building_code}
              </h2>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {building.address}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
              isHigh ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}>
              {building.risk} Risk Attention
            </span>
            <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              Trend: {building.trend}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Building Details & Metric Summary (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Structural Summary</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <span className="text-slate-500 font-medium">Total Lifetime Reports</span>
                <strong className="text-base font-extrabold text-slate-900">{building.total_reports}</strong>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 border border-rose-100 text-xs">
                <span className="text-rose-700 font-medium">High Severity Incidents</span>
                <strong className="text-base font-extrabold text-rose-800">{building.high_priority}</strong>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs">
                <span className="text-emerald-700 font-medium">Successfully Resolved</span>
                <strong className="text-base font-extrabold text-emerald-800">{building.resolved}</strong>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-xs">
                <span className="text-indigo-700 font-medium">GPS Coordinates</span>
                <span className="font-mono text-xs font-bold text-indigo-900">
                  {building.latitude}, {building.longitude}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
              Monitored by Vijayawada Municipal Corporation Building Safety Division under structural audit mandate.
            </div>
          </div>
        </div>

        {/* Right Column: Historical Incident Log Timeline (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Historical Damage &amp; Repair Log</h3>
              <p className="text-xs text-slate-500">Chronological history of visible cracks, hazards, and remedial actions</p>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
              {building.history?.length || 0} events
            </span>
          </div>

          {building.history?.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No recorded historical damage incidents for this building.</p>
          ) : (
            <div className="space-y-4">
              {building.history.map((h, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{h.damage_type}</span>
                      <SeverityBadge severity={h.severity} size="sm" />
                      <StatusBadge status={h.status} size="sm" />
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {h.note}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {h.date}
                      </span>
                      <span>&bull;</span>
                      <span>AI Model Score: {h.confidence}%</span>
                    </div>
                  </div>

                  <Link
                    to={`/reports/${h.id}`}
                    className="shrink-0 p-2 rounded-lg bg-white hover:bg-indigo-600 hover:text-white border border-slate-200 text-slate-600 transition-colors"
                    title="View Full Report"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
