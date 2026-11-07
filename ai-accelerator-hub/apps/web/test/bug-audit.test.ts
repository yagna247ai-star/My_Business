/**
 * Regression tests for docs/BUG_AUDIT_2026-11-07.md (H2, H4, M2).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { clientIp } from '@/lib/server/http';
import { isLearner, type Ctx } from '@/lib/server/context';
import { guarded } from '@/lib/server/page';
import { forbidden, notFound, unauthorized, badRequest } from '@/lib/server/errors';
import { neo4jStatus } from '@/lib/neo4j';

const req = (xff?: string) => new NextRequest('http://localhost/api/x', { headers: xff ? { 'x-forwarded-for': xff } : {} });
const ctx = (role: Ctx['role'], superAdmin = false): Ctx => ({ userId: 'u', email: 'e', name: 'n', tenantId: 't', tenantSlug: 's', tenantName: 'T', role, cohortId: null, superAdmin });
const signal = async (p: Promise<unknown>) => { try { return { value: await p }; } catch (e) { return { digest: String((e as { digest?: string }).digest || e) }; } };

describe('H2: rate-limit address', () => {
  afterEach(() => { delete process.env.TRUST_PROXY_HOPS; });
  it('ignores a client-supplied X-Forwarded-For unless a proxy is configured', () => {
    expect(clientIp(req('6.6.6.6'))).toBe('direct');
    expect(clientIp(req())).toBe('direct');
  });
  it('with one trusted proxy, uses the entry that proxy appended (rightmost), not the spoofable left one', () => {
    process.env.TRUST_PROXY_HOPS = '1';
    expect(clientIp(req('6.6.6.6, 203.0.113.9'))).toBe('203.0.113.9');
    process.env.TRUST_PROXY_HOPS = '2';
    expect(clientIp(req('6.6.6.6, 203.0.113.9, 10.0.0.2'))).toBe('203.0.113.9');
  });
});

describe('H4: pages map errors instead of crashing', () => {
  it('401 → sign-in redirect, 404 → not-found, 403/other → no-access card', async () => {
    expect((await signal(guarded(async () => { throw unauthorized(); })({}))).digest).toMatch(/NEXT_REDIRECT.*\/login/);
    expect((await signal(guarded(async () => { throw notFound(); })({}))).digest).toMatch(/NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/);
    const denied = await guarded(async () => { throw forbidden('You are not enrolled in a journey in this institution.'); })({}) as { props: { message: string } };
    expect(denied.props.message).toBe('You are not enrolled in a journey in this institution.');
    const generic = await guarded(async () => { throw forbidden(); })({}) as { props: { message: string } };
    expect(generic.props.message).toMatch(/Your role doesn’t include this page/);
    expect(((await guarded(async () => { throw badRequest('Nope.'); })({})) as { props: { message: string } }).props.message).toBe('Nope.');
  });
  it('unexpected errors still reach the error boundary', async () => {
    expect((await signal(guarded(async () => { throw new Error('boom'); })({}))).digest).toBe('Error: boom');
  });
  it('a super admin is not treated as a learner (no learner menu or journey dashboard)', () => {
    expect(isLearner(ctx('super_admin', true))).toBe(false);
    expect(isLearner(ctx('learner'))).toBe(true);
    expect(isLearner(ctx('mentor'))).toBe(false);
  });
});

describe('M2: graph status never exposes internals', () => {
  it('reports a status word only', () => {
    expect(['disabled', 'down', 'unknown']).toContain(neo4jStatus());
  });
});
