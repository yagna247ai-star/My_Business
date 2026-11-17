#!/bin/bash
# Deploy Hermes Agent to OCI opc@140.245.194.223 — run from your Mac (outside sandbox)
# Usage: chmod +x deploy_hermes_oci.sh && ./deploy_hermes_oci.sh
set -e
KEY=~/Downloads/ssh-key-2026-08-18.key
HOST=opc@140.245.194.223
REMOTE_DIR=/home/opc/hermes_automation
SRC_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==> Checking SSH key..."
ls -l "$KEY"
chmod 600 "$KEY"

echo "==> Testing SSH connectivity..."
ssh -i "$KEY" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15 "$HOST" "uname -a; pwd; cat /etc/os-release | head -5"

echo "==> Copying hermes_automation to $HOST:$REMOTE_DIR ..."
# Use tar to preserve permissions and avoid scp issues with spaces
tar -czf /tmp/hermes_automation.tgz -C "$(dirname "$SRC_DIR")" hermes_automation --exclude="__pycache__" --exclude=".venv" --exclude=".pytest_cache"
scp -i "$KEY" /tmp/hermes_automation.tgz "$HOST:/tmp/"
ssh -i "$KEY" "$HOST" "mkdir -p $REMOTE_DIR && tar -xzf /tmp/hermes_automation.tgz -C /home/opc && rm /tmp/hermes_automation.tgz && ls -lh $REMOTE_DIR"

echo "==> Setting up Python env on remote..."
ssh -i "$KEY" "$HOST" bash -s <<'REMOTE'
set -e
cd /home/opc/hermes_automation
if ! command -v uv >/dev/null 2>&1; then
  echo "Installing uv..."
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.cargo/bin:$PATH"
fi
export PATH="$HOME/.cargo/bin:$PATH"
uv venv --force || python3 -m venv .venv
source .venv/bin/activate || true
uv pip install -r requirements.txt || pip install -r requirements.txt
cp -n .env.example .env || true
echo "Env template ready at .env — EDIT IT:"
cat .env
echo ""
echo "Testing agent load..."
uv run python -c "from main import HermesRealEstateAgent; a=HermesRealEstateAgent(); print('Hermes agent loaded OK')" || python -c "from main import HermesRealEstateAgent; a=HermesRealEstateAgent(); print('Hermes agent loaded OK')"
REMOTE

echo "==> Installing systemd user service..."
scp -i "$KEY" "$SRC_DIR/hermes.service" "$HOST:/tmp/hermes.service"
ssh -i "$KEY" "$HOST" bash -s <<'REMOTE'
mkdir -p ~/.config/systemd/user
cp /tmp/hermes.service ~/.config/systemd/user/hermes.service
systemctl --user daemon-reload
systemctl --user enable hermes
systemctl --user restart hermes
sleep 2
systemctl --user status hermes --no-pager -l | head -n 50
journalctl --user -u hermes -n 30 --no-pager || true
REMOTE

echo "==> Done. Check: ssh -i $KEY $HOST 'systemctl --user status hermes; journalctl --user -u hermes -n 50 -f'"
