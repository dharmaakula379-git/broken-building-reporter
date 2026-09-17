# Broken Building Reporter — Full Web App

A full-stack prototype for reporting, analyzing, tracking, and escalating visible building infrastructure issues.

## Stack
- Frontend: React + Vite + React Router + Leaflet
- Backend: FastAPI + SQLite + SQLAlchemy
- AI: Mock inference layer (ready to replace with YOLO/OpenCV)
- Authentication: Demo role switch for easy project presentation

## Features
- Citizen dashboard
- Building damage reporting with image upload
- AI-assisted damage analysis with confidence/severity
- Low-confidence "Inspection Required" handling
- Duplicate report detection
- Building profiles and damage history
- Safety map
- Report status timeline
- Repair verification
- Notifications
- Authority dashboard
- Authority verification/assignment
- Automatic escalation workflow
- Analytics cards and charts

## Run

### 1. Backend
Open a terminal in `backend`:

Windows:
```powershell
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

If `py` is unavailable, use `python`.

Backend:
http://127.0.0.1:8000

API docs:
http://127.0.0.1:8000/docs

### 2. Frontend
Open a second terminal in `frontend`:

```powershell
npm install
npm run dev
```

Frontend:
http://localhost:5173

If PowerShell blocks npm.ps1, use:
```powershell
npm.cmd install
npm.cmd run dev
```

## Demo accounts
The UI includes a role switcher in the top bar:
- Citizen
- Authority

No external database, API key, or government integration is required for the demo.

## AI limitation
The included AI service is intentionally a mock inference layer. It demonstrates the complete workflow without pretending that a photograph alone can certify structural safety. Low-confidence cases are sent to human inspection.

To replace the mock layer, edit:
`backend/app/services/ai_service.py`

and connect a trained YOLO/OpenCV pipeline.

## Important
This prototype is for reporting and prioritizing visible damage. Final structural safety decisions must be made by qualified professionals.
