/**
 * Uploads (§26, §28): validate first, scan second, serve only clean files.
 * Storage is Vercel Blob (private store) when configured, local disk in dev. Local disk is refused in
 * production: Vercel functions have no persistent, shared disk.
 * AV is ClamAV INSTREAM when CLAMAV_HOST is set. Without a scanner in production, signature-checked
 * images are accepted as 'validated' and everything else is refused (rules in ./uploadPolicy.ts).
 */
import { randomUUID } from 'crypto';
import { mkdir, writeFile, readFile as readFileBytes } from 'fs/promises';
import { join } from 'path';
import net from 'net';
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { hasPerm } from '@/lib/server/context';
import { badRequest, forbidden, notConfigured, notFound } from '@/lib/server/errors';
import { audit } from '@/lib/server/audit';
import { readImage, sha256 } from './imageProof';
import { scanPlan, servable, storageDriver } from './uploadPolicy';
import { put as blobPut, get as blobGet } from '@vercel/blob';

const ALLOW: Record<string, string[]> = {
  'image/png': ['png'], 'image/jpeg': ['jpg', 'jpeg'], 'image/webp': ['webp'], 'image/gif': ['gif'],
  'application/pdf': ['pdf'], 'video/mp4': ['mp4'], 'video/webm': ['webm'],
};
export const MAX_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 10 * 1024 * 1024);
export type AvVerdict = 'clean' | 'infected' | 'skipped' | 'validated';
export type Scanner = (bytes: Buffer) => Promise<AvVerdict> | AvVerdict;

const cleanName = (n: string) => n.split('/').pop()!.split('\\').pop()!.toLowerCase().replace(/[^a-z0-9._-]/g, '-').replace(/-+/g, '-').slice(0, 80) || 'file';
const extOf = (n: string) => { const i = n.lastIndexOf('.'); return i < 0 ? '' : n.slice(i + 1).toLowerCase(); };

export function validateUpload(filename: string, mime: string, size: number) {
  const exts = ALLOW[mime];
  if (!exts) throw badRequest(`Files of type ${mime} are not accepted (images, PDF, short video only).`);
  if (size <= 0 || size > MAX_BYTES) throw badRequest(`Files are capped at ${Math.round(MAX_BYTES / 1048576)}MB.`);
  const name = cleanName(filename);
  if (!exts.includes(extOf(name))) throw badRequest('File extension does not match its type.');
  return name;
}

function clamavScan(host: string, port: number, bytes: Buffer): Promise<AvVerdict> {
  return new Promise(resolve => {
    let done = false;
    const finish = (v: AvVerdict) => { if (!done) { done = true; resolve(v); } };
    const timer = setTimeout(() => { sock.destroy(); finish('infected'); }, 15000); // fail closed on timeout
    const sock = net.connect(port, host, () => {
      sock.write('zINSTREAM\0');
      for (let o = 0; o < bytes.length; o += 8192) {
        const c = bytes.subarray(o, o + 8192);
        const len = Buffer.alloc(4); len.writeUInt32BE(c.length, 0); sock.write(Buffer.concat([len, c]));
      }
      const end = Buffer.alloc(4); sock.write(end); sock.end();
    });
    let out = '';
    sock.on('data', d => { out += d.toString(); if (out.includes('OK')) { clearTimeout(timer); finish('clean'); } else if (out.includes('FOUND')) { clearTimeout(timer); finish('infected'); } });
    sock.on('error', () => { clearTimeout(timer); finish('infected'); }); // fail closed on scanner error
    sock.on('close', () => { clearTimeout(timer); finish('infected'); }); // fail closed on early close
  });
}

/** `mime` must already be validated (and for images, signature-checked) by the caller. */
export async function scanBytes(bytes: Buffer, scanner?: Scanner, mime = 'application/octet-stream'): Promise<AvVerdict> {
  if (scanner) return scanner(bytes);
  const host = process.env.CLAMAV_HOST;
  const plan = scanPlan({ hasScanner: !!host, production: process.env.NODE_ENV === 'production', mime });
  if (plan === 'scan') return clamavScan(host!, Number(process.env.CLAMAV_PORT || 3310), bytes);
  if (plan === 'refuse') throw notConfigured('av', 'PDF and video uploads need virus scanning, which is not set up yet. Images (PNG, JPG, WebP, GIF) can be uploaded.');
  return plan;
}

