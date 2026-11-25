/**
 * Pure link rules for docs/SHOWCASE_LINK_HEALTH_SPEC.md. Why Drive links "do not open":
 * account-index links (/u/1/, authuser) open only for their owner, personal Drive views are not shareable,
 * and a check that treats "could not tell" as "fine" lets private links through.
 */
export type LinkStatus = 'open' | 'private' | 'broken' | 'unknown';

const GOOGLE = /(^|\.)google\.com$/;

/** Remove the per-viewer account index (/u/N/, authuser) from Google links. Keeps resourcekey and the hash. */
export function normaliseShareUrl(raw: string): string {
  let u: URL;
  try { u = new URL(raw.trim()); } catch { return raw; }
  if (!GOOGLE.test(u.hostname.toLowerCase())) return u.toString() === raw.trim() ? raw.trim() : u.toString();
  u.pathname = u.pathname.replace(/\/u\/\d+(?=\/)/, '');
  u.searchParams.delete('authuser');
  let s = u.toString();
  if (!u.searchParams.toString()) s = s.replace('?', ''); // URL keeps a bare "?" when the last param goes
  return s;
}

/** drive.google.com/drive/my-drive, /recent, /home … are the owner's own views, never a shared item. */
export function personalDriveView(raw: string): boolean {
  let u: URL;
  try { u = new URL(raw); } catch { return false; }
  if (u.hostname.toLowerCase() !== 'drive.google.com') return false;
  const p = u.pathname.replace(/\/u\/\d+(?=\/)/, '').replace(/\/+$/, '');
  return /^\/drive\/(my-drive|recent|home|shared-with-me|starred|trash|computers|search|shared-drives|quota)(\/|$)/.test(p) || p === '/drive' || p === '';
}

const PRIVATE_TEXT = /You need access|Request access|ServiceLogin|Sign in to continue|You need permission|This item might not exist or is no longer available/i;
const BLOCKED_TEXT = /unusual traffic|consent\.google\.com|Before you continue to Google|captcha/i;
const LOGIN = /(^|\.)(accounts\.google\.com|login\.microsoftonline\.com|login\.live\.com|login\.windows\.net)$|\/ServiceLogin|\/signin|\/login\b/i;

/** One HTTP answer → open / private / broken / unknown. "Could not tell" is unknown, never open. */
export function classifyResponse(status: number, location: string | null, body: string): LinkStatus {
  if (status >= 300 && status < 400) {
    if (!location) return 'unknown';
    try { const l = new URL(location, 'https://x.invalid'); if (LOGIN.test(l.hostname) || LOGIN.test(l.pathname)) return 'private'; } catch { /* fall through */ }
    return 'unknown';
  }
  if (status === 401 || status === 403) return 'private';
  if (status === 404 || status === 410) return 'broken';
  if (status !== 200) return 'unknown';
  if (BLOCKED_TEXT.test(body)) return 'unknown';
  return PRIVATE_TEXT.test(body) ? 'private' : 'open';
}
