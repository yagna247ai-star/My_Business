// Daily re-check of every showcase link (docs/SHOWCASE_LINK_HEALTH_SPEC.md).
import { NextRequest, NextResponse } from 'next/server';
import { cronAuthorized } from '@/lib/server/cron';
import { checkShowcaseLinks } from '@/lib/domain/showcase';
import { checkMaterialLinks } from '@/lib/domain/dayMaterials';

export const maxDuration = 300;
export async function GET(req: NextRequest) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); // CRON_SECRET
  return NextResponse.json({ showcase: await checkShowcaseLinks(150), materials: await checkMaterialLinks(150) });
}
