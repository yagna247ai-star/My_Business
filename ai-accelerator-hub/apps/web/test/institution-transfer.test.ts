/**
 * Moving a learner between institutions keeps their record (docs/INSTITUTIONS_SPEC.md AC-5, AC-6). Runs on the test database.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { register } from '@/lib/domain/account';
import { transferPeople, institutionForCode } from '@/lib/domain/institutions';

const EMAIL = 'mover@test.in';
let from = '', to = '';

beforeAll(async () => {
  await register({ name: 'Mover Learner', email: EMAIL, password: 'Mover-pass-123', birthYear: 1999, acceptTerms: true });
  const u = await prisma.user.findUniqueOrThrow({ where: { email: EMAIL } });
  from = (await prisma.membership.findFirstOrThrow({ where: { userId: u.id } })).tenantId;
  const t = await prisma.tenant.create({ data: { name: 'Code Factory Pvt Ltd', slug: 'code-factory-test', code: 'CODEFAC', type: 'company', status: 'active' } });
  to = t.id;
});

describe('registration codes', () => {
  it('AC-6: a known institution code is used; an unknown one is refused', async () => {
    expect((await institutionForCode('codefac')).tenantId).toBe(to);
    await expect(institutionForCode('NOSUCH')).rejects.toThrow(/don’t know the code/);
  });
});

describe('move', () => {
  it('AC-5: A becomes alumni, B active, and the XP total is the same', async () => {
    const u = await prisma.user.findUniqueOrThrow({ where: { email: EMAIL } });
    const xpBefore = (await prisma.xpLedger.aggregate({ where: { userId: u.id }, _sum: { amount: true } }))._sum.amount ?? 0;
    const admin = await prisma.user.findFirstOrThrow({ where: { globalRole: 'super_admin' } });
    const ctx: Ctx = { userId: admin.id, email: admin.email, name: 'SA', tenantId: from, tenantSlug: '', tenantName: '', role: 'super_admin', cohortId: null, superAdmin: true };
    const r = await transferPeople(ctx, { userIds: [u.id], toTenantId: to, mode: 'move' });
    expect(r.skipped).toEqual([]);
    expect((await prisma.membership.findUniqueOrThrow({ where: { tenantId_userId: { tenantId: from, userId: u.id } } })).status).toBe('alumni');
    expect((await prisma.membership.findUniqueOrThrow({ where: { tenantId_userId: { tenantId: to, userId: u.id } } })).status).toBe('active');
    expect(await prisma.enrollment.count({ where: { tenantId: from, userId: u.id } })).toBe(0);
    expect(await prisma.enrollment.count({ where: { tenantId: to, userId: u.id } })).toBeGreaterThan(0);
    const xpAfter = (await prisma.xpLedger.aggregate({ where: { userId: u.id, tenantId: to }, _sum: { amount: true } }))._sum.amount ?? 0;
    expect(xpAfter).toBe(xpBefore);
  });
});
