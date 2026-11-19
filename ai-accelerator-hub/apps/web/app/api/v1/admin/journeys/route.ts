import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { createJourney, listJourneys } from '@/lib/domain/journeyBuilder';
import { badRequest } from '@/lib/server/errors';

/** List this institution's journeys (admins with content:manage). */
export const GET = route(async () => listJourneys(await requireCtx()));

/** Create a journey with stages and levels. Unpublished until an admin publishes it. */
export const POST = route(async req => {
  let raw: unknown;
  try { raw = await req.json(); } catch { throw badRequest('Send a JSON body.'); }
  return createJourney(await requireCtx(), raw);
}, { limit: { name: 'journey-create', max: 10, windowMs: 60_000 } });
