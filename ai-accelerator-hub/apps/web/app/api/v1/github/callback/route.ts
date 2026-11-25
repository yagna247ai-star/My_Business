import { NextRequest, NextResponse } from 'next/server';
import { getCtx } from '@/lib/server/context';
import { checkState, saveConnection } from '@/lib/domain/projects';
import { exchangeCode } from '@/lib/github/client';
import { appUrl } from '@/lib/server/mail';

export async function GET(req: NextRequest) {
  const base = appUrl().replace(/\/+$/, '');
  const back = req.cookies.get('gh_back')?.value || '/showcase';
  const to = (q: string) => { const r = NextResponse.redirect(new URL(`${back}${back.includes('?') ? '&' : '?'}${q}`, base)); r.cookies.delete('gh_back'); return r; };
  const ctx = await getCtx();
  if (!ctx) return NextResponse.redirect(new URL('/login', base));
  const code = req.nextUrl.searchParams.get('code'); const state = req.nextUrl.searchParams.get('state') || '';
  if (!code || !checkState(state, ctx.userId)) return to('github=failed');
  try {
    const { token, scope } = await exchangeCode(code, `${base}/api/v1/github/callback`);
    await saveConnection(ctx, token, scope);
    return to('github=connected');
  } catch (e) {
    console.error('[github] connect failed', (e as Error).message);
    return to('github=failed');
  }
}
