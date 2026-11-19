import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { prisma } from '@/lib/prisma';
import { notFound } from '@/lib/server/errors';
import { redact } from '@/lib/ai/coach';
import { runStuckHelper, MAX_HINTS } from '@/lib/ai/stuckHelper';

const schema = z.object({ question: z.string().trim().min(5).max(1000), tried: z.string().max(1000), hints: z.array(z.string().max(1000)).max(MAX_HINTS) });

// Stuck helper (LangGraph + Gemini). Personal data is removed before anything reaches the model.
export const POST = route(async (req: NextRequest, p) => {
  const ctx = await requirePerm('learn:self');
  const b = await body(req, schema);
  const level = await prisma.level.findFirst({ where: { tenantId: ctx.tenantId, code: p.code, isPublished: true }, select: { title: true } });
  if (!level) throw notFound('Level not found.');
  return runStuckHelper({ question: redact(b.question).text, tried: redact(b.tried).text, hints: b.hints, levelTitle: level.title });
}, { limit: { name: 'stuck', max: 10, windowMs: 60_000 } });
