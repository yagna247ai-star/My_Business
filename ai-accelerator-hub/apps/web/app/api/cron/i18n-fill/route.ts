import { NextRequest, NextResponse } from 'next/server';
import { fillUiTranslations } from '@/lib/i18n/machine';

// Background fill of missing interface translations (daily Vercel cron, or called by hand until done).
// One batch at a time, inside a 4-minute budget, backing off when the AI key is rate limited.
// Only ever translates interface text that is still missing; once everything is translated it does nothing.
export const maxDuration = 300;
let running = false;
let last = 0;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (running || Date.now() - last < 60_000) return NextResponse.json({ skipped: 'a fill ran less than a minute ago' }, { status: 429 });
  running = true; last = Date.now();
  try {
    const log: string[] = [];
    const r = await fillUiTranslations({ concurrency: 1, sequential: true, budgetMs: 240_000, log: s => { log.push(s); console.log(s); } });
    return NextResponse.json({ ...r, log: log.filter(l => /still to do|no AI provider/.test(l)) });
  } finally { running = false; }
}
