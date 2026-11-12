import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api, UPLOADS_BASE } from "../api/client";
import LeafletMap from "../components/LeafletMap";
import SeverityBadge from "../components/SeverityBadge";
import StatusBadge from "../components/StatusBadge";
import {
  Map,
  Filter,
  PlusCircle,
  AlertTriangle,
  Building,
  Layers,
  ArrowRight,
  RefreshCw,
  Search,
  List,
  MapPin,
  CheckCircle2,
  Eye
} from "lucide-react";

export default function SafetyMapPage() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [severityFilter, setSeverityFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [showListPane, setShowListPane] = useState(true);
  const [mapCenter, setMapCenter] = useState([16.5062, 80.6480]);
  const [mapZoom, setMapZoom] = useState(13);
  const [locatingUser, setLocatingUser] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingUser(false);
        const { latitude, longitude } = pos.coords;
        setUserLocation([latitude, longitude]);
        setMapCenter([latitude, longitude]);
        setMapZoom(16);
      },
      (err) => {
        setLocatingUser(false);
        let errorReason = err.message;
        if (err.code === 1) {
          errorReason = "Location access was denied. Click the icon in your browser address bar to allow location permissions.";
        }
        alert(`Location Error: ${errorReason}`);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const fetchReports = (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    api.getReports()
      .then((data) => {
        setReports(data || []);
      })
      .catch((err) => console.error("Error loading map reports:", err))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchReports();
    // Real-time live polling: updates map every 10 seconds automatically
    const pollInterval = setInterval(() => {
      api.getReports()
        .then((data) => {
          if (data && data.length) setReports(data);
        })
        .catch(() => {});
    }, 10000);

    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    let result = reports;
    if (severityFilter !== "All") {
      result = result.filter((r) => r.severity === severityFilter);
    }
    if (typeFilter !== "All") {
      result = result.filter((r) => (r.damage_type || "").toLowerCase().includes(typeFilter.toLowerCase()));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) =>
        (r.code || "").toLowerCase().includes(q) ||
        (r.address || "").toLowerCase().includes(q) ||
        (r.damage_type || "").toLowerCase().includes(q)
      );
    }
    setFilteredReports(result);
  }, [severityFilter, typeFilter, searchQuery, reports]);

  const handleSelectReport = (r) => {
    setSelectedReport(r);
    if (r.latitude && r.longitude) {
      setMapCenter([r.latitude, r.longitude]);
      setMapZoom(16);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Civic Safety Risk Map</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              {filteredReports.length} Incidents Plotted
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Geospatial intelligence of all public reports, structural hazards &amp; repairs across Vijayawada
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchReports(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors disabled:opacity-50"
            title="Refresh latest submitted reports"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          <button
            onClick={handleLocateUser}
            disabled={locatingUser}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all disabled:opacity-50 shadow-2xs"
            title="Focus map to my current GPS location"
          >
            <MapPin className={`w-3.5 h-3.5 text-indigo-600 ${locatingUser ? "animate-bounce" : ""}`} />
            <span>{locatingUser ? "Locating..." : "Use My Location"}</span>
          </button>

          <button
            onClick={() => setShowListPane(!showListPane)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${
              showListPane
                ? "bg-slate-900 text-white border-slate-900"
                : "border-slate-300 hover:bg-slate-50 text-slate-700"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>{showListPane ? "Hide List Pane" : "Show All Reports List"}</span>
          </button>

          <Link
            to="/report"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Raise Ticket
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search report ID, address..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Severity Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Severity:
          </span>
          {["All", "High", "Medium", "Low"].map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                severityFilter === s
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Hazard Category Select */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">Category:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Categories</option>
            <option value="Crack">Cracks (Wall &amp; Structural)</option>
            <option value="Leak">Water Leakage</option>
            <option value="Wire">Exposed Wiring</option>
            <option value="Plaster">Damaged Plaster</option>
          </select>
        </div>

        {/* Map Legend */}
        <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-600 font-medium">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> High
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Medium
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Low
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Solved
          </span>
        </div>
      </div>

      {/* Main Grid: Left Map (7 or 8 cols), Right Incident Cards (4 or 5 cols) if open */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Map Container */}
        <div className={`${showListPane ? "lg:col-span-8" : "lg:col-span-12"} transition-all space-y-4`}>
          <div className="bg-white rounded-3xl border border-slate-200 p-2 shadow-xs relative">
            <LeafletMap
              items={filteredReports}
              center={mapCenter}
              zoom={mapZoom}
              height="620px"
              userLocation={userLocation}
              onItemSelect={(item) => setSelectedReport(item)}
            />
          </div>

          {/* Selected Report Floating Summary */}
          {selectedReport && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-lg flex items-center justify-between gap-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                  {selectedReport.annotated_image_url || selectedReport.image_url ? (
                    <img
                      src={`${UPLOADS_BASE}${selectedReport.annotated_image_url || selectedReport.image_url}`}
                      alt={selectedReport.damage_type}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    "🏢"
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-indigo-700 text-sm">{selectedReport.code}</span>
                    <SeverityBadge severity={selectedReport.severity} size="sm" />
                    <StatusBadge status={selectedReport.status} size="sm" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mt-0.5">{selectedReport.damage_type}</h4>
                  <p className="text-xs text-slate-500">{selectedReport.address}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={`/reports/${selectedReport.id}`}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  View Details &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Side List of Plotted Reports (Visible when showListPane is true) */}
        {showListPane && (
          <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-4 shadow-xs space-y-3 max-h-[660px] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Plotted Incidents ({filteredReports.length})
              </span>
              <span className="text-[11px] text-slate-400">Click to focus pin</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-50">
              {filteredReports.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No incidents match the active filters.
                </div>
              ) : (
                filteredReports.map((r) => {
                  const isSelected = selectedReport?.id === r.id;
                  const thumb = r.annotated_image_url || r.image_url;

                  return (
                    <div
                      key={r.id}
                      onClick={() => handleSelectReport(r)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-indigo-50/80 border-indigo-300 shadow-xs scale-[1.01]"
                          : "bg-slate-50/70 hover:bg-slate-100/80 border-slate-200/80"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-lg">
                          {thumb ? (
                            <img src={`${UPLOADS_BASE}${thumb}`} alt={r.damage_type} className="w-full h-full object-cover" />
                          ) : (
                            "🏢"
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-extrabold text-xs text-indigo-700 truncate">{r.code}</span>
                            <SeverityBadge severity={r.severity} size="sm" />
                          </div>
                          <p className="font-bold text-xs text-slate-800 truncate">{r.damage_type}</p>
                          <p className="text-[11px] text-slate-500 truncate">{r.address}</p>
                          <div className="pt-1 flex items-center justify-between text-[10px]">
                            <StatusBadge status={r.status} size="sm" />
                            <span className="text-indigo-600 font-bold hover:underline">Focus Pin 📍</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 text-center">
              <Link to="/reports" className="text-xs font-bold text-indigo-600 hover:underline">
                Open Full Reports Directory &rarr;
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
