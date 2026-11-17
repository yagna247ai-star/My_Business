# 07 — File uploads, antivirus scanning, and storage

**Status:** uploads are refused in production, which is the intended safe behaviour until a scanner is attached.

## Current state

- `apps/web/lib/domain/files.ts`:
  - Validates type, size (MAX_BYTES), extension, and real image signatures.
  - `scanBytes()` uses ClamAV over TCP when `CLAMAV_HOST` is set. A scanner error fails closed (`infected`).
  - In production without a scanner, `scanBytes` throws `notConfigured('av', …)` (line 62). Uploads are disabled.
  - Storage driver defaults to `local` (`STORAGE_DRIVER || 'local'`). The file header says S3 is used when `STORAGE_DRIVER=s3` with credentials.
- Production has no `CLAMAV_*`, `S3_*`, or `STORAGE_*` variables.
- `.env` has `S3_BUCKET` and `S3_REGION` values, but no S3 credentials.

## Gap

- No antivirus scanner. Learner screenshot and proof uploads are refused on production, so learners cannot submit file proofs.
- Storage on Vercel: a `local` driver writes to the function's filesystem, which is ephemeral and not shared between instances. Uploads would be lost. The S3 path needs credentials and must be verified.
- The storage path needs verifying in code: confirm that `local` is refused in production as well as the scanner. Check `files.ts` around line 81 before relying on it.

## Risk

- Medium: learners cannot upload proofs until this is fixed. If storage is misconfigured, uploads could appear to succeed and then disappear.

## Decision needed

- Scanner: self-hosted ClamAV (needs a server, e.g. on AWS ap-south-1), or a managed scanning service.
- Storage: S3 in ap-south-1 (matches the data-residency plan) or Cloudflare R2.

## Steps to close

1. Provision object storage and set `STORAGE_DRIVER=s3`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and `S3_ENDPOINT` (if R2) on Vercel Production.
2. Provision a ClamAV host reachable from Vercel, set `CLAMAV_HOST` and `CLAMAV_PORT`.
3. Upload a clean test image and confirm it is stored and downloadable. Upload an EICAR test file and confirm it is refused.
4. Confirm `local` storage is refused in production. Add an explicit check if it is not.
