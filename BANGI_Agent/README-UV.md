# Bangi — uv-based project
**Full path:** `/Users/apple/Documents/My_Business/BANGI_Agent`

## uv quickstart (replaces pip/venv)
```bash
# 1. Install uv (if needed)
curl -LsSf https://astral.sh/uv/install.sh | sh
# or brew install uv

# 2. From project root — sync deps (creates .venv automatically)
cd /Users/apple/Documents/My_Business/BANGI_Agent
uv sync                    # uses pyproject.toml + .python-version (3.11)
uv sync --extra dev        # + pytest/ruff
uv sync --extra computer-use  # + mcp/starlette for cua-driver

# 3. Run
uv run bangi-backend       # → http://localhost:8000  (FastAPI)
uv run python backend/app.py
uv run uvicorn backend.app:app --reload --port 8000

# 4. Frontend (still static)
open frontend/index.html
# or via backend static mount: http://localhost:8000/static/index.html
```

## uv commands
```bash
uv add fastapi requests          # add dep
uv add --dev pytest
uv run pytest
uv run ruff check .
uv lock --upgrade
uv sync --frozen  # CI
```

## Structure (uv managed)
```
BANGI_Agent/
├── pyproject.toml      # ← project + deps (uv)
├── .python-version     # 3.11
├── uv.lock             # generated after `uv sync` (commit it)
├── .venv/              # auto-created by uv sync
├── backend/app.py      # bangi entry
├── frontend/index.html
├── config.yaml
└── ...
```

## Backend entry
`pyproject.toml [project.scripts] bangi = "backend.app:main"` — `uv run bangi` works after you add `def main(): uvicorn.run(...)` (already in app.py `if __name__=="__main__"`).

Full path again: `/Users/apple/Documents/My_Business/BANGI_Agent`
