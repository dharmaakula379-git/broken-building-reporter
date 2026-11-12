# Broken Building Reporter 2.0 — Full-Stack Civic Safety Web App

[![Live Web Application](https://img.shields.io/badge/Live%20App-broken--building--reporter.vercel.app-4f46e5?style=for-the-badge&logo=vercel&logoColor=white)](https://broken-building-reporter.vercel.app)
[![Backend API](https://img.shields.io/badge/Render%20API-Live%20Backend-000000?style=for-the-badge&logo=render&logoColor=white)](https://broken-building-reporter-api.onrender.com)
[![Swagger Docs](https://img.shields.io/badge/API%20Docs-Interactive%20Swagger-059669?style=for-the-badge&logo=fastapi&logoColor=white)](https://broken-building-reporter-api.onrender.com/docs)

> 🌐 **Live Web Application (Vercel)**: **[https://broken-building-reporter.vercel.app](https://broken-building-reporter.vercel.app)**  
> ⚡ **Cloud Backend API (Render)**: **[https://broken-building-reporter-api.onrender.com](https://broken-building-reporter-api.onrender.com)**  
> 📖 **Interactive API Documentation**: **[https://broken-building-reporter-api.onrender.com/docs](https://broken-building-reporter-api.onrender.com/docs)**

---

A production-ready full-stack civic safety platform for reporting, analyzing, tracking, and escalating visible building infrastructure hazards.

## Tech Stack
- **Frontend**: React 18 + Vite + React Router v6 + Leaflet & React Leaflet + Tailwind CSS + Lucide Icons
- **Backend**: FastAPI + SQLite + SQLAlchemy 2.0 + Pydantic v2
- **AI Vision Engine**: Ultralytics YOLO (`backend/app/best.pt`) with automated bounding box annotation and repair audit verification
- **Authentication**: Seamless demo role switcher (`Citizen` &harr; `Authority`) with persistent state

---

## Features

### Citizen Portal
- **Citizen Dashboard**: Live KPI statistics (Total Reports, High Priority, Under Inspection, Resolved), quick report CTA, recent incident table, and embedded interactive map.
- **Damage Reporting with Image Evidence**: Photographic upload with live image preview, damage category selection, description, and interactive map location picker.
- **Interactive Location Pin Drop**: Click anywhere on the Leaflet map to pinpoint coordinates or click **"Use My GPS"** for browser geolocation.
- **Real-Time Duplicate Detection**: Haversine spatial matching detects existing reports within 150m and alerts citizens with direct links to existing cases.
- **YOLO AI Vision Analysis**: Uses your exact `best.pt` model weights targeting trained classes:
  - `crack` (Wall cracks, Structural cracks, Plaster fractures)
  - `water_leakage` (Water seepage, Pipe leaks, Dampness)
  - `exposed_wire` (Exposed electrical wiring, Open junction boxes)
- **Bounding Box Annotation**: Draws color-coded bounding boxes with confidence scores onto an annotated image served directly to the user interface.
- **Low-Confidence "Inspection Required" Bypass**: Any detection under 60% confidence automatically routes to certified human engineers for on-site inspection.
- **Report Status Timeline**: 6-stage progressive stepper (`Reported` &rarr; `AI Verified` &rarr; `Assigned` &rarr; `Under Inspection` &rarr; `Repair Pending` &rarr; `Resolved`), timestamps, and full actor audit logs.
- **Before vs. After Repair Verification**: Upload a post-repair photograph; YOLO evaluates if the hazard is cleared and certifies case closure.
- **Building Profiles & Incident History**: Citywide asset directory with risk ratings (`High`, `Medium`, `Low`), risk trends (`Increasing`, `Stable`, `Decreasing`), and chronological historical logs.
- **Safety Risk Map**: Full interactive Leaflet OpenStreetMap with custom SVG colored pins, popup thumbnails, and category/severity filters.
- **Real-Time Notifications**: System notifications for escalations, inspection schedules, and repair updates with unread badge counter.

### Authority Portal
- **Command Center Dashboard**: Executive KPIs, high-priority triage queue, and active departmental caseload distribution bars.
- **Report Management Console**: Searchable report directory with inline modal to assign lead field engineers, departments, and directives.
- **Dedicated Inspection Queue**: Specialized view for human structural engineers to review low-confidence AI cases and foundation cracks.
- **4-Tier Escalation Hierarchy Ladder**:
  - *Level 1*: Ward Engineer (24h SLA)
  - *Level 2*: Department Head (48h SLA)
  - *Level 3*: Municipal Commissioner (72h SLA)
  - *Level 4*: State Urban Development Directorate
- **Live SLA Countdown**: Tracks hours remaining before SLA violation and flags overdue cases.
- **Municipal Safety Analytics**: Longitudinal monthly incident trends bar chart, hazard typology breakdown, and SLA compliance rate meter.

---

## Getting Started

### 1. Backend (FastAPI + YOLO + SQLite)
Open a terminal in `backend`:

```powershell
# Activate the virtual environment
.venv\Scripts\activate

# Launch the FastAPI server
uvicorn app.main:app --reload --port 8000
```

- Backend API: http://127.0.0.1:8000
- Interactive Swagger API Docs: http://127.0.0.1:8000/docs
- Uploaded & Annotated Images: http://127.0.0.1:8000/uploads

### 2. Frontend (React + Vite + Leaflet + Tailwind)
Open a second terminal in `frontend`:

```powershell
npm.cmd run dev
```

- Frontend App: http://localhost:5173

---

## Demo Credentials & Role Switcher
No external database or API key is required. 

Switch between **Citizen** and **Authority** portals anytime using the **Mode Switcher** in the top navigation bar or sidebar.
