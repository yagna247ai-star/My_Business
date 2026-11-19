import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { listTalentProfilesAdmin } from '@/lib/domain/settingsAdmin';
export const GET = route(async () => ({ profiles: await listTalentProfilesAdmin(await requireCtx()) }));
