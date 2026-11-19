# 07 — File uploads, antivirus scanning, and storage

**Status:** partly closed (2026-11-19). Image uploads work in production. PDF and video uploads stay refused until a virus scanner is attached.

## Decision (2026-11-19)

- **Storage:** Vercel Blob, private store `aihub-uploads`, region `iad1` (same US-East region as the Neon database). It is connected to the project for Production, Preview and Development, which sets `BLOB_READ_WRITE_TOKEN`.
- **Scanning:** no scanner for now. Images (PNG, JPEG, WebP, GIF) are accepted without one. Everything else needs a scanner.
- **Why images are safe enough without a scanner:** every image is checked byte by byte to be a real file of the type it claims. Stored images are only ever served with their stored image `Content-Type`, `X-Content-Type-Options: nosniff`, and a sandbox CSP, so a disguised file cannot run in the browser.

## Current behaviour

Rules live in `apps/web/lib/domain/uploadPolicy.ts` (pure, unit-tested in `test/journey-access-upload.test.ts`). They are applied in `apps/web/lib/domain/files.ts`.

| Situation | Images | PDF / video |
|---|---|---|
| `CLAMAV_HOST` set | Scanned | Scanned |
| Production, no scanner | Accepted, recorded as `avStatus = 'validated'` | Refused: "PDF and video uploads need virus scanning, which is not set up yet." |
| Local development, no scanner | Accepted, `avStatus = 'skipped'` | Accepted, `avStatus = 'skipped'` |

Storage driver (`storageDriver()`):

- `STORAGE_DRIVER` set: `blob` or `local`. Any other value is refused.
- Not set: `blob` if `BLOB_STORE_ID` or `BLOB_READ_WRITE_TOKEN` exists, otherwise `local`.
- **`local` is refused in production**, because Vercel functions have no lasting, shared disk.
- Blob files are stored private, under the same key as the file row, and recorded with bucket `vercel-blob`. Downloads go through `/api/v1/files/[fileId]`, which checks access before streaming the file.

Serving (`servable()`): files marked `infected` or `pending` are never served. `validated` files are served only if they are images. In production, older `skipped` files are not served.

## Still open

- No virus scanner, so PDF and video proofs cannot be uploaded in production.
- Data residency: the Blob store is in US-East, not India. Revisit if data must stay in ap-south-1.

## Steps to close the rest

1. Run a ClamAV server reachable from Vercel (a small VM, about $5–10/month). Set `CLAMAV_HOST` and `CLAMAV_PORT` on Production, then redeploy.
2. Upload a clean PDF and confirm it is stored and downloadable. Upload the EICAR test file and confirm it is refused.

## How to check it works

1. Sign in on production, go to **Settings**, upload a profile picture. It should save and show after a page reload.
2. Try a PDF on a level's proof upload. It should show the "needs virus scanning" message, not a generic error.
