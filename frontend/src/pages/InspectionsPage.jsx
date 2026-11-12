import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import SeverityBadge from "../components/SeverityBadge";
import StatusBadge from "../components/StatusBadge";
import {
  Eye,
  Calendar,
  AlertTriangle,
  UserCheck,
  CheckCircle,
  Clock,
  ArrowRight
} from "lucide-react";

export default function InspectionsPage() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getInspections()
      .then(setInspections)
      .catch((err) => console.error("Error loading inspections:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Field Inspection Queue</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Certified engineering reviews for low-confidence AI cases, high-risk foundation cracks, and structural safety sign-offs
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 mt-3 font-semibold">Loading inspection roster...</p>
        </div>
      ) : inspections.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-slate-700 text-sm">No Pending Inspections</h3>
          <p className="text-xs">All active cases have completed on-site engineering assessments.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {inspections.map((r) => {
            const isLowConf = r.status === "Inspection Required";
            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-indigo-700 text-sm">{r.code}</span>
                    <div className="flex items-center gap-1.5">
                      <SeverityBadge severity={r.severity} size="sm" />
                      <StatusBadge status={r.status} size="sm" />
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm">{r.damage_type}</h4>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{r.address}</p>

                  {isLowConf ? (
                    <div className="mt-3 p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs">
                      <strong>AI Low-Confidence Bypass:</strong> Model confidence ({r.confidence}%) requires physical crack-gauge measurement by a certified structural inspector.
                    </div>
                  ) : (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Assigned Inspector:</span>
                        <strong className="text-slate-800">{r.assigned_inspector || "Pending Assignment"}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Department:</span>
                        <span className="font-semibold text-slate-700">{r.assigned_dept || "Building Safety"}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> SLA: {r.hours_left}h remaining
                  </span>

                  <Link
                    to={`/reports/${r.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 text-xs font-bold transition-colors"
                  >
                    Conduct Inspection &rarr;
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
