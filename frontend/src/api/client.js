const API_BASE = "http://127.0.0.1:8000/api";
export const UPLOADS_BASE = "http://127.0.0.1:8000";

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = options.headers || {};
  
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = "API Request Failed";
    try {
      const errData = await response.json();
      errorMsg = errData.detail || JSON.stringify(errData);
    } catch {
      errorMsg = await response.text();
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Health
  getHealth: () => request("/health"),

  // Dashboard & Analytics
  getDashboard: () => request("/dashboard"),
  getAnalytics: () => request("/analytics"),

  // Reports
  getReports: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status && params.status !== "All") query.append("status", params.status);
    if (params.severity && params.severity !== "All") query.append("severity", params.severity);
    if (params.search) query.append("search", params.search);
    const qs = query.toString();
    return request(`/reports${qs ? `?${qs}` : ""}`);
  },
  getReport: (id) => request(`/reports/${id}`),
  createReport: (data) => request("/reports", {
    method: "POST",
    body: JSON.stringify(data)
  }),
  checkDuplicates: (data) => request("/reports/check-duplicate", {
    method: "POST",
    body: JSON.stringify(data)
  }),
  uploadReportImage: async (id, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return request(`/reports/${id}/image`, {
      method: "POST",
      body: formData
    });
  },
  analyzeReport: (id) => request(`/ai/analyze/${id}`, {
    method: "POST"
  }),
  updateReportStatus: (id, data) => request(`/reports/${id}/status`, {
    method: "PUT",
    body: JSON.stringify(data)
  }),
  submitRepairVerification: async (id, file, notes = "") => {
    const formData = new FormData();
    formData.append("file", file);
    return request(`/reports/${id}/repair?notes=${encodeURIComponent(notes)}`, {
      method: "POST",
      body: formData
    });
  },
  escalateReport: (id, data) => request(`/reports/${id}/escalate`, {
    method: "POST",
    body: JSON.stringify(data)
  }),

  // Buildings
  getBuildings: () => request("/buildings"),
  getBuilding: (id) => request(`/buildings/${id}`),

  // Authority Queues
  getEscalations: () => request("/escalations"),
  getInspections: () => request("/inspections"),

  // Notifications & Email Dispatch
  getNotifications: () => request("/notifications"),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: "PUT" }),
  markAllNotificationsRead: () => request("/notifications/mark-all-read", { method: "POST" }),
  getEmailSettings: () => request("/notifications/settings"),
  updateEmailSettings: (data) => request("/notifications/settings", { method: "PUT", body: JSON.stringify(data) }),
  sendTestEmail: (data) => request("/notifications/test-email", { method: "POST", body: JSON.stringify(data) }),
  getSentEmails: () => request("/notifications/sent-emails")
};
