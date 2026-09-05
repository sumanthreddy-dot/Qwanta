#!/usr/bin/env bash
set -e

echo "======================================================================"
echo "          QWANTA - Quantum-Inspired Fleet Optimization"
echo "                    Problem SIH26138 - Egreen Quanta"
echo "======================================================================"

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# 1. Check Python virtual environment
if [ ! -f ".venv/bin/python" ]; then
    echo "[*] Creating Python virtual environment..."
    python3 -m venv .venv
    echo "[*] Installing backend requirements..."
    .venv/bin/pip install -r backend/requirements.txt
fi

# 2. Check Models
if [ ! -f "models/trained_models.joblib" ]; then
    echo "[*] Training regression models and generating dataset..."
    .venv/bin/python scripts/train_models.py
fi

# 3. Check Frontend
if [ ! -d "frontend/node_modules" ]; then
    echo "[*] Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

echo "[*] Launching Backend API on http://127.0.0.1:8000 ..."
.venv/bin/python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

sleep 3

echo "[*] Launching Frontend Dashboard on http://localhost:5173 ..."
cd frontend && npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

echo "Platform running. Press Ctrl+C to stop."
wait
