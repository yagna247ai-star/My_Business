import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { setDefaultJourney, setJourneyPublished } from '@/lib/domain/journeyAccess';

const schema = z.object({ published: z.boolean().optional(), makeDefault: z.literal(true).optional() });

/** Super Admin: publish/unpublish a journey, or make it the default for new learners. */
export const PATCH = route(async (req: NextRequest, p) => {
  const ctx = await requireCtx();
  const b = await body(req, schema);
  if (b.published !== undefined) await setJourneyPublished(ctx, p.id, b.published);
  if (b.makeDefault) await setDefaultJourney(ctx, p.id);
  return { ok: true };
});
