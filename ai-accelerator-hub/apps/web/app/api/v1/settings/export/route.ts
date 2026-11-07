import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { NextResponse } from 'next/server';
import { exportMyData } from '@/lib/domain/account';
export const GET = route(async () => { const data = await exportMyData(await requireCtx()); return new NextResponse(JSON.stringify(data, null, 2), { headers: { 'content-type': 'application/json', 'content-disposition': `attachment; filename="my-data-${new Date().toISOString().slice(0, 10)}.json"`, 'cache-control': 'no-store' } }); }, { limit: { name: 'export', max: 5, windowMs: 60 * 60_000 } });
