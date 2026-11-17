#!/bin/bash
set -e
BASE_GW="${BANGI_GW:-http://localhost:8001}"
BASE_BE="${BANGI_BE:-http://localhost:8000}"
echo "=== Bangi MVP Smoke — $BASE_GW + $BASE_BE ==="
echo "1. Health"
curl -s "$BASE_GW/health" | python3 -m json.tool | head -n 15
curl -s "$BASE_BE/health" | python3 -m json.tool | head -n 15
echo "2. Hermes direct (no SOM)"
curl -s "$BASE_GW/api/hermes/report" | python3 -m json.tool | head -n 20
echo "3. Hybrid router — CRM"
curl -s -X POST "$BASE_GW/api/task" -H "Content-Type: application/json" -d '{"prompt":"check CRM lead status"}' | python3 -m json.tool | head -n 20
echo "4. Hybrid router — Campaign"
curl -s -X POST "$BASE_GW/api/task" -H "Content-Type: application/json" -d '{"prompt":"generate campaign for shankarpally"}' | python3 -m json.tool | head -n 20
echo "5. WebSocket (require wscat or websocat — optional)"
echo "   wscat -c ws://localhost:8001/ws  → send {\"prompt\":\"check CRM lead status\"}"
echo "=== Smoke done — open http://localhost:3000 and http://localhost:8001/docs ==="
