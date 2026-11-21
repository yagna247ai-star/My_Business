import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireCtx } from '@/lib/server/context';
import { guarded } from '@/lib/server/page';
import { settingsCards } from '@/lib/server/settingsNav';
import { SettingsCardIcon } from '@/components/settings/SettingsCardIcon';
import { Tr } from '@/components/i18n/Tr';
import { Tv } from '@/components/i18n/Tv';

export const metadata = { title: 'Settings' };

async function SettingsHub() {
  const ctx = await requireCtx();
  const cards = settingsCards(ctx);
  const admin = cards.some(c => c.admin);
  const [members, cohorts, opportunities, profiles, institutes] = admin ? await Promise.all([
    prisma.membership.count({ where: { tenantId: ctx.tenantId } }),
    prisma.cohort.count({ where: { tenantId: ctx.tenantId } }),
    prisma.opportunity.count({ where: { tenantId: ctx.tenantId } }),
    prisma.talentProfile.count({ where: { tenantId: ctx.tenantId } }),
    ctx.superAdmin ? prisma.tenant.count() : Promise.resolve(1),
  ]) : [0, 0, 0, 0, 0];
  const meta: Record<string, string> = {
    '/settings/institute': ctx.superAdmin ? `${institutes} institute${institutes === 1 ? '' : 's'}` : ctx.tenantName,
    '/settings/people': `${members} member${members === 1 ? '' : 's'}`,
    '/settings/cohorts': `${cohorts} cohort${cohorts === 1 ? '' : 's'}`,
    '/settings/talent': `${opportunities} opportunit${opportunities === 1 ? 'y' : 'ies'} · ${profiles} profile${profiles === 1 ? '' : 's'}`,
  };
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle"><Tr>Settings</Tr></h1><p className="desc">{admin ? `Manage ${ctx.tenantName}: your institute, people, cohorts and talent, plus your own profile and privacy.` : <Tr>Your profile, appearance and privacy.</Tr>}</p></section>
    <div className="set-grid" style={{ marginTop: 18 }}>
      {cards.map(c => (
        <Link key={c.href} href={c.href} className="set-card">
          <span className="set-ic"><SettingsCardIcon icon={c.icon} /></span>
          <h2><Tv v={c.label} /></h2>
          <p><Tv v={c.description} /></p>
          <span className="row gap-8 set-meta">{c.admin && <span className="set-badge-admin"><Tr>Admin</Tr></span>}{meta[c.href] && <span>{meta[c.href]}</span>}</span>
        </Link>
      ))}
    </div>
  </>);
}

export default guarded(SettingsHub);
