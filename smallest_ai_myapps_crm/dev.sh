#!/bin/bash

echo "============================================================"
echo " Starting Smallest AI & MyApps CRM Ecosystem "
echo "============================================================"

# Navigate to script directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

echo "[1/2] Launching uv FastAPI Gateway on http://localhost:8000..."
cd "$DIR/backend"
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo "[2/2] Launching Angular 20 Frontend UI on http://localhost:4200..."
cd "$DIR/frontend"
npm start -- --port 4200 &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

echo ""
echo "🔥 System Ready!"
echo "   - Angular UI: http://localhost:4200"
echo "   - FastAPI Gateway Docs: http://localhost:8000/docs"
echo "Press Ctrl+C to stop all servers."

wait
