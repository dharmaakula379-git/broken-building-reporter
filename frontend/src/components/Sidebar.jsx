import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useRole } from "../context/RoleContext";
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Map,
  Building2,
  Bell,
  ShieldAlert,
  ClipboardList,
  Eye,
  AlertOctagon,
  BarChart3,
  Shield,
  ArrowRightLeft,
  X,
  LogOut,
  UserCheck
} from "lucide-react";

export default function Sidebar({ isOpen, onClose }) {
  const { role, user, toggleRole, logout } = useRole();
  const navigate = useNavigate();

  const citizenNav = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/report", label: "Raise Ticket (Report)", icon: PlusCircle, highlight: true },
    { to: "/reports", label: "My Raised Tickets", icon: FileText },
    { to: "/map", label: "Safety Map", icon: Map },
    { to: "/buildings", label: "Building Profiles", icon: Building2 },
    { to: "/notifications", label: "Notifications", icon: Bell },
  ];

  const authorityNav = [
    { to: "/authority", label: "Officer Command Center", icon: ShieldAlert },
    { to: "/authority/reports", label: "Citizen Ticket Triage", icon: ClipboardList },
    { to: "/authority/inspections", label: "Inspection Queue", icon: Eye },
    { to: "/authority/escalations", label: "Escalation Desk", icon: AlertOctagon, alert: true },
    { to: "/authority/analytics", label: "Safety Analytics", icon: BarChart3 },
    { to: "/map", label: "City Hazard Map", icon: Map },
    { to: "/buildings", label: "Building Registry", icon: Building2 },
  ];

  const links = role === "authority" ? authorityNav : citizenNav;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Shell */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-slate-900 text-slate-200 z-50 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight block leading-tight">
                Broken Building
              </span>
              <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-widest">
                Reporter 2.0
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Portal Identifier Pill */}
        <div className="px-4 py-3">
          <div className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between border ${
            role === "authority" 
              ? "bg-emerald-950/50 border-emerald-800/70 text-emerald-300" 
              : "bg-indigo-950/50 border-indigo-800/70 text-indigo-300"
          }`}>
            <span className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              {role === "authority" ? "OFFICER CONSOLE" : "CITIZEN PORTAL"}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/" || link.to === "/authority"}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? role === "authority"
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                        : "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : link.highlight
                      ? "text-indigo-400 hover:bg-slate-800 hover:text-white"
                      : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{link.label}</span>
                {link.alert && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom User Profile & Switcher */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          {/* User badge */}
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                role === "authority" ? "bg-emerald-600" : "bg-indigo-600"
              }`}>
                {user?.name ? user.name.charAt(0) : "U"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">{user?.name || "User"}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.designation || (role === "authority" ? "Municipal Assessor" : "Citizen")}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={toggleRole}
            className="w-full py-2 px-3 rounded-xl border border-slate-700 bg-slate-800/90 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
            Switch to {role === "citizen" ? "Officer Portal" : "Citizen Portal"}
          </button>
        </div>
      </aside>
    </>
  );
}
