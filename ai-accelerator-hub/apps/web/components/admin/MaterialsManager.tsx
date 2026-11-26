'use client';
import { useMemo, useState } from 'react';
import { DayMaterialsAdmin } from './DayMaterialsAdmin';

type Day = { contentId: string; day: number; title: string; materials: number };
type Course = { id: string; title: string; levels: { id: string; idx: number; title: string; days: Day[] }[] };

export function MaterialsManager({ courses, initialDay }: { courses: Course[]; initialDay: string | null }) {
  const start = useMemo(() => { for (const c of courses) for (const l of c.levels) for (const d of l.days) if (d.contentId === initialDay) return { c: c.id, l: l.id, d: d.contentId }; const c = courses[0]; const l = c?.levels.find(x => x.days.length); return { c: c?.id ?? '', l: l?.id ?? '', d: l?.days[0]?.contentId ?? '' }; }, [courses, initialDay]);
  const [cid, setCid] = useState(start.c); const [lid, setLid] = useState(start.l); const [did, setDid] = useState(start.d);
  const course = courses.find(c => c.id === cid); const level = course?.levels.find(l => l.id === lid); const day = level?.days.find(d => d.contentId === did);
  if (!courses.length) return <p className="muted">No courses in this institution yet.</p>;
  return (
    <div className="stack gap-12">
      <div className="card card-pad row gap-12 wrap">
        <label className="stack gap-4 small"><span className="bold">Course</span><select className="select" value={cid} onChange={e => { const c = courses.find(x => x.id === e.target.value); const l = c?.levels.find(x => x.days.length); setCid(e.target.value); setLid(l?.id ?? ''); setDid(l?.days[0]?.contentId ?? ''); }}>{courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
        <label className="stack gap-4 small"><span className="bold">Level</span><select className="select" value={lid} onChange={e => { const l = course?.levels.find(x => x.id === e.target.value); setLid(e.target.value); setDid(l?.days[0]?.contentId ?? ''); }}>{course?.levels.map(l => <option key={l.id} value={l.id} disabled={!l.days.length}>L{l.idx} · {l.title}{l.days.length ? '' : ' (no days)'}</option>)}</select></label>
        <label className="stack gap-4 small"><span className="bold">Day</span><select className="select" value={did} onChange={e => setDid(e.target.value)}>{level?.days.map(d => <option key={d.contentId} value={d.contentId}>Day {d.day} · {d.title.slice(0, 50)}{d.materials ? ` (${d.materials})` : ''}</option>)}</select></label>
      </div>
      {day ? <DayMaterialsAdmin key={day.contentId} contentId={day.contentId} day={day.day} /> : <p className="muted">This level has no day lessons.</p>}
    </div>
  );
}
