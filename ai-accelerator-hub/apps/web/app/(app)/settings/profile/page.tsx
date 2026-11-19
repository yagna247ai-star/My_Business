import { prisma } from '@/lib/prisma';
import { requireCtx } from '@/lib/server/context';
import { getSettings } from '@/lib/domain/account';
import { ROLE_LABEL } from '@/lib/server/rbac';
import { SettingsForm } from '@/components/account/SettingsForm';
import { AvatarUploader } from '@/components/account/AvatarUploader';
import { ThemePicker } from '@/components/account/ThemePicker';
import { guarded } from '@/lib/server/page';

export const metadata = { title: 'Profile & privacy' };
async function Settings() {
  const ctx = await requireCtx();
  const [s, u] = await Promise.all([getSettings(ctx), prisma.user.findUniqueOrThrow({ where: { id: ctx.userId }, select: { preferredLanguage: true, avatarUrl: true, area: true } })]);
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle">Profile &amp; privacy</h1><p className="desc">{ctx.name} · {ROLE_LABEL[ctx.role]} at {ctx.tenantName}</p></section>
    <div style={{ marginTop: 18, maxWidth: 820 }}><AvatarUploader initialUrl={u.avatarUrl} /><div style={{ height: 18 }} /><ThemePicker /><div style={{ height: 18 }} /><SettingsForm initial={{ leaderboardVisibility: s.leaderboardVisibility, globalOptIn: s.globalOptIn, quietHours: s.quietHours, ageBand: s.ageBand, guardianConsent: s.guardianConsent, deletionRequestedAt: s.deletionRequestedAt?.toISOString() || null }} language={u.preferredLanguage} area={u.area ?? ''} /></div>
  </>);
}

export default guarded(Settings);
