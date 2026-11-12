import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/client";
import { useRole } from "../context/RoleContext";
import LocationPickerMap from "../components/LocationPickerMap";
import {
  Upload,
  Camera,
  AlertTriangle,
  MapPin,
  CheckCircle,
  HelpCircle,
  Loader2,
  FileCheck,
  ShieldAlert
} from "lucide-react";

export default function ReportDamage() {
  const navigate = useNavigate();
  const { user } = useRole();

  const [form, setForm] = useState({
    damage_type: "Wall Crack",
    description: "",
    address: "MG Road, Labbipet, Vijayawada",
    latitude: 16.5062,
    longitude: 80.6480,
  });

  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [duplicates, setDuplicates] = useState([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  // When photo selected, create preview
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      const url = URL.createObjectURL(selected);
      setFilePreview(url);
    }
  };

  // Run duplicate check when coordinates or damage_type change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (form.latitude && form.longitude && form.damage_type) {
        setCheckingDuplicates(true);
        api.checkDuplicates({
          latitude: form.latitude,
          longitude: form.longitude,
          damage_type: form.damage_type,
          threshold_meters: 150.0
        })
          .then((res) => setDuplicates(res.duplicates || []))
          .catch(() => setDuplicates([]))
          .finally(() => setCheckingDuplicates(false));
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [form.latitude, form.longitude, form.damage_type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.address.trim()) {
      setErrorMessage("Please specify a building address or landmark.");
      return;
    }

    setBusy(true);
    setErrorMessage("");

    try {
      // 1. Create Report in backend
      const report = await api.createReport({
        damage_type: form.damage_type,
        description: form.description,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        address: form.address,
        citizen_email: user?.email || "rajesh.citizen@gmail.com",
      });

      // 2. Upload photo if provided
      if (file) {
        await api.uploadReportImage(report.id, file);
      }

      // 3. Trigger AI YOLO analysis
      await api.analyzeReport(report.id);

      // 4. Redirect to AI Analysis result view
      navigate(`/analysis/${report.id}`);
    } catch (err) {
      setErrorMessage(err.message || "Failed to submit damage report.");
      setBusy(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Raise Building Safety Ticket</h2>
        <p className="text-sm text-slate-500 mt-1">
          Upload photographic damage evidence and pinpoint location. Our YOLO vision AI will perform instant structural assessment and generate a civic tracking ticket.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Photo Upload */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-indigo-600" /> 1. Upload Photographic Evidence
            </h3>
            <span className="text-xs text-slate-400">JPG, PNG, WEBP up to 10MB</span>
          </div>

          <div
            onClick={() => document.getElementById("file-input").click()}
            className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
              filePreview
                ? "border-indigo-400 bg-indigo-50/20"
                : "border-slate-300 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/10"
            }`}
          >
            <input
              id="file-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {filePreview ? (
              <div className="flex flex-col items-center space-y-3">
                <img
                  src={filePreview}
                  alt="Damage Preview"
                  className="max-h-64 object-contain rounded-xl border border-slate-200 shadow-sm"
                />
                <span className="text-xs font-bold text-indigo-700 bg-white px-3 py-1 rounded-full border border-indigo-200 shadow-2xs">
                  ✓ {file?.name} (Click to change photo)
                </span>
              </div>
            ) : (
              <div className="text-center space-y-2 py-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <b className="block text-sm text-slate-800">Click to upload or take a photo</b>
                <p className="text-xs text-slate-500 max-w-sm">
                  Close-up view of cracks, leaks, or exposed wires works best for accurate YOLO detection.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Hazard Category & Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-indigo-600" /> 2. Damage Classification & Description
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Damage Category <span className="text-red-500">*</span>
              </label>
              <select
                value={form.damage_type}
                onChange={(e) => setForm({ ...form, damage_type: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Wall Crack">Wall Crack (Vertical / Horizontal)</option>
                <option value="Structural Crack">Structural Crack (Beam / Pillar / Foundation)</option>
                <option value="Water Leakage">Water Leakage & Dampness</option>
                <option value="Exposed Wiring">Exposed Wiring / Electrical Hazard</option>
                <option value="Damaged Plaster">Damaged / Spalling Plaster</option>
                <option value="Damaged Balcony">Damaged Balcony / Parapet</option>
                <option value="Damaged Roof">Roof / Slab Deterioration</option>
                <option value="Broken Windows">Broken Windows / Glazing Hazard</option>
                <option value="Other Visible Hazard">Other Visible Hazard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Building Address / Landmark <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="e.g. MG Road, Near Benz Circle, Vijayawada"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Detailed Description & Context
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe visible progression, depth, surrounding signs (water sound, vibrations, loose debris)..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Interactive Location Picker Map */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600" /> 3. Pinpoint Location on Safety Map
            </h3>
            <span className="text-xs font-mono text-slate-500">
              {form.latitude}, {form.longitude}
            </span>
          </div>

          <LocationPickerMap
            latitude={form.latitude}
            longitude={form.longitude}
            onLocationChange={({ latitude, longitude, address }) =>
              setForm((prev) => ({
                ...prev,
                latitude,
                longitude,
                ...(address ? { address } : {})
              }))
            }
            height="320px"
          />
        </div>

        {/* Duplicate Detection Alert Banner */}
        {duplicates.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Potential Duplicate Reports Found Nearby ({duplicates.length})</span>
            </div>
            <p className="text-xs text-amber-800">
              A similar issue was already submitted within ~{duplicates[0].distance_meters} meters:
            </p>
            <div className="space-y-1.5 pt-1">
              {duplicates.slice(0, 2).map((dup) => (
                <div key={dup.id} className="text-xs bg-white/80 p-2 rounded-lg border border-amber-200 flex items-center justify-between">
                  <span>
                    <strong>{dup.code}</strong>: {dup.damage_type} ({dup.distance_meters}m away) &bull; Status: {dup.status}
                  </span>
                  <Link
                    to={`/reports/${dup.id}`}
                    target="_blank"
                    className="font-bold text-indigo-600 hover:underline"
                  >
                    View existing &rarr;
                  </Link>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-amber-700 italic">
              You can still submit your report if this is a distinct issue or a new angle.
            </p>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Submitter info */}
        {user?.email && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-500 bg-indigo-50/50 border border-indigo-100 px-4 py-2.5 rounded-xl">
            <span className="flex items-center gap-1.5 font-medium">
              <span>Submitting report as:</span>
              <strong className="text-indigo-700">{user.name}</strong>
              <span className="text-slate-400">({user.email})</span>
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              ✓ Ticket updates &amp; resolution certificate will be dispatched to this email
            </span>
          </div>
        )}

        {/* Submit Action */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all"
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing with AI & Raising Ticket...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                Analyze with AI &amp; Raise Ticket
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
