import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api, UPLOADS_BASE } from "../api/client";
import { useRole } from "../context/RoleContext";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  ArrowRight,
  Mail,
  Send,
  Settings,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
  FileText,
  Loader2
} from "lucide-react";

export default function NotificationsPage() {
  const { user, role } = useRole();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Email Config State
  const [emailConfig, setEmailConfig] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showSentModal, setShowSentModal] = useState(false);
  const [sentEmails, setSentEmails] = useState([]);

  // Test Email Form
  const [testForm, setTestForm] = useState({
    to_email: user?.email || "rajesh.citizen@gmail.com",
    subject: "🔔 Test Notification from Broken Building Reporter",
    message: "This is a live test notification from your Broken Building Reporter platform in Vijayawada."
  });
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Config Form
  const [configForm, setConfigForm] = useState({
    enabled: true,
    smtp_server: "smtp.gmail.com",
    smtp_port: 587,
    use_tls: true,
    sender_name: "Vijayawada Civic Safety & Structural Damage Reporter",
    smtp_user: "",
    smtp_password: "",
    default_citizen_email: "rajesh.citizen@gmail.com",
    default_authority_email: "k.ramesh.safety@vijayawada.gov.in",
    admin_alert_email: "commissioner.vmc@ap.gov.in"
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSavedToast, setConfigSavedToast] = useState(false);

  // Active email HTML preview modal
  const [activePreviewHtml, setActivePreviewHtml] = useState(null);

  const loadNotifications = () => {
    setLoading(true);
    api.getNotifications()
      .then((data) => setNotifications(data.notifications || []))
      .catch((err) => console.error("Error loading notifications:", err))
      .finally(() => setLoading(false));
  };

  const loadEmailSettings = () => {
    api.getEmailSettings()
      .then((cfg) => {
        setEmailConfig(cfg);
        setConfigForm(cfg);
      })
      .catch((err) => console.error("Error loading email settings:", err));
  };

  const loadSentEmails = () => {
    api.getSentEmails()
      .then((res) => setSentEmails(res.emails || []))
      .catch((err) => console.error("Error loading sent emails:", err));
  };

  useEffect(() => {
    loadNotifications();
    loadEmailSettings();
    loadSentEmails();

    // Auto-poll notifications and email dispatches every 10 seconds
    const interval = setInterval(() => {
      api.getNotifications()
        .then((data) => setNotifications(data.notifications || []))
        .catch(() => {});
      api.getSentEmails()
        .then((res) => setSentEmails(res.emails || []))
        .catch(() => {});
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      loadNotifications();
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const handleReadSingle = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await api.sendTestEmail(testForm);
      setTestResult({
        success: true,
        message: `Email dispatched to ${testForm.to_email}! Mode: ${res.delivery_method}`
      });
      loadSentEmails();
    } catch (err) {
      setTestResult({
        success: false,
        message: `Failed to dispatch: ${err.message}`
      });
    } finally {
      setTestSending(false);
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await api.updateEmailSettings(configForm);
      setEmailConfig(res.settings);
      setConfigSavedToast(true);
      setTimeout(() => setConfigSavedToast(false), 3000);
      setShowConfigModal(false);
    } catch (err) {
      alert(`Error saving email configuration: ${err.message}`);
    } finally {
      setSavingConfig(false);
    }
  };

  const getToneStyle = (tone) => {
    if (tone === "danger") return { icon: AlertTriangle, bg: "bg-rose-50 border-rose-200 text-rose-700", iconColor: "text-rose-600" };
    if (tone === "warning") return { icon: AlertTriangle, bg: "bg-amber-50 border-amber-200 text-amber-700", iconColor: "text-amber-600" };
    if (tone === "success") return { icon: CheckCircle2, bg: "bg-emerald-50 border-emerald-200 text-emerald-700", iconColor: "text-emerald-600" };
    return { icon: Info, bg: "bg-indigo-50 border-indigo-200 text-indigo-700", iconColor: "text-indigo-600" };
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Alerts &amp; Email Dispatch</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time citizen alerts, AI inspection updates, and email notifications dispatched to stakeholders
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTestModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Send className="w-3.5 h-3.5" /> Send Test Email
          </button>

          <button
            onClick={() => setShowConfigModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" /> Mail Settings
          </button>

          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
            title="Mark all notifications as read"
          >
            <CheckCheck className="w-3.5 h-3.5 text-indigo-600" />
          </button>
        </div>
      </div>

      {/* Email Dispatch Info Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-md border border-indigo-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/20 shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-indigo-100">Live Email Notification Pipeline</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Notifications are automatically dispatched to:
              <strong className="text-white ml-1">{emailConfig?.default_citizen_email || "rajesh.citizen@gmail.com"}</strong> (Citizen) &amp;
              <strong className="text-white ml-1">{emailConfig?.default_authority_email || "k.ramesh.safety@vijayawada.gov.in"}</strong> (Authority)
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowSentModal(true)}
          className="shrink-0 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-indigo-200 hover:text-white transition-all flex items-center gap-1.5"
        >
          <FileText className="w-3.5 h-3.5" /> View Outbox ({sentEmails.length})
        </button>
      </div>

      {configSavedToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Email configuration saved successfully!
        </div>
      )}

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 mt-3 font-semibold">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Bell className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm">You have no new notifications.</p>
          </div>
        ) : (
          notifications.map((n) => {
            const tone = getToneStyle(n.tone);
            const ToneIcon = tone.icon;

            return (
              <div
                key={n.id}
                className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                  n.is_read ? "bg-white hover:bg-slate-50/60" : "bg-indigo-50/30 hover:bg-indigo-50/50"
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${tone.bg}`}>
                    <ToneIcon className={`w-4 h-4 ${tone.iconColor}`} />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{n.title}</span>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                      )}
                      {n.recipient_email && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-medium text-slate-600">
                          <Mail className="w-2.5 h-2.5 text-indigo-500" />
                          <span>{n.recipient_email}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {new Date(n.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {n.link && (
                    <Link
                      to={n.link}
                      onClick={() => handleReadSingle(n.id)}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>View Ticket</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: TEST EMAIL DISPATCH */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                  <Send className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">Send Live Test Email</h3>
              </div>
              <button
                onClick={() => { setShowTestModal(false); setTestResult(null); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendTestEmail} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Recipient Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={testForm.to_email}
                  onChange={(e) => setTestForm({ ...testForm, to_email: e.target.value })}
                  placeholder="Enter your personal Gmail or test email"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  You can type your real personal email address here to test receiving emails.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Subject</label>
                <input
                  type="text"
                  required
                  value={testForm.subject}
                  onChange={(e) => setTestForm({ ...testForm, subject: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Message Content</label>
                <textarea
                  rows={3}
                  required
                  value={testForm.message}
                  onChange={(e) => setTestForm({ ...testForm, message: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800"
                />
              </div>

              {testResult && (
                <div className={`p-3 rounded-xl border text-xs font-semibold ${
                  testResult.success ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-rose-50 border-rose-300 text-rose-800"
                }`}>
                  {testResult.message}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={testSending}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold shadow-xs flex items-center gap-1.5"
                >
                  {testSending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Send Email Now
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EMAIL & SMTP CONFIGURATION */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Mail &amp; SMTP Configuration</h3>
                  <p className="text-[11px] text-slate-500">Configure real Gmail or custom SMTP dispatch credentials</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Default Citizen Email</label>
                  <input
                    type="email"
                    value={configForm.default_citizen_email}
                    onChange={(e) => setConfigForm({ ...configForm, default_citizen_email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Authority Alert Email</label>
                  <input
                    type="email"
                    value={configForm.default_authority_email}
                    onChange={(e) => setConfigForm({ ...configForm, default_authority_email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 font-semibold"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
                <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Real Gmail SMTP Setup (Optional)
                </span>
                <p className="text-[11px] text-indigo-800 leading-relaxed">
                  To send real live emails to personal inboxes, enter your Gmail and a 16-character <strong>Google App Password</strong> (from Google Account &gt; Security &gt; 2-Step Verification &gt; App Passwords). If left blank, emails are automatically stored as simulated HTML files in the Outbox.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SMTP Host</label>
                  <input
                    type="text"
                    value={configForm.smtp_server}
                    onChange={(e) => setConfigForm({ ...configForm, smtp_server: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SMTP Port</label>
                  <input
                    type="number"
                    value={configForm.smtp_port}
                    onChange={(e) => setConfigForm({ ...configForm, smtp_port: parseInt(e.target.value) || 587 })}
                    className="w-full p-2 rounded-lg border border-slate-300 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gmail / SMTP Username</label>
                  <input
                    type="text"
                    placeholder="yourname@gmail.com"
                    value={configForm.smtp_user || ""}
                    onChange={(e) => setConfigForm({ ...configForm, smtp_user: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Google App Password</label>
                  <input
                    type="password"
                    placeholder="16-character App Password"
                    value={configForm.smtp_password || ""}
                    onChange={(e) => setConfigForm({ ...configForm, smtp_password: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs flex items-center gap-1.5"
                >
                  {savingConfig ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: OUTBOX & SENT EMAILS AUDIT */}
      {showSentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Dispatched Emails Outbox</h3>
                  <p className="text-[11px] text-slate-500">Every notification email generated by the platform</p>
                </div>
              </div>
              <button
                onClick={() => setShowSentModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-100">
              {sentEmails.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No emails dispatched yet. Trigger an action (like raising a ticket or marking solved) to see emails here.
                </div>
              ) : (
                sentEmails.map((em, idx) => (
                  <div key={idx} className="pt-2 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900 block">{em.subject}</span>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>To: <strong className="text-slate-700">{em.to_email}</strong></span>
                        <span>&bull;</span>
                        <span className="text-emerald-600 font-semibold">{em.delivery_method}</span>
                      </div>
                    </div>

                    {em.html_url && (
                      <a
                        href={`${UPLOADS_BASE}${em.html_url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 font-bold text-[11px] transition-colors flex items-center gap-1 shrink-0"
                      >
                        <span>Preview HTML</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowSentModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
