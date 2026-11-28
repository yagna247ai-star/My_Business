import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Github from 'next-auth/providers/github';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { findUserByAnyEmail } from './domain/identity';

/* Secrets: never fall back to a hard-coded value in production. */
const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
if (!secret && process.env.NODE_ENV === 'production') throw new Error('NEXTAUTH_SECRET must be set in production.');
if (secret && secret.length < 32 && process.env.NODE_ENV === 'production') throw new Error('NEXTAUTH_SECRET must be at least 32 characters.');

const credentialsSchema = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(200) });

/* Brute-force protection: 5 failures per email per 15 minutes. (Redis-backed in multi-instance production.) */
const failures = new Map<string, { n: number; until: number }>();
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-not-a-password', 10);
const LOCK_MS = 15 * 60 * 1000, MAX_FAILS = 5;
export const _resetLoginFailures = () => failures.clear();
/** After a successful password reset the owner proved they hold the inbox, so lift any sign-in lock. */
export const clearLoginFailures = (email: string) => { failures.delete(email.trim().toLowerCase()); };
function locked(email: string) { const f = failures.get(email); return !!f && f.n >= MAX_FAILS && f.until > Date.now(); }
function fail(email: string) { const f = failures.get(email); const now = Date.now(); if (!f || f.until < now) failures.set(email, { n: 1, until: now + LOCK_MS }); else f.n += 1; }

export async function verifyCredentials(emailRaw: string, password: string) {
  const email = emailRaw.trim().toLowerCase();
  if (locked(email)) return { ok: false as const, reason: 'locked' as const };
  const user = await findUserByAnyEmail(email); // docs/IDENTITY_DEDUP_SPEC.md: any email of the account signs in
  // Constant-ish time: always run a bcrypt compare, even for unknown emails
  const hash = user?.passwordHash || DUMMY_HASH;
  const ok = await bcrypt.compare(password, hash);
  if (!user || !user.passwordHash || !ok) { fail(email); return { ok: false as const, reason: 'invalid' as const }; }
  failures.delete(email);
  return { ok: true as const, user };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: secret || 'dev-only-insecure-secret-not-for-production-use',
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: '/login' },
  providers: [
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET ? [Github({ clientId: process.env.GITHUB_CLIENT_ID, clientSecret: process.env.GITHUB_CLIENT_SECRET })] : []),
    Credentials({
      name: 'Email & Password',
      credentials: { email: { label: 'Email', type: 'email' }, password: { label: 'Password', type: 'password' } },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const r = await verifyCredentials(parsed.data.email, parsed.data.password);
        const membership = r.ok ? await prisma.membership.findFirst({ where: { userId: r.user.id, status: 'active' } }) : null;
        const tenantId = membership?.tenantId || (await prisma.tenant.findFirst({ where: { slug: process.env.DEFAULT_TENANT_SLUG || 'demo' } }))?.id;
        if (tenantId) await prisma.auditLog.create({ data: { tenantId, actorUserId: r.ok ? r.user.id : null, action: r.ok ? 'auth.login_success' : r.reason === 'locked' ? 'auth.login_locked' : 'auth.login_failed', resourceType: 'User', resourceId: r.ok ? r.user.id : null, after: JSON.stringify({ email: parsed.data.email.toLowerCase() }) } }).catch(() => {});
        if (!r.ok) return null;
        return { id: r.user.id, email: r.user.email, name: r.user.name, image: r.user.avatarUrl };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user?.id) {
        token.id = user.id;
        const m = await prisma.membership.findFirst({ where: { userId: user.id, status: 'active' }, orderBy: { createdAt: 'asc' } });
        token.tenantId = m?.tenantId || null;
      }
      if (account?.provider === 'github' && token.id) {
        await prisma.user.updateMany({ where: { id: String(token.id) }, data: { githubId: String(account.providerAccountId) } });
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as { id?: string }).id = String(token.id || '');
      (session as unknown as { tenantId?: string | null }).tenantId = (token.tenantId as string) || null;
      return session;
    },
  },
});
