@echo off
title Broken Building Reporter - Launcher
echo ========================================================
echo   Broken Building Reporter 2.0 - Starting Application
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "BBR Backend (FastAPI)" cmd /k "cd /d %~dp0backend && .venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/3] Starting React Vite Frontend on http://localhost:5173 ...
start "BBR Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm.cmd run dev"

echo [3/3] Opening Browser in 4 seconds...
timeout /t 4 /nobreak >nul
start http://localhost:5173

echo.
echo ========================================================
echo   Application is now running!
echo   - Local Frontend: http://localhost:5173
echo   - Local Backend:  http://127.0.0.1:8000
echo ========================================================
echo Keep this terminal open or minimize it during presentation.
pause
