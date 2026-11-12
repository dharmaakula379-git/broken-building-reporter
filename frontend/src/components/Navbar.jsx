import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useRole } from "../context/RoleContext";
import { api } from "../api/client";
import {
  Menu,
  X,
  Bell,
  Shield,
  User,
  ArrowRightLeft,
  LogOut,
  ChevronDown
} from "lucide-react";

export default function Navbar({ onMenuToggle, isMobileOpen }) {
  const { role, user, toggleRole, logout, isAuthenticated } = useRole();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    api.getNotifications()
      .then((data) => setUnreadCount(data.unread_count || 0))
      .catch(() => {});

    const interval = setInterval(() => {
      api.getNotifications()
        .then((data) => setUnreadCount(data.unread_count || 0))
        .catch(() => {});
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const pathName = location.pathname;
  let title = "Citizen Dashboard";
  if (pathName === "/") title = role === "authority" ? "Authority Overview" : "Citizen Dashboard";
  else if (pathName.includes("/report")) title = "Raise Damage Ticket";
  else if (pathName.includes("/analysis")) title = "AI Damage Assessment";
  else if (pathName.includes("/reports")) title = "Ticket Management";
  else if (pathName.includes("/map")) title = "Civic Safety Risk Map";
  else if (pathName.includes("/buildings")) title = "Building Registry & History";
  else if (pathName.includes("/repair")) title = "Repair Verification Audit";
  else if (pathName.includes("/authority/escalations")) title = "Escalation Command Center";
  else if (pathName.includes("/authority/inspections")) title = "Human Inspection Queue";
  else if (pathName.includes("/authority/analytics")) title = "Municipal Safety Analytics";
  else if (pathName.includes("/notifications")) title = "Notifications & Alerts";

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-8 shadow-xs">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Toggle Menu"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            {role === "authority" ? "Vijayawada Municipal Corp. — Authority Portal" : "Citizen Safety Portal"}
          </span>
          <h1 className="text-base lg:text-lg font-bold text-slate-800 leading-tight">
            {title}
          </h1>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Role Quick Switcher */}
        <button
          onClick={toggleRole}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-300 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 text-xs font-bold text-slate-700 transition-all shadow-2xs group"
          title={`Switch to ${role === "citizen" ? "Authority Portal" : "Citizen Portal"}`}
        >
          {role === "citizen" ? (
            <span className="flex items-center gap-1.5 text-indigo-700">
              <User className="w-3.5 h-3.5" /> Citizen Mode
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-700">
              <Shield className="w-3.5 h-3.5" /> Authority Mode
            </span>
          )}
          <ArrowRightLeft className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 group-hover:rotate-180 transition-transform duration-300" />
        </button>

        {/* Notifications Bell */}
        <Link
          to="/notifications"
          className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        {/* User Profile Card & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all"
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-xs ${
              role === "authority" ? "bg-emerald-600" : "bg-indigo-600"
            }`}>
              {user?.name ? user.name.charAt(0) : "U"}
            </div>
            <span className="text-xs font-bold text-slate-700 hidden sm:inline">
              {user?.name || (role === "authority" ? "Officer Ramesh" : "Rajesh Kumar")}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Profile Menu Dropdown */}
          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 z-50 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-2 py-1.5 border-b border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Logged In As</span>
                <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  role === "authority" ? "bg-emerald-100 text-emerald-800" : "bg-indigo-100 text-indigo-800"
                }`}>
                  {user?.designation || (role === "authority" ? "Senior Structural Assessor" : "Civic Resident")}
                </span>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => {
                    toggleRole();
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
                  <span>Switch to {role === "citizen" ? "Authority Portal" : "Citizen Portal"}</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-500" />
                  <span>Sign Out / Switch User</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
