import React, { useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { RoleProvider, useRole } from "./context/RoleContext";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

// Pages
import LoginPage from "./pages/LoginPage";
import CitizenDashboard from "./pages/CitizenDashboard";
import ReportDamage from "./pages/ReportDamage";
import AnalysisResult from "./pages/AnalysisResult";
import MyReports from "./pages/MyReports";
import ReportDetails from "./pages/ReportDetails";
import SafetyMapPage from "./pages/SafetyMapPage";
import BuildingsPage from "./pages/BuildingsPage";
import BuildingProfile from "./pages/BuildingProfile";
import RepairVerification from "./pages/RepairVerification";
import NotificationsPage from "./pages/NotificationsPage";
import AuthorityDashboard from "./pages/AuthorityDashboard";
import AuthorityReports from "./pages/AuthorityReports";
import InspectionsPage from "./pages/InspectionsPage";
import EscalationsPage from "./pages/EscalationsPage";
import AnalyticsPage from "./pages/AnalyticsPage";

function AppContent() {
  const { role, isAuthenticated } = useRole();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // If user visits /login, render full-screen LoginPage
  if (location.pathname === "/login") {
    return <LoginPage />;
  }

  // If not authenticated, redirect to /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Persistent Sidebar */}
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen">
        <Navbar
          isMobileOpen={mobileMenuOpen}
          onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            {/* Common & Citizen Views */}
            <Route path="/" element={role === "authority" ? <AuthorityDashboard /> : <CitizenDashboard />} />
            <Route path="/report" element={<ReportDamage />} />
            <Route path="/analysis/:id" element={<AnalysisResult />} />
            <Route path="/reports" element={<MyReports />} />
            <Route path="/reports/:id" element={<ReportDetails />} />
            <Route path="/map" element={<SafetyMapPage />} />
            <Route path="/buildings" element={<BuildingsPage />} />
            <Route path="/buildings/:id" element={<BuildingProfile />} />
            <Route path="/repair/:id" element={<RepairVerification />} />
            <Route path="/notifications" element={<NotificationsPage />} />

            {/* Authority Dedicated Routes */}
            <Route path="/authority" element={<AuthorityDashboard />} />
            <Route path="/authority/reports" element={<AuthorityReports />} />
            <Route path="/authority/inspections" element={<InspectionsPage />} />
            <Route path="/authority/escalations" element={<EscalationsPage />} />
            <Route path="/authority/analytics" element={<AnalyticsPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <RoleProvider>
      <AppContent />
    </RoleProvider>
  );
}
