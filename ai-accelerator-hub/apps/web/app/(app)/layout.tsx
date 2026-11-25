import { redirect } from 'next/navigation';
import { getCtx, hasPerm, isLearner } from '@/lib/server/context';
import { ROLE_LABEL } from '@/lib/server/rbac';
import { prisma } from '@/lib/prisma';
import { totalXp } from '@/lib/domain/xp';
import { streakView } from '@/lib/domain/streak';
import { journeyOverview } from '@/lib/domain/journey';
import { topApprovedLevel, crownLabel } from '@/lib/domain/gamify';
import { Shell, type NavItem } from '@/components/app/Shell';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCtx();
  if (!ctx) redirect('/login');
  if (ctx.mustChangePassword) redirect('/settings/password'); // an admin asked for a new password (lives outside this layout)
  const nav: NavItem[] = [];
  const learner = isLearner(ctx);
  if (learner) nav.push(
    { href: '/dashboard', label: 'Mission Control', icon: 'rocket', group: 'Learn' },
    { href: '/levels', label: 'Journey', icon: 'map', group: 'Learn' },
    { href: '/onboarding', label: 'My Path', icon: 'compass', group: 'Learn' },
    { href: '/agent-lab', label: 'Agent Lab', icon: 'rocket', group: 'Learn' },
    { href: '/hackathons', label: 'Hackathons', icon: 'users', group: 'Learn' },
    { href: '/achievements', label: 'Achievements', icon: 'award', group: 'Learn' },
    { href: '/ranks', label: 'Ranks', icon: 'ranks', group: 'Community' },
    { href: '/feed', label: 'Feed', icon: 'compass', group: 'Community' },
    { href: '/showcase', label: 'Showcase', icon: 'award', group: 'Community' },
    { href: '/library', label: 'Open-source Library', icon: 'book', group: 'Community' },
  );
  if (hasPerm(ctx, 'ai:use')) nav.push({ href: '/coach', label: 'AI Coaches', icon: 'lifebuoy', group: 'Support' });
  if (hasPerm(ctx, 'review:read')) {
    const pending = await prisma.submission.count({ where: { tenantId: ctx.tenantId, state: 'pending', userId: { not: ctx.userId } } });
    nav.push({ href: '/review', label: 'Review Queue', icon: 'inbox', group: 'Review', count: pending });
    const labPending = await prisma.agentLabRun.count({ where: { tenantId: ctx.tenantId, state: 'submitted', userId: { not: ctx.userId } } });
    nav.push({ href: '/review/agent-lab', label: 'Agent Lab Proofs', icon: 'shield', group: 'Review', count: labPending });
    const helpOpen = await prisma.helpRequest.count({ where: { tenantId: ctx.tenantId, state: 'open', learnerId: { not: ctx.userId } } });
    nav.push({ href: '/review/help', label: 'Help Requests', icon: 'lifebuoy', group: 'Review', count: helpOpen });
  }
  // Staff menu grouped by what an admin does (docs/ACCESS_MODULES_AND_NAV_SPEC.md).
  if (hasPerm(ctx, 'analytics:read')) nav.push({ href: '/admin', label: 'Analytics', icon: 'chart', group: 'Overview' });
  if (hasPerm(ctx, 'members:read')) nav.push({ href: '/settings/people', label: 'People', icon: 'users', group: 'People' });
  if (ctx.superAdmin) nav.push({ href: '/settings/access', label: 'Access', icon: 'shield', group: 'People' });
  if (hasPerm(ctx, 'cohort:read')) nav.push({ href: '/admin/cohorts', label: 'Cohorts & Sessions', icon: 'layers', group: 'People' });
  if (hasPerm(ctx, 'content:manage')) nav.push({ href: '/admin/content', label: 'Content & Day materials', icon: 'book', group: 'Content' });
  if (hasPerm(ctx, 'content:manage')) nav.push({ href: '/admin/journeys', label: 'Journey Builder', icon: 'map', group: 'Content' });
  if (!learner) nav.push({ href: '/ranks', label: 'Ranks', icon: 'ranks', group: 'Community' });
  if (!learner && hasPerm(ctx, 'community:moderate')) nav.push({ href: '/admin/showcase', label: 'Showcase', icon: 'star', group: 'Community' });
  else if (!learner) nav.push({ href: '/showcase', label: 'Showcase', icon: 'star', group: 'Community' });
  if (hasPerm(ctx, 'community:moderate')) nav.push({ href: '/admin/moderation', label: 'Moderation', icon: 'shield', group: 'Community' });
  if (hasPerm(ctx, 'cohort:manage')) nav.push({ href: '/admin/hackathons', label: 'Hackathon Builder', icon: 'users', group: 'Community' });
  if (hasPerm(ctx, 'audit:read')) nav.push({ href: '/admin/audit', label: 'Audit Log', icon: 'shield', group: 'Governance' });
  if (!learner) nav.push({ href: '/library', label: 'Open-source Library', icon: 'book', group: 'Resources' });
  if (learner) nav.push({ href: '/career', label: 'Career', icon: 'award', group: 'Grow' });
  if (hasPerm(ctx, 'talent:discover')) nav.push({ href: '/talent', label: 'Talent', icon: 'users', group: 'Governance' });
  if (hasPerm(ctx, 'billing:self')) nav.push({ href: '/billing', label: 'Plans & Billing', icon: 'card', group: 'Account' });
  nav.push({ href: '/settings', label: 'Settings', icon: 'settings', group: 'Account' });

  const me = await prisma.user.findUnique({ where: { id: ctx.userId }, select: { avatarUrl: true } });
  const overview = learner ? await journeyOverview(ctx).catch(() => null) : null;
  const topIdx = overview ? topApprovedLevel(overview.levels) : null;
  const topTitle = topIdx !== null ? overview!.levels.find(l => l.idx === topIdx)?.title : undefined;
  const [unread, xp, streak] = await Promise.all([
    prisma.notification.count({ where: { tenantId: ctx.tenantId, userId: ctx.userId, channel: 'in_app', state: { not: 'read' } } }),
    learner ? totalXp(ctx.tenantId, ctx.userId) : Promise.resolve(null),
    learner ? prisma.streak.findUnique({ where: { tenantId_userId: { tenantId: ctx.tenantId, userId: ctx.userId } } }) : Promise.resolve(null),
  ]);
  const sv = learner ? streakView(streak) : null;
  return <Shell user={{ name: ctx.name, roleLabel: ROLE_LABEL[ctx.role], tenant: ctx.tenantName, avatarUrl: me?.avatarUrl ?? null, crown: crownLabel(topIdx, topTitle) }} nav={nav} unread={unread} xp={xp} streak={sv ? { status: sv.status, current: sv.current } : null}>{children}</Shell>;
}
