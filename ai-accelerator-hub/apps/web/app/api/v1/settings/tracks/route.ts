import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { getTrackSettings, setTrackSettings } from '@/lib/domain/journeyTracks';
// Which staff roles may change learners' tracks. Editable by Super Admin, Institution Admin and Program Manager.
const schema = z.object({ roles: z.array(z.string().max(40)).max(10) });
export const GET = route(async () => getTrackSettings(await requireCtx()));
export const PUT = route(async (req: NextRequest) => setTrackSettings(await requireCtx(), (await body(req, schema)).roles));
