# Bangi MVP — Production Dockerfile (Gateway + Backend + Next.js static)
# Single image: Python backend + gateway + Next.js standalone server
FROM python:3.11-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 UV_CACHE_DIR=/tmp/uv-cache
RUN apt-get update && apt-get install -y --no-install-recommends curl nodejs npm && rm -rf /var/lib/apt/lists/*
# Install uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.cargo/bin:$PATH"
WORKDIR /app

# Python deps (cached)
COPY pyproject.toml uv.lock* ./
COPY backend ./backend
COPY gateway ./gateway
COPY config.yaml ./
RUN uv sync --frozen 2>&1 | tail -5 || uv sync 2>&1 | tail -5

# Next.js build (if node_modules missing, install)
COPY apps/web ./apps/web
RUN npm --prefix apps/web --cache /tmp/npm-cache install --production=false 2>&1 | tail -5 && npm --prefix apps/web run build 2>&1 | tail -10

# Copy the rest (Hermes skills are mounted or copied at deploy — not baked into slim image)
COPY .env.example ./.env.example
COPY frontend ./frontend
COPY config ./config 2>/dev/null || true
COPY RealEstate/hermes_automation ./RealEstate/hermes_automation 2>/dev/null || echo "Hermes not in image — mount at /app/RealEstate/hermes_automation"

EXPOSE 8000 8001 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8001/health').read()"

CMD ["sh","-c","uv run bangi & uv run gateway & npm --prefix apps/web start & wait"]
