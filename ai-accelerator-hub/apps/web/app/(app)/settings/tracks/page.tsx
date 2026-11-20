import { requireCtx } from '@/lib/server/context';
import { forbidden } from '@/lib/server/errors';
import { guarded } from '@/lib/server/page';
import { getTrackSettings } from '@/lib/domain/journeyTracks';
import { canEditTrackSettings } from '@/lib/domain/trackRules';
import { TrackSettings } from '@/components/settings/TrackSettings';

export const metadata = { title: 'Learning tracks' };
async function Tracks() {
  const ctx = await requireCtx();
  if (!canEditTrackSettings(ctx)) throw forbidden();
  const s = await getTrackSettings(ctx);
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle">Learning tracks</h1><p className="desc">Domain journeys come in four tracks: Easy, Intermediate, Hard and Critical. Learners choose their track at sign-up and can change it until they finish Module 1. From Module 2 to Day 45 the track is fixed for everyone.</p></section>
    <div style={{ marginTop: 18 }}><TrackSettings options={s.options} /></div>
  </>);
}
export default guarded(Tracks);
