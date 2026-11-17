# Bangi Web — Next.js 14 (App Router)

**Port 3000** → proxies `/api/*` → Gateway `:8001` → Backend `:8000`.

## Run

```bash
cd BANGI_Agent/apps/web
npm install
npm run dev   # http://localhost:3000
# gateway must be running: cd ../.. && uv run gateway  (port 8001)
# backend: uv run bangi (port 8000) — gateway in-process also works alone
```

## Stack

- Next.js 14 App Router + TypeScript + Tailwind 3.4
- `lib/api.ts` — same `/api/*` surface as Flutter (gateway unified)
- `components/DesktopPreview.tsx` — SOM overlay mock [1][2][3]
- `components/TaskBar.tsx` — WS `/ws` streaming + REST fallback
- `app/page.tsx` — Jobs + CRM + live log, all via Gateway

## Env

- `NEXT_PUBLIC_GATEWAY_URL` — default `""` (same origin via `next.config.js` rewrites). Set to `http://localhost:8001` to call gateway directly.

## Build

```bash
npm run build && npm start  # prod
# or static export for gateway serve (uncomment output:"export" in next.config.js)
```
