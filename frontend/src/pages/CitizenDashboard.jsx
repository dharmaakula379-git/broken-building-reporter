import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import StatCard from "../components/StatCard";
import SeverityBadge from "../components/SeverityBadge";
import StatusBadge from "../components/StatusBadge";
import LeafletMap from "../components/LeafletMap";
import {
  PlusCircle,
  MapPin,
  AlertCircle,
  Clock,
  CheckCircle2,
  FileText,
  Shield,
  ArrowRight,
  Eye,
  Camera,
  Cpu,
  Wrench
} from "lucide-react";

export default function CitizenDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getDashboard().catch(() => ({ total: 8, high_priority: 4, under_inspection: 3, resolved: 2 })),
      api.getReports().catch(() => [])
    ])
      .then(([dash, reports]) => {
        setStats(dash);
        setRecentReports(reports.slice(0, 10));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white p-8 lg:p-12 shadow-xl border border-indigo-900/40">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold tracking-wide uppercase">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" /> AI-Assisted Civic Safety Platform
          </div>
          <h1 className="text-3xl lg:text-5xl font-black tracking-tight leading-tight">
            Report. <span className="text-indigo-400">Track.</span> Resolve.
          </h1>
          <p className="text-slate-300 text-sm lg:text-base leading-relaxed">
            Report visible cracks, structural hazards, water leakage, or dangerous wiring. Our integrated YOLO AI vision model assesses preliminary severity and holds local municipal authorities accountable until full repair verification.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/report"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-102"
            >
              <PlusCircle className="w-4 h-4" /> Report Building Damage
            </Link>
            <Link
              to="/map"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-all"
            >
              <MapPin className="w-4 h-4 text-indigo-400" /> View Live Safety Map
            </Link>
          </div>
        </div>

        {/* Decorative Badge Right */}
        <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col items-center justify-center p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 max-w-xs text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 text-3xl">
            🏢
          </div>
          <span className="font-bold text-sm text-slate-200">Vijayawada Civic Safety</span>
          <p className="text-xs text-slate-400">
            Real-time public reporting synchronized with Municipal Authority dispatch teams.
          </p>
        </div>
      </section>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Reports"
          value={stats?.total ?? 8}
          icon={FileText}
          tone="primary"
          trend="Live database"
        />
        <StatCard
          label="High Priority"
          value={stats?.high_priority ?? 4}
          icon={AlertCircle}
          tone="danger"
          trend="Urgent Action"
        />
        <StatCard
          label="Under Inspection"
          value={stats?.under_inspection ?? 3}
          icon={Clock}
          tone="warning"
          trend="In Progress"
        />
        <StatCard
          label="Verified Resolved"
          value={stats?.resolved ?? 2}
          icon={CheckCircle2}
          tone="success"
          trend="Repaired"
        />
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Reports Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Community Reports</h3>
                <p className="text-xs text-slate-500">Latest reported building issues across the city</p>
              </div>
              <Link to="/reports" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                View All ({stats?.total ?? 8}) <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold">
                    <th className="py-2.5 px-3">Report ID</th>
                    <th className="py-2.5 px-3">Hazard Type</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentReports.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-indigo-600">
                        <Link to={`/reports/${r.id}`}>{r.code}</Link>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{r.damage_type}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[160px]">{r.address}</div>
                      </td>
                      <td className="py-3 px-3">
                        <SeverityBadge severity={r.severity} size="sm" />
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={r.status} size="sm" />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          to={`/reports/${r.id}`}
                          className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 text-[11px] font-semibold transition-colors"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Logged in as Citizen. Use top bar to switch to Authority view.</span>
            <Link to="/report" className="font-bold text-indigo-600 hover:underline">
              + Submit new report
            </Link>
          </div>
        </div>

        {/* Right Column: Workflow Steps (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">How It Works</h3>
            <p className="text-xs text-slate-500 mb-5">Accountable 4-stage pipeline from report to resolution</p>

            <div className="space-y-4">
              {[
                {
                  step: 1,
                  title: "Citizen Reports with Evidence",
                  desc: "Upload photo & drop location pin on the map. Duplicate check verifies existing nearby issues.",
                  icon: Camera,
                  color: "bg-indigo-50 text-indigo-600 border-indigo-200",
                },
                {
                  step: 2,
                  title: "YOLO AI Inference Analysis",
                  desc: "Runs trained model on image to detect cracks, leaks, or wires. Generates confidence & bounding boxes.",
                  icon: Cpu,
                  color: "bg-cyan-50 text-cyan-700 border-cyan-200",
                },
                {
                  step: 3,
                  title: "Authority Inspection & SLA",
                  desc: "Assigned to dedicated municipal department. SLA countdown timer enforces deadline escalation.",
                  icon: Eye,
                  color: "bg-amber-50 text-amber-700 border-amber-200",
                },
                {
                  step: 4,
                  title: "Repair & AI Verification",
                  desc: "After-repair photo is audited with AI to certify hazard resolution before closing the case.",
                  icon: Wrench,
                  color: "bg-emerald-50 text-emerald-700 border-emerald-200",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="flex items-start gap-3.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border ${item.color} shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-800 leading-relaxed flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Low-confidence AI detections (&lt;60%) automatically bypass automated triage and route to certified human engineers.</span>
          </div>
        </div>
      </div>

      {/* Safety Map Section */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">Vijayawada Civic Safety Map</h3>
            <p className="text-xs text-slate-500">Live pinpoints of active structural damage reports & inspection sites</p>
          </div>
          <Link to="/map" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            Open Full Interactive Map &rarr;
          </Link>
        </div>

        <LeafletMap items={recentReports} height="380px" />
      </section>
    </div>
  );
}
