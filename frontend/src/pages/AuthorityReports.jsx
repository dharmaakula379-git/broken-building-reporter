import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api, UPLOADS_BASE } from "../api/client";
import SeverityBadge from "../components/SeverityBadge";
import StatusBadge from "../components/StatusBadge";
import {
  ClipboardList,
  Search,
  Filter,
  Eye,
  CheckCircle,
  AlertTriangle,
  X,
  UserCheck
} from "lucide-react";

export default function AuthorityReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedSeverity, setSelectedSeverity] = useState("All");

  // Assignment Modal
  const [activeModalReport, setActiveModalReport] = useState(null);
  const [modalDept, setModalDept] = useState("Building Safety Dept.");
  const [modalInspector, setModalInspector] = useState("Er. K. Ramesh (Senior Structural Assessor)");
  const [modalStatus, setModalStatus] = useState("Assigned");
  const [modalNotes, setModalNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadReports = () => {
    setLoading(true);
    api.getReports({
      search,
      status: selectedStatus,
      severity: selectedSeverity,
    })
      .then(setReports)
      .catch((err) => console.error("Error loading authority reports:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReports();
  }, [selectedStatus, selectedSeverity]);

  const handleOpenAssignModal = (r) => {
    setActiveModalReport(r);
    setModalDept(r.assigned_dept || "Building Safety Dept.");
    setModalInspector(r.assigned_inspector || "Er. K. Ramesh (Senior Structural Assessor)");
    setModalStatus(r.status || "Assigned");
    setModalNotes("");
  };

  const handleQuickResolve = async (r) => {
    const confirmation = window.confirm(`Mark Ticket #${r.code} (${r.damage_type}) as SOLVED and certified safe?`);
    if (!confirmation) return;
    try {
      await api.updateReportStatus(r.id, {
        status: "Resolved",
        notes: `Ticket #${r.code} inspected, remediated and certified resolved by Building Safety Authority.`
      });
      loadReports();
    } catch (err) {
      alert(`Error resolving ticket: ${err.message}`);
    }
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!activeModalReport) return;
    setSubmitting(true);
    try {
      await api.updateReportStatus(activeModalReport.id, {
        status: modalStatus,
        assigned_dept: modalDept,
        assigned_inspector: modalInspector,
        notes: modalNotes || `Assigned to ${modalDept} (${modalInspector}). Status: ${modalStatus}`,
      });
      setActiveModalReport(null);
      loadReports();
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Report Triage &amp; Management</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Verify citizen submissions, assign authorized inspection engineers, and monitor case deadlines
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center gap-3 justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadReports()}
            placeholder="Search code, address, inspector..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {["All", "Reported", "Assigned", "Under Inspection", "Repair Pending", "Resolved"].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedStatus === st
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 mt-3 font-semibold">Loading management queue...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <p className="text-xs">No reports found matching criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Report</th>
                  <th className="py-3 px-4">Hazard &amp; Severity</th>
                  <th className="py-3 px-4">Assigned Department</th>
                  <th className="py-3 px-4">Assigned Inspector</th>
                  <th className="py-3 px-4">Status &amp; SLA</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <Link to={`/reports/${r.id}`} className="font-extrabold text-indigo-600 hover:underline">
                        {r.code}
                      </Link>
                      <span className="block text-[11px] text-slate-400 truncate max-w-xs">{r.address}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{r.damage_type}</span>
                      <SeverityBadge severity={r.severity} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {r.assigned_dept || <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {r.assigned_inspector || <span className="text-slate-400 italic">Pending</span>}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={r.status} size="sm" />
                      <span className={`block text-[10px] mt-0.5 ${r.sla_breached ? "text-red-600 font-bold" : "text-slate-400"}`}>
                        {r.sla_breached ? "⚠️ SLA Breached" : `${r.hours_left}h SLA left`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.status !== "Resolved" ? (
                          <button
                            onClick={() => handleQuickResolve(r)}
                            className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-xs"
                            title="Mark Ticket as Solved"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Mark Solved</span>
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[11px] flex items-center gap-1 border border-emerald-200">
                            <CheckCircle className="w-3 h-3" /> Solved
                          </span>
                        )}
                        <button
                          onClick={() => handleOpenAssignModal(r)}
                          className="px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-bold text-xs transition-colors"
                        >
                          Triage
                        </button>
                        <Link
                          to={`/reports/${r.id}`}
                          className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assignment / Status Update Modal */}
      {activeModalReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Triage Case #{activeModalReport.code}
                </h3>
                <span className="text-xs text-slate-500">{activeModalReport.damage_type} &bull; {activeModalReport.address}</span>
              </div>
              <button
                onClick={() => setActiveModalReport(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Department</label>
                <select
                  value={modalDept}
                  onChange={(e) => setModalDept(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800"
                >
                  <option value="Building Safety Dept.">Building Safety Dept. (Structural &amp; Cracks)</option>
                  <option value="Civil Engineering Dept.">Civil Engineering Dept. (Plaster &amp; Facade)</option>
                  <option value="Engineering Dept.">Engineering Dept. (Water Leakage &amp; Drainage)</option>
                  <option value="Electrical Dept.">Electrical Dept. (Wiring &amp; Hazardous Conduit)</option>
                  <option value="Town Planning Dept.">Town Planning Dept. (Zonal Inspections)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lead Field Inspector / Engineer</label>
                <input
                  type="text"
                  value={modalInspector}
                  onChange={(e) => setModalInspector(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 font-medium"
                  placeholder="e.g. Er. K. Ramesh (Senior Structural Assessor)"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Workflow Status</label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800"
                >
                  <option value="Assigned">Assigned</option>
                  <option value="Under Inspection">Under Inspection</option>
                  <option value="Repair Pending">Repair Pending</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Escalated">Escalated</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Directives / Notes</label>
                <textarea
                  rows={2}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Enter dispatch notes or safety instructions for field team..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModalReport(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/30"
                >
                  {submitting ? "Saving..." : "Save Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
