import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { route, body } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { getEnrollment } from '@/lib/domain/journey';
import { notFound } from '@/lib/server/errors';
// "Was this useful?" on a day lesson or an activity of a level the learner is enrolled in. One vote each; can be changed.
const schema = z.object({ target: z.string().regex(/^(day|activity):\d{1,3}$/), useful: z.boolean() });
export const POST = route(async (req: NextRequest, p) => {
  const ctx = await requirePerm('learn:self');
  const b = await body(req, schema);
  const e = await getEnrollment(ctx);
  const level = await prisma.level.findFirst({ where: { tenantId: ctx.tenantId, journeyId: e.journeyId, code: p.code }, select: { id: true } });
  if (!level) throw notFound('Level not found.');
  await prisma.contentFeedback.upsert({ where: { levelId_target_userId: { levelId: level.id, target: b.target, userId: ctx.userId } }, update: { useful: b.useful }, create: { tenantId: ctx.tenantId, levelId: level.id, target: b.target, userId: ctx.userId, useful: b.useful } });
  return { ok: true };
}, { limit: { name: 'feedback', max: 120, windowMs: 60 * 60_000 } });
