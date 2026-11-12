import React from "react";
import { AlertTriangle, AlertCircle, CheckCircle, HelpCircle } from "lucide-react";

export default function SeverityBadge({ severity, showIcon = true, size = "md" }) {
  const s = severity || "Low";
  let tone = "bg-emerald-50 text-emerald-700 border-emerald-200";
  let Icon = CheckCircle;

  if (s === "High") {
    tone = "bg-rose-50 text-rose-700 border-rose-200 animate-pulse";
    Icon = AlertCircle;
  } else if (s === "Medium") {
    tone = "bg-amber-50 text-amber-700 border-amber-200";
    Icon = AlertTriangle;
  } else if (s === "Inspection Required") {
    tone = "bg-purple-50 text-purple-700 border-purple-200";
    Icon = HelpCircle;
  }

  const sizeClasses = size === "sm" 
    ? "px-2 py-0.5 text-xs gap-1" 
    : "px-2.5 py-1 text-xs font-semibold gap-1.5";

  return (
    <span className={`inline-flex items-center rounded-full border ${sizeClasses} ${tone}`}>
      {showIcon && <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />}
      <span>{s}</span>
    </span>
  );
}
