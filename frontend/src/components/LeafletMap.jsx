import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "react-router-dom";
import SeverityBadge from "./SeverityBadge";
import StatusBadge from "./StatusBadge";
import { UPLOADS_BASE } from "../api/client";

// Custom high-contrast SVG pins
function getMarkerIcon(severity, status) {
  let color = "#10B981"; // Low (Green)
  if (status === "Resolved") {
    color = "#3B82F6"; // Blue
  } else if (severity === "High" || status === "Escalated") {
    color = "#EF4444"; // Red
  } else if (severity === "Medium") {
    color = "#F59E0B"; // Amber
  } else if (severity === "Inspection Required") {
    color = "#8B5CF6"; // Purple
  }

  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div style="position:relative; width:34px; height:34px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
        <svg viewBox="0 0 24 24" width="34" height="34" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35)); transition: transform 0.2s;">
          <path fill="${color}" stroke="#ffffff" stroke-width="2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          <circle cx="12" cy="9" r="3" fill="#ffffff"/>
        </svg>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  });
}

function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
}

const userPinIcon = L.divIcon({
  className: "user-location-marker",
  html: `
    <div style="position:relative; width:36px; height:36px; display:flex; align-items:center; justify-content:center;">
      <span style="position:absolute; width:36px; height:36px; border-radius:50%; background:rgba(59,130,246,0.35); animation:pulse 1.5s infinite;"></span>
      <div style="width:18px; height:18px; border-radius:50%; background:#2563eb; border:3px solid #ffffff; box-shadow:0 3px 8px rgba(0,0,0,0.35);"></div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

export default function LeafletMap({
  items = [],
  center = [16.5062, 80.6480], // Vijayawada default center
  zoom = 13,
  height = "520px",
  onItemSelect = null,
  userLocation = null,
}) {
  // Disperse overlapping points so every single report gets its own clearly visible pin
  const dispersedItems = React.useMemo(() => {
    const coordsMap = {};
    return items.map((item) => {
      if (!item.latitude || !item.longitude) return item;
      const key = `${Number(item.latitude).toFixed(4)},${Number(item.longitude).toFixed(4)}`;
      const count = coordsMap[key] || 0;
      coordsMap[key] = count + 1;

      if (count > 0) {
        // Disperse along a small offset circle (~35m radius) around the original building coordinate
        const angle = (count * 2 * Math.PI) / 6;
        const radius = 0.00045 * (1 + Math.floor(count / 6) * 0.4);
        const latOffset = Math.sin(angle) * radius;
        const lngOffset = Math.cos(angle) * radius;
        return {
          ...item,
          displayLat: Number(item.latitude) + latOffset,
          displayLng: Number(item.longitude) + lngOffset,
          isOffset: true
        };
      }
      return {
        ...item,
        displayLat: Number(item.latitude),
        displayLng: Number(item.longitude),
        isOffset: false
      };
    });
  }, [items]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <MapUpdater center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Live User Location Pin if active */}
        {userLocation && userLocation[0] && userLocation[1] && (
          <Marker position={userLocation} icon={userPinIcon}>
            <Popup>
              <div className="text-center font-bold text-xs p-1 text-slate-900">
                📍 You Are Here (Current GPS Location)
              </div>
            </Popup>
          </Marker>
        )}

        {dispersedItems.map((item) => {
          if (!item.displayLat || !item.displayLng) return null;
          const icon = getMarkerIcon(item.severity, item.status);

          return (
            <Marker
              key={item.id}
              position={[item.displayLat, item.displayLng]}
              icon={icon}
              eventHandlers={{
                click: () => onItemSelect && onItemSelect(item),
              }}
            >
              <Popup className="custom-map-popup">
                <div className="p-1 min-w-[210px] max-w-[260px]">
                  {item.image_url ? (
                    <img
                      src={`${UPLOADS_BASE}${item.image_url}`}
                      alt={item.damage_type}
                      className="w-full h-28 object-cover rounded-lg mb-2 border border-slate-200"
                    />
                  ) : (
                    <div className="w-full h-24 bg-slate-100 rounded-lg flex items-center justify-center text-3xl mb-2">
                      🏢
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="font-extrabold text-xs text-indigo-700">{item.code}</span>
                    <SeverityBadge severity={item.severity} size="sm" />
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 leading-snug">{item.damage_type}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{item.address}</p>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <StatusBadge status={item.status} size="sm" />
                    <Link
                      to={`/reports/${item.id}`}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      View Report &rarr;
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
