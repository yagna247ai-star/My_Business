import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { requirePerm, hasPerm } from '@/lib/server/context';
import { guarded } from '@/lib/server/page';
import { personProfile } from '@/lib/domain/personProfile';

export const metadata = { title: 'Person profile' };

const fmt = (d: Date | string | null | undefined) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const STATE_BADGE: Record<string, string> = { approved: 'badge-success', submitted: 'badge-info', needs_review: 'badge-info', in_progress: 'badge-gold', available: 'badge-neutral', rejected: 'badge-warn', locked: 'badge-neutral', pending: 'badge-info', in_review: 'badge-info', needs_changes: 'badge-warn', active: 'badge-success', paused: 'badge-neutral', completed: 'badge-success', dropped: 'badge-warn', suspended: 'badge-warn' };
const label = (s: string) => s.replace(/_/g, ' ');
const Badge = ({ s }: { s: string }) => <span className={`badge ${STATE_BADGE[s] ?? 'badge-neutral'}`}>{label(s)}</span>;

async function PersonProfile({ params }: { params: Promise<{ userId: string }> }) {
  const ctx = await requirePerm('members:read');
  const { userId } = await params;
  const p = await personProfile(ctx, userId);
  const active = p.journeys.find(j => j.state === 'active') ?? p.journeys[0];
  const initials = p.name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const backHref = hasPerm(ctx, 'members:manage') ? '/settings/people' : '/admin/people';

  return (<>
    <Link href={backHref} className="link small" style={{ marginBottom: 12 }}><ArrowLeft size={14} />Back to People</Link>

    <section className="card card-pad row gap-16 wrap" style={{ alignItems: 'center' }} aria-labelledby="pageTitle">
      <span className="avatar" aria-hidden="true" style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', display: 'grid', placeItems: 'center', background: 'var(--surface-3)', fontWeight: 800, fontSize: 22, flexShrink: 0 }}>
        {p.avatarUrl ? <img src={p.avatarUrl} alt="" width={64} height={64} style={{ objectFit: 'cover', width: '100%', height: '100%' }} /> : initials}
      </span>
      <div style={{ flex: 1, minWidth: 220 }}>
        <h1 id="pageTitle" style={{ fontSize: 26, fontWeight: 800 }}>{p.name}</h1>
        <p className="muted small">{p.email}{p.area ? ` · ${p.area}` : ''}{p.github ? ` · GitHub @${p.github}` : ''}</p>
        <div className="row gap-8 wrap" style={{ marginTop: 8 }}>
          <span className="badge badge-neutral">{p.roleLabel}</span><Badge s={p.status} />
          {p.cohort && <span className="badge badge-info">Cohort: {p.cohort}</span>}
          {active && <span className="badge badge-gold">{active.title}</span>}
          {p.safety.minor && <span className="badge badge-warn">Under 18 · guardian consent {label(p.safety.guardianConsent)}</span>}
          {p.safety.deletionRequestedAt && <span className="badge badge-warn">Deletion requested {fmt(p.safety.deletionRequestedAt)}</span>}
        </div>
      </div>
      <div className="small muted" style={{ textAlign: 'right' }}>Joined {fmt(p.joinedAt)}<br />Last activity {fmt(active?.lastActivity ?? null)}</div>
    </section>

    <div className="kpis" style={{ margin: '18px 0' }}>
      <div className="card kpi"><div className="k">XP</div><div className="v">{p.xp.toLocaleString('en-IN')}</div><div className="d">{p.rank} · {p.tier} tier</div></div>
      <div className="card kpi"><div className="k">Streak</div><div className="v">{p.streak.current} d</div><div className="d">{label(p.streak.status)} · best {p.streak.longest} d</div></div>
      <div className="card kpi"><div className="k">Levels approved</div><div className="v">{active ? `${active.approved}/${active.levelsTotal}` : '—'}</div><div className="d">{active ? `On level ${active.currentLevelIdx}` : 'Not enrolled'}</div></div>
      <div className="card kpi"><div className="k">Activities done</div><div className="v">{active?.activitiesDone ?? 0}</div><div className="d">{p.submissions.length} submission{p.submissions.length === 1 ? '' : 's'}</div></div>
    </div>

    {p.journeys.length === 0 ? <p className="card card-pad muted">Not enrolled in any journey.</p> : p.journeys.map(j => (
      <section key={j.id} className="card card-pad stack gap-12" style={{ marginBottom: 18 }} aria-label={`${j.title} progress`}>
        <div className="row between wrap gap-8"><h2 className="h3">{j.title}</h2><span className="row gap-8 small muted"><Badge s={j.state} />Enrolled {fmt(j.enrolledAt)}{j.completedAt ? ` · completed ${fmt(j.completedAt)}` : ''}</span></div>
        <div className="table-wrap"><table className="tbl"><caption className="sr-only">Level progress in {j.title}</caption>
          <thead><tr><th>Level</th><th>Status</th><th>Activities</th><th>XP</th><th>Attempts</th><th>Completed</th></tr></thead>
          <tbody>{j.levels.length ? j.levels.map(l => (<tr key={l.code}>
            <td><b>L{l.idx}</b> · {l.title}</td><td><Badge s={l.state} /></td>
            <td className="small">{l.activitiesDone}/{l.activitiesTotal}</td><td>{l.xp}</td><td>{l.attempts}</td><td className="small">{fmt(l.completedAt)}</td>
          </tr>)) : <tr><td colSpan={6} className="muted">No level started yet.</td></tr>}</tbody>
        </table></div>
      </section>
    ))}

    <section className="card card-pad stack gap-12" style={{ marginBottom: 18 }} aria-labelledby="subT">
      <h2 className="h3" id="subT">Submissions and reviews <span className="muted">({p.submissions.length})</span></h2>
      <div className="table-wrap"><table className="tbl"><caption className="sr-only">Submissions</caption>
        <thead><tr><th>Level</th><th>Submitted</th><th>Status</th><th>Review</th><th>Link</th></tr></thead>
        <tbody>{p.submissions.length ? p.submissions.map(s => (<tr key={s.id}>
          <td className="small">{s.level}<div className="muted xs">{s.type}</div></td>
          <td className="small">{fmt(s.submittedAt)}</td><td><Badge s={s.state} /></td>
          <td className="small">{s.review ? <><Badge s={s.review.verdict} />{s.review.score != null && <span className="muted"> · {s.review.score.toFixed(1)}/5</span>}{s.review.ai && <span className="muted"> · AI</span>}{s.review.feedback && <div className="muted xs" style={{ marginTop: 4, maxWidth: '48ch' }}>{s.review.feedback}</div>}</> : <span className="muted">Not reviewed yet</span>}</td>
          <td>{s.url ? <a className="link small" href={s.url} target="_blank" rel="noopener noreferrer">Open<ExternalLink size={12} /></a> : '—'}</td>
        </tr>)) : <tr><td colSpan={5} className="muted">No submissions yet.</td></tr>}</tbody>
      </table></div>
    </section>

    <div className="grid2" style={{ gap: 18 }}>
      <section className="card card-pad stack gap-8" aria-labelledby="bT"><h2 className="h3" id="bT">Badges <span className="muted">({p.badges.length})</span></h2>
        {p.badges.length ? <div className="row gap-8 wrap">{p.badges.map(b => <span key={b.code} className="badge badge-gold" title={`Earned ${fmt(b.at)}`}>{b.name} · {b.tier}</span>)}</div> : <p className="muted small">No badges yet.</p>}
      </section>
      <section className="card card-pad stack gap-8" aria-labelledby="tT"><h2 className="h3" id="tT">Talent profile</h2>
        {p.talent ? <>
          <p className="small"><b>{p.talent.headline || 'No headline'}</b></p>
          <p className="muted small">Skills: {p.talent.skills.join(', ') || '—'}</p>
          <p className="muted small">Open to: {p.talent.openTo.join(', ') || '—'} · Visible to: {p.talent.visibility === 'private' ? 'only them' : p.talent.visibility === 'tenant' ? 'this institute' : 'public'}</p>
        </> : <p className="muted small">No talent profile.</p>}
      </section>
      <section className="card card-pad stack gap-8" aria-labelledby="aT"><h2 className="h3" id="aT">Account and privacy</h2>
        <p className="small">Learner type: {p.persona ? label(p.persona) : '—'} · Language: {p.language}</p>
        <p className="small">Leaderboard: {p.safety.leaderboard === 'private' ? 'hidden (shows as Anonymous learner)' : 'visible to cohort'}</p>
        <p className="small">Age group: {p.safety.minor ? `under 18 · guardian consent ${label(p.safety.guardianConsent)}` : 'adult'}</p>
        <p className="muted xs">Account created {fmt(p.accountCreatedAt)}. Your view of this profile is recorded in the audit log.</p>
      </section>
    </div>
  </>);
}

export default guarded(PersonProfile);
