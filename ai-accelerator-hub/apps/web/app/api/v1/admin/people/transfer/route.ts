// Super Admin: move people (with their learning record) or also add them to another institution.
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { transferPeople } from '@/lib/domain/institutions';
const schema = z.object({ userIds: z.array(z.string().max(40)).min(1, 'Select at least one person.').max(200, 'Move at most 200 people at a time.'), toTenantId: z.string().min(1).max(40), mode: z.enum(['move', 'add']) });
export const maxDuration = 300;
export const POST = route(async (req: NextRequest) => transferPeople(await requireCtx(), await body(req, schema)), { limit: { name: 'admin-transfer', max: 10, windowMs: 60_000 } });
