import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api, UPLOADS_BASE } from "../api/client";
import SeverityBadge from "../components/SeverityBadge";
import StatusBadge from "../components/StatusBadge";
import {
  Search,
  PlusCircle,
  Filter,
  ArrowRight,
  Clock,
  AlertTriangle,
  Building
} from "lucide-react";

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const loadReports = () => {
    setLoading(true);
    api.getReports({
      search,
      severity: selectedSeverity,
      status: selectedStatus,
    })
      .then(setReports)
      .catch((err) => console.error("Error loading reports:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReports();
  }, [selectedSeverity, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadReports();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Citizen Safety Tickets</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              {reports.length} Stored in Database
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Public directory of all building damage tickets raised by citizens across Vijayawada
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadReports}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
          >
            Refresh
          </button>
          <Link
            to="/report"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Raise Safety Ticket
          </Link>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center gap-3 justify-between">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search report ID, address, hazard..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        {/* Severity & Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Severity:
          </span>
          {["All", "High", "Medium", "Low"].map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSeverity(s)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedSeverity === s
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s}
            </button>
          ))}

          <span className="text-xs font-bold text-slate-400 ml-2">Status:</span>
          {["All", "Under Inspection", "Repair Pending", "Resolved", "Escalated"].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedStatus === st
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 mt-3 font-semibold">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-sm text-slate-500">No reports matched your search filters.</p>
            <button
              onClick={() => { setSearch(""); setSelectedSeverity("All"); setSelectedStatus("All"); }}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Evidence</th>
                  <th className="py-3 px-4">Ticket Code</th>
                  <th className="py-3 px-4">Hazard &amp; Location</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Dept.</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r) => {
                  const thumb = r.annotated_image_url || r.image_url;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        {thumb ? (
                          <img
                            src={`${UPLOADS_BASE}${thumb}`}
                            alt={r.damage_type}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-200 shadow-2xs"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-xl text-slate-400">
                            🏢
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-indigo-600">
                        <Link to={`/reports/${r.id}`}>{r.code}</Link>
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{r.damage_type}</span>
                        <span className="text-[11px] text-slate-500 block truncate max-w-xs">{r.address}</span>
                      </td>
                      <td className="py-3 px-4">
                        <SeverityBadge severity={r.severity} size="sm" />
                        <span className="block text-[10px] text-slate-400 mt-0.5">
                          AI: {r.confidence}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={r.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {r.assigned_dept || "Unassigned"}
                        {r.sla_breached && (
                          <span className="block text-[10px] text-red-600 font-bold">
                            ⚠️ SLA Breached
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/reports/${r.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 font-semibold text-xs transition-colors"
                        >
                          View &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
