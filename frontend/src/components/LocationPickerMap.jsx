import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Navigation, MapPin, CheckCircle2, Loader2 } from "lucide-react";

const pickerIcon = L.divIcon({
  className: "picker-pin",
  html: `
    <div style="position:relative; width:40px; height:40px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
      <svg viewBox="0 0 24 24" width="40" height="40" style="filter: drop-shadow(0 4px 8px rgba(99,102,241,0.5));">
        <path fill="#4F46E5" stroke="#ffffff" stroke-width="2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="3.5" fill="#ffffff"/>
      </svg>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function PanToLocation({ position }) {
  const map = useMap();
  React.useEffect(() => {
    if (position && position[0] && position[1]) {
      map.setView(position, map.getZoom() || 15);
    }
  }, [position, map]);
  return null;
}

export default function LocationPickerMap({
  latitude,
  longitude,
  onLocationChange,
  height = "280px"
}) {
  const [locating, setLocating] = useState(false);
  const [locatedSuccess, setLocatedSuccess] = useState(false);
  const position = [Number(latitude) || 16.5062, Number(longitude) || 80.6480];

  const handleSelect = async (lat, lng) => {
    let resolvedAddress = null;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        headers: { "Accept-Language": "en" }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          const a = data.address;
          const parts = [
            a.road || a.suburb || a.neighbourhood || a.quarter,
            a.city || a.town || a.county || a.state_district,
            a.state || "Andhra Pradesh"
          ].filter(Boolean);
          if (parts.length > 0) resolvedAddress = parts.join(", ");
        }
      }
    } catch {
      // ignore
    }

    onLocationChange({
      latitude: parseFloat(lat.toFixed(6)),
      longitude: parseFloat(lng.toFixed(6)),
      address: resolvedAddress
    });
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    setLocatedSuccess(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLocating(false);
        setLocatedSuccess(true);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        await handleSelect(lat, lng);
        setTimeout(() => setLocatedSuccess(false), 4000);
      },
      (err) => {
        setLocating(false);
        let errorReason = err.message;
        if (err.code === 1) {
          errorReason = "Permission was denied. Please click the padlock / location icon in your browser address bar and choose 'Allow'.";
        }
        alert(`Location Error: ${errorReason}`);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-300 shadow-inner" style={{ height }}>
      <MapContainer
        center={position}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onLocationSelect={(lat, lng) => handleSelect(lat, lng)} />
        <PanToLocation position={position} />
        <Marker position={position} icon={pickerIcon} />
      </MapContainer>

      {/* Floating Instructions Banner & Locate Me Button */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-[1000] flex items-center justify-between pointer-events-none gap-2">
        <span className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 shadow-md border border-slate-200 pointer-events-auto flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Click map to drop pin or use GPS
        </span>

        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-md flex items-center gap-1.5 pointer-events-auto transition-all ${
            locatedSuccess
              ? "bg-emerald-600 text-white"
              : "bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-102"
          }`}
        >
          {locating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Fetching GPS...</span>
            </>
          ) : locatedSuccess ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Location Set!</span>
            </>
          ) : (
            <>
              <Navigation className="w-3.5 h-3.5" />
              <span>Use My Location</span>
            </>
          )}
        </button>
      </div>

      <div className="absolute bottom-2 left-2 z-[1000] bg-slate-900/85 backdrop-blur text-white px-2.5 py-1 rounded-md text-[11px] font-mono pointer-events-none border border-slate-700">
        Lat: {latitude}, Lng: {longitude}
      </div>
    </div>
  );
}
