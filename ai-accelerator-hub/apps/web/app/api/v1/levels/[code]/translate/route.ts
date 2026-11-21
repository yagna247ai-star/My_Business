import { route } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { levelState } from '@/lib/domain/journey';
import { forbidden, notConfigured } from '@/lib/server/errors';
import { getLocale } from '@/lib/i18n/server';
import { translateActivities } from '@/lib/i18n/activityTranslate';
import { langchainProvider } from '@/lib/ai/providers/langchain';
// Translate this level's activities (as this learner sees them) into their language; cached afterwards.
export const POST = route(async (_req, p) => {
  const ctx = await requirePerm('learn:self');
  const st = await levelState(ctx, p.code);
  if (st.locked) throw forbidden('This level is locked.');
  if (!langchainProvider.configured()) throw notConfigured('ai', 'Translation is not available right now. The lesson is shown in English.');
  const locale = await getLocale();
  const n = await translateActivities(st.activities.map(a => ({ id: a.id, title: a.title, config: a.config })), locale);
  return { locale, translated: n };
}, { limit: { name: 'translate', max: 30, windowMs: 60 * 60_000 } });
