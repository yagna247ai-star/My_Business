// Sweep for "automated review only" (docs/AUTO_REVIEW_ONLY_SPEC.md): every 10 minutes, decide any pending submission
// whose Boss is done (catches errors and the backlog). A person is notified only about what automation still cannot decide.
import { NextRequest, NextResponse } from 'next/server';
import { cronAuthorized } from '@/lib/server/cron';
import { sweepPendingReviews } from '@/lib/domain/autoReview';

export const maxDuration = 300;
export async function GET(req: NextRequest) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json(await sweepPendingReviews(50)); // CRON_SECRET checked above
}
