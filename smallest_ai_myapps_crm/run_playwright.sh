#!/bin/bash

# Playwright Automation Runner Script for Smallest AI × MyAppz CRM Ecosystem

echo "============================================================"
echo "  🎭 Running Playwright End-to-End Automation Suite         "
echo "============================================================"

# Navigate to backend directory
CDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$CDIR/backend" || exit 1

# Execute Playwright Pytest test suite using virtual environment
echo "🚀 Executing Playwright E2E Tests..."
uv run pytest tests/e2e/test_playwright_e2e.py -v -s --durations=0

TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo ""
  echo "============================================================"
  echo "  ✅ Playwright Automation Suite Completed Successfully!   "
  echo "============================================================"
else
  echo ""
  echo "============================================================"
  echo "  ❌ Playwright Tests Failed with Exit Code: $TEST_EXIT_CODE "
  echo "============================================================"
  exit $TEST_EXIT_CODE
fi
