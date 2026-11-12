import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api, UPLOADS_BASE } from "../api/client";
import { useRole } from "../context/RoleContext";
import SeverityBadge from "../components/SeverityBadge";
import StatusBadge from "../components/StatusBadge";
import Timeline from "../components/Timeline";
import {
  Building2,
  Clock,
  AlertTriangle,
  Wrench,
  CheckCircle,
  Shield,
  ArrowRight,
  Eye,
  Camera,
  MapPin,
  ChevronLeft,
  CheckCircle2,
  UserCheck,
  Send,
  Sparkles,
  FileCheck
} from "lucide-react";

export default function ReportDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, user } = useRole();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewAnnotated, setViewAnnotated] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [assignedDept, setAssignedDept] = useState("");
  const [assignedInspector, setAssignedInspector] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [showResolveModal, setShowResolveModal] = useState(false);

  const loadData = () => {
    api.getReport(id)
      .then((data) => {
        setReport(data);
        setNewStatus(data.status);
        setAssignedDept(data.assigned_dept || "");
        setAssignedInspector(data.assigned_inspector || "");
      })
      .catch((err) => console.error("Error loading report details:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleStatusUpdate = async (statusToSet, customNotes = null) => {
    setUpdating(true);
    try {
      const officerName = user?.name || "Er. K. Ramesh (Senior Assessor)";
      const defaultNote = statusToSet === "Resolved"
        ? `Ticket verified and marked as Solved by ${officerName}. Structural safety confirmed.`
        : `Status updated to ${statusToSet} by ${officerName}.`;

      await api.updateReportStatus(id, {
        status: statusToSet,
        assigned_dept: assignedDept || report.assigned_dept,
        assigned_inspector: assignedInspector || report.assigned_inspector,
        notes: customNotes || defaultNote,
      });
      loadData();
      setShowResolveModal(false);
    } catch (err) {
      alert(`Error updating status: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleEscalate = async () => {
    const reason = prompt(
      "Enter escalation justification for Municipal Commissioner:",
      "Unresolved critical structural hazard exceeding SLA window."
    );
    if (!reason) return;

    setUpdating(true);
    try {
      await api.escalateReport(id, {
        level: 2,
        reason: reason,
      });
      loadData();
    } catch (err) {
      alert(`Escalation error: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 mt-3 font-semibold">Loading ticket details...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="py-16 text-center space-y-3">
        <p className="text-sm text-slate-600">Ticket #{id} not found.</p>
        <Link to="/reports" className="text-xs font-bold text-indigo-600 hover:underline">
          &larr; Back to Tickets Directory
        </Link>
      </div>
    );
  }

  const activePhoto = viewAnnotated && report.annotated_image_url 
    ? `${UPLOADS_BASE}${report.annotated_image_url}` 
    : report.image_url 
    ? `${UPLOADS_BASE}${report.image_url}` 
    : null;

  const isResolved = report.status === "Resolved";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to={role === "authority" ? "/authority/reports" : "/reports"}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to {role === "authority" ? "Ticket Triage" : "My Tickets"}
        </Link>

        <div className="flex items-center gap-2">
          {report.is_escalated && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-red-600 text-white tracking-wider animate-pulse flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Escalated (Level {report.escalation_level})
            </span>
          )}
          <SeverityBadge severity={report.severity} />
          <StatusBadge status={report.status} />
        </div>
      </div>

      {/* Ticket Solved Banner (If Resolved) */}
      {isResolved && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-emerald-950 flex items-center gap-2">
                Ticket Solved &amp; Certified Safe
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                Municipal safety officers have inspected, remediated, and verified this building damage report.
                {report.repair_notes && <span className="block mt-1 italic text-emerald-900 font-medium">"{report.repair_notes}"</span>}
              </p>
            </div>
          </div>

          <Link
            to={`/repair/${report.id}`}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5" /> View Repair Audit
          </Link>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
              {report.code}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Reported {new Date(report.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {report.damage_type}
          </h1>
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            {report.address}
          </p>
        </div>

        {/* Quick Resolution button for Authority in header */}
        {role === "authority" && !isResolved && (
          <button
            onClick={() => setShowResolveModal(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all transform active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark Ticket as Solved</span>
          </button>
        )}
      </div>

      {/* Main Grid: Left Photos & Details (7 cols), Right Workflow & Actions (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Photo Display Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-indigo-600" /> Photographic Evidence &amp; AI Detection
              </span>

              {report.annotated_image_url && report.image_url && (
                <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs">
                  <button
                    onClick={() => setViewAnnotated(true)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      viewAnnotated ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    YOLO Bounding Boxes
                  </button>
                  <button
                    onClick={() => setViewAnnotated(false)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      !viewAnnotated ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Raw Photo
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[320px]">
              {activePhoto ? (
                <img
                  src={activePhoto}
                  alt="Incident Evidence"
                  className="w-full max-h-[460px] object-contain rounded-lg"
                />
              ) : (
                <div className="text-center p-8 text-slate-400">
                  <span className="text-4xl block mb-2">🏢</span>
                  <p className="text-xs">No direct photo uploaded.</p>
                </div>
              )}
            </div>

            {/* AI Recommendation Banner */}
            <div className={`p-4 rounded-xl text-xs leading-relaxed border ${
              report.severity === "High"
                ? "bg-red-50 border-red-200 text-red-900"
                : report.severity === "Medium"
                ? "bg-amber-50 border-amber-200 text-amber-900"
                : "bg-slate-50 border-slate-200 text-slate-800"
            }`}>
              <strong className="block font-bold mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> AI Engineering Assessment (YOLO Vision Engine):
              </strong>
              {report.recommendation || "Hazard reviewed and categorized."}
            </div>
          </div>

          {/* Incident Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Incident Details &amp; Governance Metadata</h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5 font-medium">AI Confidence</span>
                <span className="text-base font-extrabold text-slate-900">{report.confidence}%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5 font-medium">Priority Score</span>
                <span className="text-base font-extrabold text-indigo-600">{report.priority_score}/100</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5 font-medium">SLA Window</span>
                <span className={`text-base font-extrabold ${report.sla_breached ? "text-red-600" : "text-emerald-600"}`}>
                  {report.hours_left}h left
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5 font-medium">Assigned Officer</span>
                <span className="text-xs font-bold text-slate-800 truncate block mt-1">
                  {report.assigned_inspector || "Er. K. Ramesh"}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Citizen Problem Description</h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {report.description || "No written description provided. Visual evidence submitted."}
              </p>
            </div>

            {/* Associated Building Link */}
            {report.building_id && (
              <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-indigo-900 font-semibold">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>Associated Building Profile: <strong>{report.building_code || `Building #${report.building_id}`}</strong></span>
                </div>
                <Link
                  to={`/buildings/${report.building_id}`}
                  className="font-bold text-indigo-600 hover:text-indigo-800"
                >
                  View History &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Workflow Timeline & Authority Action Console (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Authority Control Console (If Logged in as Authority) */}
          {role === "authority" ? (
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl space-y-5 border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Shield className="w-4 h-4" /> Officer Action Console
                </div>
                <span className="text-[11px] font-mono text-slate-400">{user?.badgeNumber || "VMC-INSP-408"}</span>
              </div>

              {/* Primary Solve Ticket Button */}
              {!isResolved ? (
                <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/80 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Resolution &amp; Certification</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Have field engineers repaired this hazard? Mark this ticket as solved to notify the citizen and close the SLA timer.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowResolveModal(true)}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-95"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Mark as Solved / Fixed</span>
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-emerald-900/30 border border-emerald-700/50 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Ticket already marked as Solved. Case archived.</span>
                </div>
              )}

              {/* Status Selector & Department Assignment */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-semibold">Update Ticket Status:</label>
                  <select
                    value={newStatus}
                    onChange={(e) => {
                      setNewStatus(e.target.value);
                      handleStatusUpdate(e.target.value);
                    }}
                    className="w-full bg-slate-950 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                  >
                    <option value="Reported">Reported</option>
                    <option value="AI Verified">AI Verified</option>
                    <option value="Inspection Required">Inspection Required</option>
                    <option value="Assigned">Assigned to Field Team</option>
                    <option value="Under Inspection">Under Active Inspection</option>
                    <option value="Repair Pending">Repair Pending</option>
                    <option value="Resolved">Resolved &amp; Closed</option>
                    <option value="Escalated">Escalated to Commissioner</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1 font-semibold">Assigned Dept:</label>
                    <input
                      type="text"
                      value={assignedDept}
                      onChange={(e) => setAssignedDept(e.target.value)}
                      placeholder="Building Safety Dept."
                      className="w-full bg-slate-950 text-white border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1 font-semibold">Assigned Officer:</label>
                    <input
                      type="text"
                      value={assignedInspector}
                      onChange={(e) => setAssignedInspector(e.target.value)}
                      placeholder="Er. K. Ramesh"
                      className="w-full bg-slate-950 text-white border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <Link
                    to={`/repair/${report.id}`}
                    className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                  >
                    <Camera className="w-3.5 h-3.5" /> AI Repair Audit &rarr;
                  </Link>

                  {!report.is_escalated && (
                    <button
                      type="button"
                      onClick={handleEscalate}
                      className="text-red-400 hover:text-red-300 font-bold text-xs"
                    >
                      Escalate to Commissioner
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Citizen View Status summary */
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span>Ticket Progress for Citizen</span>
              </div>
              <p className="text-xs text-indigo-800 leading-relaxed">
                {isResolved
                  ? "Good news! Municipal authorities have completed remedial works and certified this building defect as solved."
                  : "Your ticket has been logged in the Municipal Safety dispatch queue. Assigned officers are monitoring the mandated SLA."}
              </p>
              <div className="pt-2 border-t border-indigo-200/60 flex items-center justify-between text-xs font-semibold text-indigo-900">
                <span>Assigned Dept: {report.assigned_dept || "Building Safety Dept."}</span>
                <span>SLA: {report.hours_left}h left</span>
              </div>
            </div>
          )}

          {/* Status Timeline Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Ticket Status Timeline</h3>
              <p className="text-xs text-slate-500">Live progression through municipal safety verification</p>
            </div>

            <Timeline
              currentStatus={report.status}
              isEscalated={report.is_escalated}
              escalationReason={report.escalation_reason}
              audits={report.audits || []}
            />
          </div>
        </div>
      </div>

      {/* Officer Mark as Solved Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Mark Ticket #{report.code} as Solved</h3>
                <p className="text-xs text-slate-500">Official Municipal Certification of Hazard Remediation</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Remediation &amp; Inspection Summary Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Field inspection completed. Concrete fracture injected with epoxy grout and reinforced with carbon fiber laminate. Hazard cleared."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Certifying Officer:</span>
                  <strong className="text-slate-900">{user?.name || "Er. K. Ramesh"}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Assigned Department:</span>
                  <strong className="text-slate-900">{report.assigned_dept || "Building Safety Dept."}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResolveModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={() => handleStatusUpdate("Resolved", resolutionNotes || "Hazard remediated and structural safety certified.")}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirm &amp; Mark as Solved</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
