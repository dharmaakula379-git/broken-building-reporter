import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import StatCard from "../components/StatCard";
import SeverityBadge from "../components/SeverityBadge";
import StatusBadge from "../components/StatusBadge";
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  Building,
  ArrowRight,
  ClipboardList,
  Eye,
  AlertOctagon
} from "lucide-react";

export default function AuthorityDashboard() {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getDashboard().catch(() => ({ total: 8, high_priority: 4, under_inspection: 3, resolved: 2, escalated: 1, department_distribution: [] })),
      api.getReports().catch(() => [])
    ])
      .then(([dash, reps]) => {
        setStats(dash);
        setReports(reps);
      })
      .finally(() => setLoading(false));
  }, []);

  const highPriorityCases = reports.filter((r) => r.severity === "High" || r.is_escalated);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white p-8 lg:p-10 shadow-xl border border-purple-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" /> Municipal Safety Command Center
          </div>
          <h2 className="text-2xl lg:text-4xl font-black tracking-tight">
            Vijayawada Building Safety Directorate
          </h2>
          <p className="text-slate-300 text-xs lg:text-sm leading-relaxed">
            Prioritize high-risk structural cracks, coordinate emergency cordon teams, track departmental SLA compliance, and audit repair certifications.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <Link
            to="/authority/reports"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
          >
            <ClipboardList className="w-4 h-4" /> Triage Queue
          </Link>
          <Link
            to="/authority/escalations"
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition-all flex items-center gap-1.5"
          >
            <AlertOctagon className="w-4 h-4" /> Active Escalations ({stats?.escalated ?? 1})
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Active Cases"
          value={stats?.total ?? 8}
          icon={Building}
          tone="primary"
          trend="Citywide"
        />
        <StatCard
          label="High Risk Hazards"
          value={stats?.high_priority ?? 4}
          icon={AlertTriangle}
          tone="danger"
          trend="Immediate Action"
        />
        <StatCard
          label="Field Inspections"
          value={stats?.under_inspection ?? 3}
          icon={Eye}
          tone="warning"
          trend="Active Teams"
        />
        <StatCard
          label="SLA Escalations"
          value={stats?.escalated ?? 1}
          icon={AlertOctagon}
          tone="danger"
          trend="Breached Mandate"
        />
      </div>

      {/* 2-Column: High-Priority Triage Queue & Department Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: High Priority Cases (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" /> High-Priority &amp; Urgent Cases
                </h3>
                <p className="text-xs text-slate-500">Requires engineer dispatch or commissioner escalation</p>
              </div>
              <Link to="/authority/reports" className="text-xs font-bold text-indigo-600 hover:underline">
                Manage All &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase">
                    <th className="py-2.5 px-3">Report ID</th>
                    <th className="py-2.5 px-3">Hazard Type</th>
                    <th className="py-2.5 px-3">Dept.</th>
                    <th className="py-2.5 px-3">SLA Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {highPriorityCases.slice(0, 5).map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-extrabold text-indigo-600">
                        <Link to={`/reports/${r.id}`}>{r.code}</Link>
                        <span className="block text-[10px] text-slate-400 font-normal truncate max-w-[120px]">
                          {r.address}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">{r.damage_type}</span>
                        <SeverityBadge severity={r.severity} size="sm" />
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {r.assigned_dept || "Unassigned"}
                      </td>
                      <td className="py-3 px-3">
                        {r.is_escalated ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px] animate-pulse">
                            Escalated
                          </span>
                        ) : (
                          <span className={`text-[11px] font-semibold ${r.sla_breached ? "text-red-600 font-bold" : "text-emerald-700"}`}>
                            {r.hours_left}h left
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          to={`/reports/${r.id}`}
                          className="px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 text-[11px] font-bold transition-colors"
                        >
                          Triage &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>SLA: 24h for High Severity; 48h for Medium Severity.</span>
            <Link to="/authority/escalations" className="text-red-600 font-bold hover:underline">
              View SLA Breaches ({stats?.escalated ?? 1}) &rarr;
            </Link>
          </div>
        </div>

        {/* Right Column: Department Workload Distribution (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Department Workloads</h3>
                <p className="text-xs text-slate-500">Active caseload distribution by civic division</p>
              </div>
              <Users className="w-5 h-5 text-indigo-600" />
            </div>

            <div className="space-y-4">
              {[
                { name: "Building Safety Dept.", count: 4, total: 8, color: "bg-indigo-600" },
                { name: "Civil Engineering Dept.", count: 1, total: 8, color: "bg-cyan-600" },
                { name: "Town Planning Dept.", count: 2, total: 8, color: "bg-purple-600" },
                { name: "Electrical Safety Dept.", count: 1, total: 8, color: "bg-amber-600" },
              ].map((dept) => {
                const pct = Math.round((dept.count / dept.total) * 100);
                return (
                  <div key={dept.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800">{dept.name}</span>
                      <span className="text-slate-500 font-bold">{dept.count} cases ({pct}%)</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${dept.color}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
            <span className="font-bold text-slate-800 block">Zonal Engineering Allocation:</span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Assigned field engineers are mandated to submit photographic proof of remediation before any hazard case can be marked Resolved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
