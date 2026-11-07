import { NextRequest } from 'next/server';
import { route, body } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { consentSchema, recordGuardianConsent } from '@/lib/domain/childSafety';
/** Record or revoke verified guardian consent for an under-18 learner (child safety policy §4). */
export const POST = route(async (req: NextRequest, p) => { const c = await requirePerm('members:manage'); const b = await body(req, consentSchema); return recordGuardianConsent(c, p.userId, b); });
