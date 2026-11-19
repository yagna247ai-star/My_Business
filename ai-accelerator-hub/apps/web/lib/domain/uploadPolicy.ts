/**
 * Upload safety rules, kept pure so they can be unit-tested.
 *
 * With a virus scanner (CLAMAV_HOST): every file is scanned.
 * Without one, in production: images are accepted as 'validated', because uploadFile has already checked
 * that the bytes really are a PNG/JPEG/WebP/GIF of the claimed type, and they are only ever served with
 * their stored image Content-Type, `nosniff` and a sandbox CSP. PDFs and video carry far more risk and
 * stay refused until a scanner is attached. (Decision recorded in docs/enterprise-gaps/07.)
 * Without one, outside production: 'skipped' (local development).
 */
export const SAFE_IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;
export const isSafeImageMime = (mime: string) => (SAFE_IMAGE_MIMES as readonly string[]).includes(mime);

export type ScanPlan = 'scan' | 'validated' | 'skipped' | 'refuse';

export function scanPlan(a: { hasScanner: boolean; production: boolean; mime: string }): ScanPlan {
  if (a.hasScanner) return 'scan';
  if (!a.production) return 'skipped';
  return isSafeImageMime(a.mime) ? 'validated' : 'refuse';
}

/** May a stored file with this scan status be served? */
export function servable(a: { avStatus: string; mime: string; production: boolean }): { ok: true } | { ok: false; reason: string } {
  if (a.avStatus === 'infected') return { ok: false, reason: 'This file is quarantined.' };
  if (a.avStatus === 'pending') return { ok: false, reason: 'This file is still being scanned.' };
  if (a.avStatus === 'validated' && !isSafeImageMime(a.mime)) return { ok: false, reason: 'This file was not scanned.' };
  if (a.avStatus === 'skipped' && a.production) return { ok: false, reason: 'This file predates virus scanning.' };
  return { ok: true };
}

export type StorageDriver = 'blob' | 'local';

/** Vercel Blob when configured (BLOB_STORE_ID via OIDC, or BLOB_READ_WRITE_TOKEN), otherwise local disk. */
export function storageDriver(env: Record<string, string | undefined>): StorageDriver | 'unsupported' {
  const explicit = env.STORAGE_DRIVER?.trim().toLowerCase();
  if (explicit) return explicit === 'blob' || explicit === 'local' ? explicit : 'unsupported';
  return env.BLOB_STORE_ID || env.BLOB_READ_WRITE_TOKEN ? 'blob' : 'local';
}
