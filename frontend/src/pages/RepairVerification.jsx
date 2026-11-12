import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, UPLOADS_BASE } from "../api/client";
import {
  Wrench,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  Loader2,
  ShieldCheck
} from "lucide-react";

export default function RepairVerification() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [repairFile, setRepairFile] = useState(null);
  const [repairPreview, setRepairPreview] = useState(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getReport(id)
      .then(setReport)
      .catch((err) => console.error("Error loading report:", err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRepairFile(file);
      setRepairPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!repairFile) {
      setError("Please select a clear photo of the repaired area.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await api.submitRepairVerification(id, repairFile, notes);
      setResult(res.verification);
      setReport(res.report);
    } catch (err) {
      setError(err.message || "Failed to submit repair verification.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 mt-3 font-semibold">Loading repair verification audit...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="py-16 text-center space-y-3">
        <p className="text-sm text-slate-600">Report #{id} not found.</p>
        <Link to="/reports" className="text-xs font-bold text-indigo-600 hover:underline">
          &larr; Back to reports directory
        </Link>
      </div>
    );
  }

  const beforePhoto = report.annotated_image_url || report.image_url;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div>
        <Link to={`/reports/${id}`} className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 mb-1">
          <ChevronLeft className="w-3.5 h-3.5" /> Back to report #{report.code}
        </Link>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Repair Verification Audit</h2>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            {report.code}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Compare pre-repair damage evidence with post-repair completion photo. YOLO AI audits surface clearance.
        </p>
      </div>

      {/* Verification Result Banner (if already audited) */}
      {result && (
        <div className={`p-5 rounded-2xl border text-sm font-medium ${
          result.verified 
            ? "bg-emerald-50 border-emerald-200 text-emerald-900" 
            : "bg-amber-50 border-amber-200 text-amber-900"
        }`}>
          <div className="flex items-center gap-2 font-bold mb-1">
            {result.verified ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            )}
            <span>{result.verified ? "Repair Certified & Verified!" : "Repair Audit Inconclusive"}</span>
          </div>
          <p className="text-xs">{result.notes}</p>
          <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200/50">
            <span className="text-xs">Confidence Score: <strong>{result.confidence}%</strong></span>
            <Link
              to={`/reports/${report.id}`}
              className="font-bold text-xs underline"
            >
              Return to Report Details &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Before vs After Visual Comparison Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Before Repair (Original Evidence) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                1. Before Repair (Initial Damage)
              </span>
              <span className="text-[11px] text-slate-400 font-semibold">{report.damage_type}</span>
            </div>

            <div className="rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center min-h-[260px] max-h-[320px]">
              {beforePhoto ? (
                <img
                  src={`${UPLOADS_BASE}${beforePhoto}`}
                  alt="Original Damage"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center text-slate-400 p-6">
                  <span className="text-4xl block mb-2">🏢</span>
                  <span className="text-xs">No initial photograph on record</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
            <div className="flex items-center justify-between font-semibold">
              <span>Reported Severity:</span>
              <span className="text-rose-600 font-bold">{report.severity}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>AI Confidence:</span>
              <span className="font-mono">{report.confidence}%</span>
            </div>
          </div>
        </div>

        {/* Right: After Repair (Upload & Verification) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              2. After Repair (Completion Evidence)
            </span>
            <span className="text-xs text-slate-400">Post-restoration</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div
              onClick={() => document.getElementById("repair-file-input").click()}
              className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all min-h-[200px] ${
                repairPreview
                  ? "border-emerald-400 bg-emerald-50/10"
                  : "border-slate-300 hover:border-emerald-400 bg-slate-50/70"
              }`}
            >
              <input
                id="repair-file-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {repairPreview ? (
                <div className="text-center space-y-2">
                  <img
                    src={repairPreview}
                    alt="After repair preview"
                    className="max-h-52 object-contain rounded-lg border border-slate-200"
                  />
                  <span className="text-xs font-bold text-emerald-700 bg-white px-2.5 py-0.5 rounded-full border border-emerald-200 block">
                    ✓ {repairFile?.name} (Click to change)
                  </span>
                </div>
              ) : (
                <div className="text-center space-y-2 py-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <Camera className="w-5 h-5" />
                  </div>
                  <strong className="text-xs text-slate-800 block">Upload After-Repair Photograph</strong>
                  <span className="text-[11px] text-slate-500 block max-w-xs">
                    Clear image of the patched wall, sealed leak, or recabled electrical conduit.
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contractor / Inspector Repair Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Epoxy crack injection applied; surface replastered and weatherproofed."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {error && (
              <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Auditing with YOLO Model...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Run AI Verification &amp; Certify
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
