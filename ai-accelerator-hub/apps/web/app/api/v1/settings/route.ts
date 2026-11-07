import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { getSettings, settingsSchema, updateSettings } from '@/lib/domain/account';
export const GET = route(async () => getSettings(await requireCtx()));
export const PATCH = route(async req => updateSettings(await requireCtx(), await body(req, settingsSchema)));
