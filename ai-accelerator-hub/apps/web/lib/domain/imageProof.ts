/**
 * Screenshot validation (docs/AGENT_LAB_PROOF_SCORING_SPEC.md §3). Pure: reads only the bytes given.
 * Detects the real image type from its signature and reads width/height from the header.
 */
import { createHash } from 'crypto';

export type ImageInfo = { type: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif'; width: number; height: number };
export { MIN_W, MIN_H } from './proofScore';

export function sha256(bytes: Buffer) { return createHash('sha256').update(bytes).digest('hex'); }

/** Returns the real type and dimensions, or null if the bytes are not a PNG, JPEG or WebP image. */
export function readImage(b: Buffer): ImageInfo | null {
  // PNG: 89 50 4E 47 0D 0A 1A 0A, then IHDR chunk: width/height big-endian at 16/20.
  if (b.length >= 24 && b.readUInt32BE(0) === 0x89504e47 && b.readUInt32BE(4) === 0x0d0a1a0a && b.toString('ascii', 12, 16) === 'IHDR')
    return dims('image/png', b.readUInt32BE(16), b.readUInt32BE(20));
  // JPEG: FF D8, then walk markers to a Start-Of-Frame (C0–C3, C5–C7, C9–CB, CD–CF).
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
      const len = b.readUInt16BE(i + 2);
      if ((m >= 0xc0 && m <= 0xcf) && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return dims('image/jpeg', b.readUInt16BE(i + 7), b.readUInt16BE(i + 5));
      if (len < 2) return null;
      i += 2 + len;
    }
    return null;
  }
  // GIF: GIF87a / GIF89a, logical screen width/height little-endian at 6/8.
  if (b.length >= 10 && (b.toString('ascii', 0, 6) === 'GIF87a' || b.toString('ascii', 0, 6) === 'GIF89a')) return dims('image/gif', b.readUInt16LE(6), b.readUInt16LE(8));
  // WebP: RIFF....WEBP, then VP8 / VP8L / VP8X.
  if (b.length >= 30 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = b.toString('ascii', 12, 16);
    if (chunk === 'VP8 ' && b[23] === 0x9d && b[24] === 0x01 && b[25] === 0x2a) return dims('image/webp', b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff);
    if (chunk === 'VP8L' && b[20] === 0x2f) { const v = b.readUInt32LE(21); return dims('image/webp', (v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1); }
    if (chunk === 'VP8X') return dims('image/webp', 1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3));
  }
  return null;
}
const dims = (type: ImageInfo['type'], width: number, height: number): ImageInfo | null => (width > 0 && height > 0 ? { type, width, height } : null);
