import React from "react";
import { Check, Clock, AlertTriangle, ShieldCheck, UserCheck, Wrench } from "lucide-react";

export default function Timeline({ currentStatus, isEscalated, escalationReason, audits = [] }) {
  const stages = [
    { key: "Reported", label: "Reported", icon: Clock },
    { key: "AI Verified", label: "AI Verified", icon: ShieldCheck },
    { key: "Assigned", label: "Assigned", icon: UserCheck },
    { key: "Under Inspection", label: "Inspected", icon: Clock },
    { key: "Repair Pending", label: "Repairing", icon: Wrench },
    { key: "Resolved", label: "Resolved", icon: Check },
  ];

  const stageKeys = stages.map(s => s.key);
  let currentIndex = stageKeys.indexOf(currentStatus);
  if (currentStatus === "Inspection Required") currentIndex = 1;
  if (currentStatus === "Escalated") currentIndex = stageKeys.indexOf("Under Inspection");

  return (
    <div className="w-full">
      {/* Visual Stepper */}
      <div className="relative flex items-center justify-between mb-8">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-slate-200 w-full z-0" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 transition-all duration-500 z-0"
          style={{ width: `${Math.max(0, Math.min(100, (currentIndex / (stages.length - 1)) * 100))}%` }}
        />

        {stages.map((stage, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = stage.icon;

          return (
            <div key={stage.key} className="relative z-10 flex flex-col items-center">
              <div 
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${
                  isCurrent
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110"
                    : isDone
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "bg-white border-slate-300 text-slate-400"
                }`}
              >
                {isDone && !isCurrent ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-[11px] font-semibold mt-2 ${isCurrent ? "text-indigo-600 font-bold" : isDone ? "text-slate-800" : "text-slate-400"}`}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Escalation Notice */}
      {isEscalated && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <b className="block text-sm font-bold">Automatic Escalation Triggered</b>
            <span className="text-xs text-red-700 block mt-0.5">
              {escalationReason || "SLA response deadline was breached without certified field resolution."}
            </span>
          </div>
        </div>
      )}

      {/* Audit History Log */}
      {audits.length > 0 && (
        <div className="mt-6 border-t border-slate-100 pt-5">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Audit Log & Event History</h4>
          <div className="space-y-3">
            {audits.map((a) => (
              <div key={a.id} className="flex items-start gap-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="font-bold text-slate-700 px-2 py-0.5 rounded bg-white border border-slate-200 shrink-0">
                  {a.actor_role}
                </span>
                <div className="flex-1">
                  <span className="font-semibold text-slate-900">{a.action}: </span>
                  <span className="text-slate-600">{a.notes}</span>
                </div>
                <time className="text-slate-400 shrink-0 text-[10px]">
                  {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </time>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
