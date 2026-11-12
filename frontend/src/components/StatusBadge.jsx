import React from "react";

export default function StatusBadge({ status, size = "md" }) {
  const s = status || "Reported";
  
  const styles = {
    "Reported": "bg-slate-100 text-slate-700 border-slate-300",
    "AI Verified": "bg-cyan-50 text-cyan-700 border-cyan-300",
    "Inspection Required": "bg-purple-50 text-purple-700 border-purple-300",
    "Assigned": "bg-blue-50 text-blue-700 border-blue-300",
    "Under Inspection": "bg-amber-50 text-amber-700 border-amber-300",
    "Repair Pending": "bg-orange-50 text-orange-700 border-orange-300",
    "Resolved": "bg-emerald-50 text-emerald-700 border-emerald-300",
    "Escalated": "bg-red-100 text-red-800 border-red-300 font-bold",
  };

  const style = styles[s] || "bg-gray-100 text-gray-700 border-gray-300";
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-semibold";

  return (
    <span className={`inline-flex items-center rounded-md border ${sizeClasses} ${style}`}>
      {s === "Escalated" && <span className="w-1.5 h-1.5 rounded-full bg-red-600 mr-1.5 animate-ping" />}
      {s}
    </span>
  );
}
