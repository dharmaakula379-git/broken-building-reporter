@echo off
cd /d "%~dp0frontend"
echo ========================================================
echo Starting Broken Building Reporter - Frontend (Vite)
echo ========================================================
call npm.cmd run dev
pause
