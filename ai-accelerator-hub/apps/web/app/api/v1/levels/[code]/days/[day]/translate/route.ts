import { route } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { prisma } from '@/lib/prisma';
import { getEnrollment } from '@/lib/domain/journey';
import { forbidden, notFound, notConfigured } from '@/lib/server/errors';
import { getLocale } from '@/lib/i18n/server';
import { translateLesson, TranslationUnavailable } from '@/lib/i18n/lessonTranslate';
// Translate one lesson page into the learner's language (cached after the first time). Only pages the learner can open.
export const POST = route(async (_req, p) => {
  const ctx = await requirePerm('learn:self');
  const e = await getEnrollment(ctx);
  const level = await prisma.level.findFirst({ where: { tenantId: ctx.tenantId, journeyId: e.journeyId, code: p.code } });
  if (!level) throw notFound('Module not found.');
  const prog = await prisma.progress.findUnique({ where: { enrollmentId_levelId: { enrollmentId: e.id, levelId: level.id } } });
  if (!prog || prog.state === 'locked') throw forbidden('This level is locked.');
  const page = await prisma.content.findFirst({ where: { levelId: level.id, kind: 'md', position: Number(p.day) } });
  if (!page) throw notFound('Day not found.');
  const english = String(JSON.parse(page.payload || '{}').body || '');
  try { return { locale: await getLocale(), translated: !!(await translateLesson(page.id, english, await getLocale())) }; }
  catch (err) { if (err instanceof TranslationUnavailable) throw notConfigured('ai', err.message); throw err; }
}, { limit: { name: 'translate', max: 30, windowMs: 60 * 60_000 } });
