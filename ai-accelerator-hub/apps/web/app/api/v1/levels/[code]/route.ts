import { NextRequest } from 'next/server';
import { route } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { levelState } from '@/lib/domain/journey';
export const GET = route(async (_req: NextRequest, p) => { const s = await levelState(await requirePerm('learn:self'), p.code); if (s.locked) return { locked: true, level: { code: s.level.code, title: s.level.title } }; const { progress, ...rest } = s; return { ...rest, progress: { id: progress.id, state: progress.state, xpEarned: progress.xpEarned } }; });
