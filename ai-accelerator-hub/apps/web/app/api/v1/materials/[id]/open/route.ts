// Records the first open, then redirects to the stored link only (docs/DAY_MATERIALS_SPEC.md §3.5).
import { NextRequest, NextResponse } from 'next/server';
import { getCtx } from '@/lib/server/context';
import { openMaterial } from '@/lib/domain/dayMaterials';
import { AppError } from '@/lib/server/errors';
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getCtx();
  if (!ctx) return NextResponse.redirect(new URL('/login', req.url));
  try { return NextResponse.redirect(await openMaterial(ctx, (await params).id), 302); }
  catch (e) { const s = e instanceof AppError ? e.status : 500; return NextResponse.json({ error: { message: e instanceof AppError ? e.message : 'Could not open this material.' } }, { status: s }); }
}
