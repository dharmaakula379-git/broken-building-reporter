import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import SeverityBadge from "../components/SeverityBadge";
import {
  AlertOctagon,
  ArrowRight,
  ShieldAlert,
  Clock,
  Building,
  CheckCircle2,
  ChevronRight
} from "lucide-react";

export default function EscalationsPage() {
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEscalations()
      .then(setEscalations)
      .catch((err) => console.error("Error loading escalations:", err))
      .finally(() => setLoading(false));
  }, []);

  const ladder = [
    { level: 1, title: "Ward Engineer", sla: "24h SLA window", desc: "Local zonal field assessment" },
    { level: 2, title: "Department Head", sla: "48h SLA window", desc: "Chief engineering review & contractor dispatch" },
    { level: 3, title: "Municipal Commissioner", sla: "72h SLA window", desc: "Executive intervention & emergency sanction" },
    { level: 4, title: "State Urban Directorate", sla: "Emergency Order", desc: "State disaster & structural safety mandate" },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Escalation Command Center</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Automatic hierarchical escalation ensures zero tolerance for unaddressed building safety hazards
        </p>
      </div>

      {/* 4-Stage Escalation Ladder Flowchart */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 lg:p-8 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-red-600" /> Municipal Escalation Hierarchy Ladder
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {ladder.map((node, i) => (
            <div
              key={node.level}
              className="relative p-5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center">
                    {node.level}
                  </span>
                  <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                    {node.sla}
                  </span>
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm">{node.title}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{node.desc}</p>
              </div>

              {i < 3 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-400">
                  <ChevronRight className="w-6 h-6" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Active Escalated Cases */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Active High-Priority Escalations</h3>
            <p className="text-xs text-slate-500">Unresolved cases currently under executive oversight</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
            {escalations.length} Cases Overdue
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 mt-3 font-semibold">Checking escalation triggers...</p>
          </div>
        ) : escalations.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">No active escalations. All reports within SLA windows.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {escalations.map((esc) => (
              <div
                key={esc.report_id}
                className="p-5 rounded-2xl bg-rose-50/50 border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-rose-900 text-sm">{esc.code}</span>
                    <SeverityBadge severity={esc.severity} size="sm" />
                    <span className="text-[11px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full">
                      Level {esc.level} Escalation
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm">{esc.damage_type} &bull; {esc.address}</h4>
                  <p className="text-xs text-rose-800 bg-white/70 p-2.5 rounded-xl border border-rose-200/80 leading-relaxed">
                    <strong>Escalation Reason:</strong> {esc.reason}
                  </p>
                </div>

                <Link
                  to={`/reports/${esc.report_id}`}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30 flex items-center gap-1.5 transition-colors shrink-0"
                >
                  Intervene &amp; Open Case <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
