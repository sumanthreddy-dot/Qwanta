@echo off
title QWANTA - Maritime Fleet Optimization Platform
echo ======================================================================
echo           QWANTA - Quantum-Inspired Fleet Optimization
echo                     Problem SIH26138 - Egreen Quanta
echo ======================================================================
echo.

cd /d "%~dp0"

:: 1. Check Python Virtual Environment
if not exist ".venv\Scripts\python.exe" (
    echo [*] Creating Python virtual environment...
    python -m venv .venv
    echo [*] Installing backend dependencies...
    .venv\Scripts\pip.exe install -r backend\requirements.txt
)

:: 2. Check Models and Preprocessor
if not exist "models\trained_models.joblib" (
    echo [*] Generating synthetic operational data and training 5 ML models...
    .venv\Scripts\python.exe scripts\train_models.py
)

:: 3. Check Frontend Dependencies
if not exist "frontend\node_modules" (
    echo [*] Installing frontend npm packages...
    cd frontend
    call npm install
    cd ..
)

echo.
echo [*] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "QWANTA - Backend API" cmd /k ".venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [*] Starting Vite Frontend Dashboard on http://localhost:5173 ...
cd frontend
start "QWANTA - Frontend Dashboard" cmd /k "npm run dev"
cd ..

timeout /t 2 /nobreak >nul
echo [*] Opening QWANTA Dashboard in default browser...
start http://localhost:5173

echo.
echo ======================================================================
echo QWANTA is now operational!
echo Backend API Docs:   http://127.0.0.1:8000/docs
echo Web Dashboard:      http://localhost:5173
echo ======================================================================
pause
