/**
 * Learners' GitHub OAuth tokens at rest: AES-256-GCM with a random 12-byte IV (docs/SHOWCASE_GITHUB_SPEC.md §3.9).
 * Key: GITHUB_TOKEN_KEY (32 bytes, base64). Format: v1.<iv>.<tag>.<ciphertext>, each base64url.
 */
import crypto from 'node:crypto';

function keyOf(b64?: string): Buffer {
  const raw = b64 ?? process.env.GITHUB_TOKEN_KEY;
  if (!raw) throw new Error('GITHUB_TOKEN_KEY is not set.');
  const k = Buffer.from(raw, 'base64');
  if (k.length !== 32) throw new Error('GITHUB_TOKEN_KEY must be 32 bytes, base64-encoded.');
  return k;
}

export function encryptToken(plain: string, keyB64?: string): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', keyOf(keyB64), iv);
  const data = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return ['v1', iv.toString('base64url'), c.getAuthTag().toString('base64url'), data.toString('base64url')].join('.');
}

export function decryptToken(enc: string, keyB64?: string): string {
  const [v, iv, tag, data] = enc.split('.');
  if (v !== 'v1' || !iv || !tag || !data) throw new Error('Unreadable token.');
  const d = crypto.createDecipheriv('aes-256-gcm', keyOf(keyB64), Buffer.from(iv, 'base64url'));
  d.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([d.update(Buffer.from(data, 'base64url')), d.final()]).toString('utf8');
}

export const tokenKeyConfigured = () => { try { keyOf(); return true; } catch { return false; } };
