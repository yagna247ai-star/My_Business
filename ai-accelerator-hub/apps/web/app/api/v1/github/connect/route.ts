// Connect GitHub (OAuth App, scope public_repo) so repos can be created in the learner's own account.
import { NextRequest, NextResponse } from 'next/server';
import { route } from '@/lib/server/http';
import { getCtx, requireCtx } from '@/lib/server/context';
import { connectState, disconnectGithub } from '@/lib/domain/projects';
import { appUrl } from '@/lib/server/mail';

export async function GET(req: NextRequest) {
  const ctx = await getCtx();
  if (!ctx) return NextResponse.redirect(new URL('/login?next=/showcase', appUrl()));
  const id = process.env.GITHUB_CONNECT_CLIENT_ID;
  if (!id) return NextResponse.redirect(new URL('/showcase/github-guide?connect=unavailable', appUrl()));
  const back = req.nextUrl.searchParams.get('back') || '/showcase';
  const u = new URL('https://github.com/login/oauth/authorize');
  u.searchParams.set('client_id', id);
  u.searchParams.set('redirect_uri', `${appUrl().replace(/\/+$/, '')}/api/v1/github/callback`);
  u.searchParams.set('scope', 'public_repo');
  u.searchParams.set('state', connectState(ctx.userId));
  u.searchParams.set('allow_signup', 'true');
  const res = NextResponse.redirect(u);
  res.cookies.set('gh_back', back.startsWith('/') && !back.startsWith('//') ? back : '/showcase', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 600, path: '/' });
  return res;
}
export const DELETE = route(async () => disconnectGithub(await requireCtx()));
