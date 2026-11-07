import { route } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { programAnalytics, learnersAtRisk } from '@/lib/domain/insights';
export const GET = route(async () => { const c = await requirePerm('analytics:read'); return { ...(await programAnalytics(c)), learners: await learnersAtRisk(c) }; });
