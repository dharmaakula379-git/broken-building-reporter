@echo off
echo ========================================================
echo Launching Broken Building Reporter Full Stack App
echo ========================================================

:: 1. Start Backend in a separate window
start "Broken Building Reporter - Backend (FastAPI)" cmd /k "cd /d "%~dp0backend" && "%~dp0backend\.venv\Scripts\python.exe" -m uvicorn app.main:app --reload --port 8000"

:: 2. Wait 2 seconds
timeout /t 2 /nobreak >nul

:: 3. Start Frontend in a separate window
start "Broken Building Reporter - Frontend (React + Vite)" cmd /k "cd /d "%~dp0frontend" && npm.cmd run dev"

:: 4. Wait 3 seconds and open browser
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo ========================================================
echo Both servers have been launched!
echo - Frontend: http://localhost:5173
echo - Backend:  http://127.0.0.1:8000
echo - Swagger:  http://127.0.0.1:8000/docs
echo ========================================================
