import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRole, DEMO_USERS } from "../context/RoleContext";
import {
  ShieldAlert,
  Building2,
  User,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  CheckCircle2,
  Flame,
  Award
} from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useRole();

  const [activeTab, setActiveTab] = useState("citizen"); // "citizen" | "authority"
  const [email, setEmail] = useState("rajesh.citizen@gmail.com");
  const [password, setPassword] = useState("citizen123");
  const [rememberMe, setRememberMe] = useState(true);

  // Switch tabs & prefill demo credentials
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    if (tab === "citizen") {
      setEmail("rajesh.citizen@gmail.com");
      setPassword("citizen123");
    } else {
      setEmail("k.ramesh.safety@vijayawada.gov.in");
      setPassword("officer123");
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    login(activeTab, email, password);
    if (activeTab === "authority") {
      navigate("/authority");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 font-sans relative overflow-hidden">
      {/* Background Glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header / Brand */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 z-10">
        <div className="inline-flex items-center justify-center p-3.5 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl shadow-xl shadow-indigo-600/20 mb-1">
          <ShieldAlert className="w-10 h-10 text-indigo-400" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          Broken Building <span className="text-indigo-400">Reporter</span>
        </h1>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          Civic Safety &amp; Structural Damage Governance Platform — Vijayawada Municipal Corporation
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 z-10">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-black/40 space-y-6">
          
          {/* Dual Role Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleTabSwitch("citizen")}
              className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
                activeTab === "citizen"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Citizen Portal</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabSwitch("authority")}
              className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
                activeTab === "authority"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-[1.02]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Authority / Officer</span>
            </button>
          </div>

          {/* Role Description Banner */}
          <div className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-3 ${
            activeTab === "citizen"
              ? "bg-indigo-950/40 border-indigo-800/50 text-indigo-200"
              : "bg-emerald-950/40 border-emerald-800/50 text-emerald-200"
          }`}>
            {activeTab === "citizen" ? (
              <>
                <Building2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-indigo-100 font-bold mb-0.5">Citizen Reporting Mode</strong>
                  Upload photos of damaged buildings, raise safety tickets, and receive verified AI damage reports.
                </div>
              </>
            ) : (
              <>
                <Award className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-emerald-100 font-bold mb-0.5">Municipal Safety Officer Portal</strong>
                  Review citizen tickets, verify YOLO hazard detections, dispatch repair engineers, and certify resolutions.
                </div>
              </>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                {activeTab === "citizen" ? "Citizen Email Address" : "Official Govt. Email ID"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={activeTab === "citizen" ? "citizen@gmail.com" : "officer@vijayawada.gov.in"}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                {activeTab === "citizen" ? "Password" : "Govt. Officer Security PIN / Password"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Remember session</span>
              </label>

              <span className="text-slate-500">Demo Mode Enabled</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white shadow-xl flex items-center justify-center gap-2 transition-all transform active:scale-95 ${
                activeTab === "citizen"
                  ? "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30"
                  : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30"
              }`}
            >
              <span>Sign In as {activeTab === "citizen" ? "Citizen" : "Municipal Officer"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick 1-Click Demo Profiles */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block text-center">
              1-Click Demo Quick Fill
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  handleTabSwitch("citizen");
                  login("citizen", "rajesh.citizen@gmail.com", "citizen123");
                  navigate("/");
                }}
                className="p-3 bg-slate-950/60 hover:bg-indigo-950/50 border border-slate-800 hover:border-indigo-700/60 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold text-xs">
                    R
                  </div>
                  <span className="text-xs font-bold text-white group-hover:text-indigo-300">Rajesh Kumar</span>
                </div>
                <p className="text-[11px] text-slate-400">Citizen Reporter</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleTabSwitch("authority");
                  login("authority", "k.ramesh.safety@vijayawada.gov.in", "officer123");
                  navigate("/authority");
                }}
                className="p-3 bg-slate-950/60 hover:bg-emerald-950/50 border border-slate-800 hover:border-emerald-700/60 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    K
                  </div>
                  <span className="text-xs font-bold text-white group-hover:text-emerald-300">Er. K. Ramesh</span>
                </div>
                <p className="text-[11px] text-slate-400">Building Safety Assessor</p>
              </button>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Vijayawada Municipal Corporation &copy; 2026. Certified Civic Hazard Response Protocol.
        </p>
      </div>
    </div>
  );
}
