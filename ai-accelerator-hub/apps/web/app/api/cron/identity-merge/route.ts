// Daily: merge duplicate accounts that are certainly the same person (same mailbox or GitHub account), capped per run.
// Anything that cannot be merged becomes a ticket for a Super Admin (docs/IDENTITY_DEDUP_SPEC.md §3.11).
import { NextRequest, NextResponse } from 'next/server';
import { cronAuthorized } from '@/lib/server/cron';
import { autoMergeCertain } from '@/lib/domain/identity';

export const maxDuration = 300;
export async function GET(req: NextRequest) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  // Report-only until IDENTITY_AUTOMERGE=on (docs/ENVIRONMENT_VARIABLES.md): it says what it would merge and changes nothing.
  return NextResponse.json(await autoMergeCertain(undefined, { dryRun: process.env.IDENTITY_AUTOMERGE !== 'on' }));
}
