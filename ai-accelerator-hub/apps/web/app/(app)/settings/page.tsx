import { prisma } from '@/lib/prisma';
import { requireCtx } from '@/lib/server/context';
import { getSettings } from '@/lib/domain/account';
import { ROLE_LABEL } from '@/lib/server/rbac';
import { SettingsForm } from '@/components/account/SettingsForm';
import { guarded } from '@/lib/server/page';

export const metadata = { title: 'Settings & Privacy' };
async function Settings() {
  const ctx = await requireCtx();
  const [s, u] = await Promise.all([getSettings(ctx), prisma.user.findUniqueOrThrow({ where: { id: ctx.userId }, select: { preferredLanguage: true } })]);
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle">Settings &amp; privacy</h1><p className="desc">{ctx.name} · {ROLE_LABEL[ctx.role]} at {ctx.tenantName}</p></section>
    <div style={{ marginTop: 18, maxWidth: 820 }}><SettingsForm initial={{ leaderboardVisibility: s.leaderboardVisibility, globalOptIn: s.globalOptIn, quietHours: s.quietHours, ageBand: s.ageBand, guardianConsent: s.guardianConsent, deletionRequestedAt: s.deletionRequestedAt?.toISOString() || null }} language={u.preferredLanguage} /></div>
  </>);
}

export default guarded(Settings);