const localDir = () => process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');

function driver() {
  const d = storageDriver(process.env);
  if (d === 'unsupported' || (d === 'local' && process.env.NODE_ENV === 'production')) throw notConfigured('storage', 'File storage is not configured.');
  return d;
}

async function storeBytes(key: string, mime: string, bytes: Buffer) {
  if (driver() === 'blob') { await blobPut(key, bytes, { access: 'private', contentType: mime, addRandomSuffix: false }); return; }
  await mkdir(localDir(), { recursive: true });
  await writeFile(join(localDir(), key.replace(/\//g, '__')), bytes);
}

async function loadBytes(key: string, bucket: string): Promise<Buffer> {
  if (bucket === 'vercel-blob') {
    const r = await blobGet(key, { access: 'private' });
    if (!r || r.statusCode !== 200 || !r.stream) throw notFound('File not found.');
    return Buffer.from(await new Response(r.stream).arrayBuffer());
  }
  return readFileBytes(join(localDir(), key.replace(/\//g, '__')));
}

export async function uploadFile(ctx: Ctx, input: { filename: string; mime: string; bytes: Buffer }, opts: { scanner?: Scanner; entityType?: string; entityId?: string } = {}) {
  if (!hasPerm(ctx, 'learn:self') && !hasPerm(ctx, 'community:post')) throw forbidden();
  const name = validateUpload(input.filename, input.mime, input.bytes.length);
  // Proof scoring spec §3: an image must really be the image type it claims; record hash and size.
  let img: { sha256: string; width: number; height: number } | null = null;
  if (input.mime.startsWith('image/')) {
    const info = readImage(input.bytes);
    if (!info || info.type !== input.mime) throw badRequest('This file isn’t a real PNG, JPG or WebP image. Take a new screenshot and try again.');
    img = { sha256: sha256(input.bytes), width: info.width, height: info.height };
  }
  const verdict = await scanBytes(input.bytes, opts.scanner, input.mime);
  const key = `t/${ctx.tenantId}/${ctx.userId}/${randomUUID()}.${extOf(name)}`;
  const bucket = driver() === 'blob' ? 'vercel-blob' : process.env.STORAGE_BUCKET || 'hub-dev';
  if (verdict !== 'infected') await storeBytes(key, input.mime, input.bytes);
  const file = await prisma.file.create({ data: { tenantId: ctx.tenantId, ownerId: ctx.userId, s3Key: key, bucket, mime: input.mime, sizeBytes: input.bytes.length, avStatus: verdict, entityType: opts.entityType || null, entityId: opts.entityId || null, ...(img || {}) } });
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: `file.upload_${verdict}`, resourceType: 'File', resourceId: file.id, after: { mime: input.mime, sizeBytes: input.bytes.length } });
  return { id: file.id, avStatus: verdict, sizeBytes: input.bytes.length, mime: input.mime, width: img?.width ?? null, height: img?.height ?? null };
}

/** Bytes of an upload the server has already checked belongs to the learner (for proof checks). */
export async function fileBytes(f: { s3Key: string; bucket: string }): Promise<Buffer> { return loadBytes(f.s3Key, f.bucket); }

export async function readFile(ctx: Ctx, fileId: string) {
  const f = await prisma.file.findFirst({ where: { id: fileId, tenantId: ctx.tenantId } });
  if (!f) throw notFound('File not found.');
  const moderator = hasPerm(ctx, 'community:moderate');
  const labReviewer = (f.entityType === 'agent_lab' || f.entityType === 'level_evidence') && hasPerm(ctx, 'review:read'); // Agent Lab and domain-journey screenshots are reviewed proof
  const avatar = f.entityType === 'avatar'; // profile photos are visible to everyone in the same tenant, once scanned
  if (f.ownerId !== ctx.userId && !moderator && !labReviewer && !avatar) throw notFound('File not found.');
  const ok = servable({ avStatus: f.avStatus, mime: f.mime, production: process.env.NODE_ENV === 'production' });
  if (!ok.ok) throw forbidden(ok.reason);
  const bytes = await loadBytes(f.s3Key, f.bucket);
  return { bytes, mime: f.mime };
}
