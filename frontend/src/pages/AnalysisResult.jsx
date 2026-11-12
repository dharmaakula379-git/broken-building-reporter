import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, UPLOADS_BASE } from "../api/client";
import SeverityBadge from "../components/SeverityBadge";
import StatusBadge from "../components/StatusBadge";
import {
  ShieldAlert,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Eye,
  Layers,
  ChevronLeft
} from "lucide-react";

export default function AnalysisResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewAnnotated, setViewAnnotated] = useState(true);

  useEffect(() => {
    api.getReport(id)
      .then(setReport)
      .catch((err) => console.error("Error fetching report:", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500 font-semibold">Running YOLO Vision Model Inference...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-slate-600">Report #{id} could not be found.</p>
        <Link to="/reports" className="text-sm font-bold text-indigo-600 hover:underline">
          &larr; Back to all reports
        </Link>
      </div>
    );
  }

  const isLowConfidence = (report.confidence || 0) < 60;
  const imageUrl = viewAnnotated && report.annotated_image_url 
    ? `${UPLOADS_BASE}${report.annotated_image_url}` 
    : report.image_url 
    ? `${UPLOADS_BASE}${report.image_url}` 
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" /> AI Model Assessment Complete
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            {report.code}: {report.damage_type}
          </h2>
          <p className="text-xs text-slate-500">{report.address}</p>
        </div>

        <div className="flex items-center gap-2">
          <SeverityBadge severity={report.severity} />
          <StatusBadge status={report.status} />
        </div>
      </div>

      {/* Main Analysis Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 lg:p-8 shadow-xs space-y-6">
        {/* Visual Inspection Panel */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col items-center justify-center min-h-[340px]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="YOLO Detection Result"
              className="w-full max-h-[460px] object-contain rounded-xl"
            />
          ) : (
            <div className="text-center p-8 space-y-2 text-slate-400">
              <span className="text-5xl block">🏢</span>
              <p className="text-xs">No direct photo uploaded. Preliminary score based on citizen description.</p>
            </div>
          )}

          {/* Toggle between Annotated & Original View */}
          {report.annotated_image_url && report.image_url && (
            <div className="absolute bottom-3 right-3 z-10 bg-slate-900/90 backdrop-blur-md rounded-xl p-1 border border-slate-700 flex items-center gap-1">
              <button
                onClick={() => setViewAnnotated(true)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewAnnotated ? "bg-indigo-600 text-white shadow-xs" : "text-slate-300 hover:text-white"
                }`}
              >
                YOLO Bounding Boxes
              </button>
              <button
                onClick={() => setViewAnnotated(false)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  !viewAnnotated ? "bg-indigo-600 text-white shadow-xs" : "text-slate-300 hover:text-white"
                }`}
              >
                Raw Photo
              </button>
            </div>
          )}

          {/* Detection Tag Overlay Bottom-Left */}
          <div className="absolute bottom-3 left-3 z-10 bg-black/80 backdrop-blur-md text-white text-[11px] font-mono px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            YOLO Inference: {report.confidence}% confidence
          </div>
        </div>

        {/* 3 Metrics Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">AI Confidence</span>
            <span className={`text-2xl font-black mt-1 block ${
              report.confidence >= 70 ? "text-indigo-600" : report.confidence >= 40 ? "text-amber-600" : "text-slate-600"
            }`}>
              {report.confidence}%
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Assessed Severity</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{report.severity}</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Priority Score</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{report.priority_score}<span className="text-xs text-slate-400">/100</span></span>
          </div>
        </div>

        {/* Detected Hazard Regions Bounding Box List */}
        {report.detections && report.detections.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" /> Verified Hazard Regions ({report.detections.length})
              </span>
              <span className="text-[11px] text-slate-400 font-mono">YOLO11 Vision Engine</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {report.detections.map((d, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${
                    d.class_name === "crack"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : d.class_name === "water_leakage"
                      ? "bg-sky-50 text-sky-700 border-sky-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current" />
                  {d.class_name.toUpperCase().replace("_", " ")} — {d.confidence}%
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recommendation Box */}
        {isLowConfidence ? (
          <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-purple-600 shrink-0" />
              <span>Inspection Required: Human Certification Queued</span>
            </div>
            <p className="text-xs text-purple-800 leading-relaxed">
              {report.recommendation || "Visible evidence confidence is under threshold (60%) or conditions may obscure structural damage. The case has been routed to human field engineers for on-site inspection."}
            </p>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>AI Verification & Recommendation</span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              {report.recommendation}
            </p>
            {report.assigned_dept && (
              <div className="pt-2 text-xs font-semibold text-emerald-800 border-t border-emerald-200/70 flex items-center justify-between">
                <span>Assigned Department: <strong>{report.assigned_dept}</strong></span>
                <span>Mandated SLA: <strong>{report.sla_hours}h</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Action Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <Link
            to="/report"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold text-center transition-colors"
          >
            &larr; Report Another Issue
          </Link>

          <Link
            to={`/reports/${report.id}`}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
          >
            Track Status Timeline &amp; Actions <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
