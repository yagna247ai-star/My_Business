'use client';
/**
 * Area picker (docs/AREA_PICKER_SPEC.md): districts and cities of Telangana and Andhra Pradesh, grouped by state,
 * with a search box that also matches other spellings ("Hyderabad", "Bagyanagar" → Bhagyanagar).
 */
import { useMemo, useState } from 'react';
import { areasByState, normaliseArea, searchAreas, DEFAULT_AREA } from '@/lib/domain/areas';
import { useT } from '@/components/i18n/I18nProvider';

export function AreaPicker({ value, onChange, id, label }: { value: string; onChange: (v: string) => void; id?: string; label?: string }) {
  const t = useT();
  const [q, setQ] = useState('');
  const current = normaliseArea(value) ?? DEFAULT_AREA;
  const groups = useMemo(() => {
    const hits = new Set(searchAreas(q));
    return areasByState().map(g => ({ ...g, areas: g.areas.filter(a => hits.has(a) || a === current) })).filter(g => g.areas.length);
  }, [q, current]);
  return (
    <span className="stack gap-8" style={{ minWidth: 220 }}>
      <input className="input" type="search" value={q} placeholder={t('Search: e.g. Warangal, Vijayawada')} aria-label={t('Search areas')} onChange={e => setQ(e.target.value)} />
      <select className="select" id={id} aria-label={label ?? t('My area')} value={current} onChange={e => onChange(e.target.value)}>
        {groups.map(g => <optgroup key={g.state} label={g.state}>{g.areas.map(a => <option key={a} value={a}>{a}</option>)}</optgroup>)}
      </select>
    </span>
  );
}
