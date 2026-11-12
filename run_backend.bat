@echo off
cd /d "%~dp0backend"
echo ========================================================
echo Starting Broken Building Reporter - Backend Server (FastAPI)
echo http://127.0.0.1:8000
echo ========================================================
"%~dp0backend\.venv\Scripts\python.exe" -m uvicorn app.main:app --reload --port 8000
pause
