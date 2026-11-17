#!/bin/bash
# Deploy Bangi-Agent (lightweight Hermes-extended) to OCI — uv based
# Full path: /Users/apple/Documents/My_Business/BANGI_Agent
# Usage: chmod +x deploy_bangi_oci.sh && ./deploy_bangi_oci.sh
set -e
KEY=~/Downloads/ssh-key-2026-08-18.key
HOST=opc@140.245.194.223
REMOTE_DIR=/home/opc/BANGI_Agent
SRC_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==> Bangi lightweight Hermes-extended — checking key"
ls -l "$KEY"; chmod 600 "$KEY"
ssh -i "$KEY" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15 "$HOST" "uname -a; echo ---; ls -la ~ | head -20"

echo "==> Copying Bangi + Hermes deps (uv) to $HOST:$REMOTE_DIR"
# Include Bangi + needed Hermes (memory/skills) but not .venv
tar -czf /tmp/bangi_deploy.tgz -C "$(dirname "$SRC_DIR")" BANGI_Agent RealEstate/hermes_automation --exclude="__pycache__" --exclude=".venv" --exclude=".pytest_cache" --exclude="*.pyc"
scp -i "$KEY" -o StrictHostKeyChecking=accept-new /tmp/bangi_deploy.tgz "$HOST:/tmp/"
ssh -i "$KEY" "$HOST" "mkdir -p $REMOTE_DIR && tar -xzf /tmp/bangi_deploy.tgz -C /home/opc && rm /tmp/bangi_deploy.tgz && ls -lh $REMOTE_DIR | head -20; ls -lh ~/RealEstate/hermes_automation | head -20"

echo "==> Remote setup uv lightweight"
ssh -i "$KEY" "$HOST" bash -s <<'REMOTE'
set -e
export PATH="$HOME/.cargo/bin:$PATH"
if ! command -v uv >/dev/null 2>&1; then curl -LsSf https://astral.sh/uv/install.sh | sh; export PATH="$HOME/.cargo/bin:$PATH"; fi
cd /home/opc/BANGI_Agent
uv sync --extra computer-use 2>&1 | tail -20 || uv sync 2>&1 | tail -20
# also sync Hermes deps (fallback)
if [ -f ../RealEstate/hermes_automation/requirements.txt ]; then uv pip install -r ../RealEstate/hermes_automation/requirements.txt 2>&1 | tail -10; fi
cp -n .env.example .env 2>/dev/null || true
cp -n config.yaml config.yaml 2>/dev/null || true
echo "--- Bangi capabilities test ---"
uv run python -c "from backend.bangi_agent import BangiAgent; b=BangiAgent(); print('Bangi:', b.capabilities); print(b.do_task('check CRM lead status')['output'][:800])" 2>&1 | head -40
REMOTE

echo "==> Installing systemd user service (lightweight)"
scp -i "$KEY" -o StrictHostKeyChecking=accept-new "$SRC_DIR/bangi.service" "$HOST:/tmp/bangi.service"
ssh -i "$KEY" "$HOST" bash -s <<'REMOTE'
mkdir -p ~/.config/systemd/user
cp /tmp/bangi.service ~/.config/systemd/user/bangi.service
systemctl --user daemon-reload
systemctl --user enable bangi
systemctl --user restart bangi
sleep 2
systemctl --user status bangi --no-pager -l | head -n 50
journalctl --user -u bangi -n 30 --no-pager | head -n 30
REMOTE

echo "==> Done — Bangi lightweight on $HOST"
echo "Check: ssh -i $KEY $HOST 'systemctl --user status bangi; journalctl --user -u bangi -n 50 -f'"
echo "GUI: ssh -i $KEY -L 8000:localhost:8000 $HOST 'cd ~/BANGI_Agent && uv run python -m backend.app'  # then open http://localhost:8000/static/index.html"
