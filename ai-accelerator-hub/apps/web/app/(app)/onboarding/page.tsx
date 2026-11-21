import { redirect } from 'next/navigation';
import { requireCtx, hasPerm } from '@/lib/server/context';
import { getProfile, safetyOf } from '@/lib/domain/profile';
import { OnboardingForm } from '@/components/learn/OnboardingForm';
import { guarded } from '@/lib/server/page';
import { Tr } from '@/components/i18n/Tr';

export const metadata = { title: 'Your learning path' };
async function Onboarding() {
  const ctx = await requireCtx();
  if (!hasPerm(ctx, 'learn:self')) redirect('/dashboard');
  const [profile, safety] = await Promise.all([getProfile(ctx), safetyOf(ctx.tenantId, ctx.userId)]);
  return (<>
    <section className="ph ph-plain"><span className="eyebrow"><Tr>Your path</Tr></span><h1 id="pageTitle">{profile ? <Tr>Your personalised path</Tr> : <Tr>Let’s shape the journey around you</Tr>}</h1><p className="desc"><Tr>Students, young coders, engineers, builders and business owners all reach the same skills — through examples, demos and tools that fit them.</Tr></p></section>
    <div style={{ marginTop: 20 }}><OnboardingForm initial={profile ? { ...profile.answers, contextCard: profile.contextCard || '' } : null} initialPlan={profile?.plan || null} minor={safety.minor} /></div>
  </>);
}

export default guarded(Onboarding);
