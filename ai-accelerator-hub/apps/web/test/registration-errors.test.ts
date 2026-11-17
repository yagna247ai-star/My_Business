/**
 * Regression tests for the 2026-11-10 registration fixes:
 *  - validation errors reach the form as { field: message } (they were dropped, so no field showed an error)
 *  - database failures map to 409 / 503 instead of a generic 500
 *  - the global stylesheet no longer forces white body text / collides with design-system class names
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { route, body } from '@/lib/server/http';
import { registerSchema } from '@/lib/domain/account';

const post = (data: unknown) => new NextRequest('http://localhost/api/v1/register', { method: 'POST', body: JSON.stringify(data), headers: { 'content-type': 'application/json', origin: 'http://localhost', host: 'localhost' } });
const call = async (h: Parameters<typeof route>[0], data: unknown = {}) => {
  const res = await route(h)(post(data), { params: Promise.resolve({}) });
  return { status: res.status, json: await res.json() as { error?: { code: string; message: string; details?: Record<string, string> } } };
};

describe('validation errors are field-mapped', () => {
  it('returns one plain message per field', async () => {
    const r = await call(req => body(req, registerSchema), { name: '', email: 'bad', password: 'x', birthYear: '', acceptTerms: false });
    expect(r.status).toBe(400);
    expect(r.json.error?.details).toMatchObject({ name: expect.any(String), email: expect.any(String), password: expect.any(String), birthYear: expect.any(String), acceptTerms: expect.any(String) });
    for (const v of Object.values(r.json.error!.details!)) expect(typeof v).toBe('string');
    expect(r.json.error?.message).toMatch(/5 highlighted fields/);
  });
  it('rejects a guardian email equal to the learner email', () => {
    const r = registerSchema.safeParse({ name: 'Kid', email: 'a@b.co', password: 'abcdef12345', birthYear: 2011, guardianEmail: 'A@b.co', acceptTerms: true });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toEqual(['guardianEmail']);
  });
});

describe('database failures are not generic 500s', () => {
  const prismaErr = (name: string, code?: string) => Object.assign(new Error('db'), { name, code });
  it('unique constraint → 409', async () => { expect((await call(async () => { throw prismaErr('PrismaClientKnownRequestError', 'P2002'); })).status).toBe(409); });
  it('lock / transaction timeout → 503 retryable', async () => {
    for (const code of ['P1008', 'P2028', 'P2034']) expect((await call(async () => { throw prismaErr('PrismaClientKnownRequestError', code); })).status).toBe(503);
  });
  it('database unreachable → 503', async () => { expect((await call(async () => { throw prismaErr('PrismaClientInitializationError'); })).status).toBe(503); });
  it('unknown error → 500 with a request reference, no internals', async () => {
    const r = await call(async () => { throw new Error('secret stack detail'); });
    expect(r.status).toBe(500);
    expect(JSON.stringify(r.json)).not.toContain('secret stack detail');
    expect((r.json.error as { requestId?: string }).requestId).toBeTruthy();
  });
});

describe('stylesheet regressions', () => {
  const css = fs.readFileSync(path.resolve(__dirname, '../app/globals.css'), 'utf8');
  it('does not override theme colours with a dark-only token block', () => {
    expect(css).not.toMatch(/text-foreground|--foreground\s*:|--background\s*:/);
    expect(css).not.toMatch(/--border\s*:\s*\d/);
  });
  it('blocks Tailwind utilities whose names collide with design-system classes', async () => {
    const cfg = (await import('../tailwind.config')).default as { blocklist?: string[] };
    for (const c of ['gap-8', 'gap-12', 'gap-16', 'gap-20', 'gap-24', 'ring']) expect(cfg.blocklist).toContain(c);
  });
});
