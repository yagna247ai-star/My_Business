# Bangi Flutter — Android / iOS / macOS / Windows / Web

Same Gateway API as Next.js web: `POST /api/task {prompt}` → Gateway :8001 → Backend :8000 (Hermes hybrid).

## Prereqs
- Flutter 3.16+ (if not installed, Next.js web works standalone — see below)
- Gateway running: `cd BANGI_Agent && uv run gateway` (port 8001)

## Install (when Flutter is available)
```bash
cd BANGI_Agent/apps/flutter_app
flutter pub get
# Android/iOS
flutter run
# macOS/Windows
flutter run -d macos   # or windows
# Web (via Flutter web)
flutter run -d chrome --web-port 5000
```

## Without Flutter (CI / sandbox)
This project is fully documented; `lib/` contains the complete Dart app. To run without Flutter, use the Next.js web at `apps/web` (same API surface) or the legacy `frontend/index.html` via `uv run bangi -- /static/index.html`.

## Configure gateway URL
- Default: `http://10.0.2.2:8001` (Android emulator) or `http://localhost:8001` (iOS/macOS/web)
- Settings screen → Gateway URL → Save (persisted via `shared_preferences`)

## Features
- Antigravity theme (ink #070A12, gold #C9A86A)
- Task input → `/api/task` + WebSocket `/ws` streaming
- Live desktop SOM preview (numbered overlays [1][2][3])
- CRM / Jobs quick actions
- Health check + report

## Build
```bash
flutter build apk --release
flutter build ios --release
flutter build macos --release
flutter build web --release
```
