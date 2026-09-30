@echo off
title CSHP SafetyHub Launcher
echo ===================================================
echo   CSHP SafetyHub - Construction Safety Management
echo ===================================================
echo Starting local server on http://localhost:8080 ...
start "" "http://localhost:8080"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1" -Port 8080
pause
