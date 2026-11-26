'use client';
/** Mentor's week board (docs/COHORT_WEEK_SPEC.md AC-3): tap a block to cycle Present → Absent → Excused → clear. */
import { useState } from 'react';
import { api } from '@/lib/client/api';
import type { cohortBoard } from '@/lib/domain/cohortWeek';

type Board = Awaited<ReturnType<typeof cohortBoard>>;
type M = { status: string; source: string } | null;
const NEXT: Record<string, 'present' | 'absent' | 'excused' | 'clear'> = { none: 'present', present: 'absent', absent: 'excused', excused: 'clear' };
const SHOW: Record<string, string> = { present: '✓', absent: '✗', excused: 'E' };
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function AttendanceBoard({ board }: { board: Board }) {
  const [b, setB] = useState(board); const [err, setErr] = useState('');
  const blocks = b.calendar?.blocks ?? [];
  const today = new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
  const mark = async (userId: string, iso: string, block: string, cur: M) => {
    const status = NEXT[cur?.status ?? 'none'];
    setErr('');
    try {
      await api(`/api/v1/admin/cohorts/${b.cohort.id}/attendance`, { body: { userId, date: iso, block, status } });
      setB(v => ({ ...v, learners: v.learners.map(l => l.userId !== userId ? l : { ...l, cells: l.cells.map(c => c.iso !== iso ? c : { ...c, marks: { ...c.marks, [block]: status === 'clear' ? null : { status, source: 'mentor' } } }) }) }));
    } catch (e) { setErr((e as Error).message); }
  };
  const classCols = b.cols.filter(c => c.kind === 'class');
  const summary = classCols.map(col => {
    const cells = b.learners.map(l => l.cells.find(c => c.iso === col.iso)!);
    return { iso: col.iso, done: cells.filter(c => c.done).length, present: Object.fromEntries(blocks.map(bl => [bl.key, cells.filter(c => (c.marks as Record<string, M>)[bl.key]?.status === 'present').length])) };
  });
  return (
    <div className="stack gap-12">
      {err && <p className="callout warn small" role="alert">{err}</p>}
      <p className="muted small">Tap a block to mark it: ✓ present → ✗ absent → E excused → clear. Grey marks are the learner’s own check-in; bold ones are a mentor’s.</p>
      <div className="card table-wrap"><table className="tbl">
        <thead><tr><th>Learner</th>{b.cols.map((c, i) => <th key={c.iso} className="small">{DAYS[i]} {c.iso.slice(8)}<div className="muted xs">{c.kind === 'class' ? (c.course ? `Day ${c.course.day} · ${c.course.title}` : 'class') : c.kind === 'halfday' ? 'half day' : c.kind}</div></th>)}</tr></thead>
        <tbody>
          {b.learners.map(l => (
            <tr key={l.userId}><td className="bold">{l.name}</td>
              {l.cells.map(c => { const col = b.cols.find(x => x.iso === c.iso)!; return (
                <td key={c.iso} className="small">
                  {col.kind !== 'class' ? <span className="muted">—</span> : <>
                    <div>{c.done ? <span className="wk-ok bold">Day done</span> : c.iso < today ? <span className="wk-warn">Day pending</span> : <span className="muted">—</span>}</div>
                    <div className="row gap-4 wrap">{blocks.map(bl => { const m = (c.marks as Record<string, M>)[bl.key] ?? null; return (
                      <button key={bl.key} type="button" className="btn btn-outline btn-sm" style={{ height: 26, padding: '0 8px', fontWeight: m?.source === 'mentor' ? 800 : 500, opacity: m?.source === 'learner' ? 0.75 : 1 }} disabled={!b.canMark || c.iso > today} title={`${bl.label}: ${m ? `${m.status} (${m.source})` : 'not marked'}`} onClick={() => mark(l.userId, c.iso, bl.key, m)}>
                        {bl.label.slice(0, 3)} {m ? SHOW[m.status] : '·'}
                      </button>); })}</div>
                  </>}
                </td>); })}
            </tr>
          ))}
          {!b.learners.length && <tr><td colSpan={8} className="muted">No learners in this cohort yet.</td></tr>}
        </tbody>
        {b.learners.length > 0 && <tfoot><tr><td className="bold small">Totals</td>{b.cols.map(c => { const s = summary.find(x => x.iso === c.iso); return <td key={c.iso} className="xs">{s ? <>{s.done}/{b.learners.length} days done<br />{blocks.map(bl => `${bl.label} ${s.present[bl.key]}`).join(' · ')}</> : null}</td>; })}</tr></tfoot>}
      </table></div>
    </div>
  );
}
