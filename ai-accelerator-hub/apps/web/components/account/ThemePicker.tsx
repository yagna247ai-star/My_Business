'use client';
import { useEffect, useState } from 'react';

type Choice = 'system' | 'light' | 'dark' | 'sln';
const OPTIONS: { value: Choice; label: string; note: string }[] = [
  { value: 'system', label: 'Match my device', note: 'Light or dark, following your phone or laptop.' },
  { value: 'light', label: 'Light', note: 'Bright blue accents.' },
  { value: 'dark', label: 'Dark', note: 'Deep navy, easy on the eyes at night.' },
  { value: 'sln', label: 'SLN heritage', note: 'Cream and maroon, after the SLN Acharyulu Skill Development Center site.' },
];

/** Appearance: applied at once, and saved on this device only (a display preference, not learner data). */
export function ThemePicker() {
  const [value, setValue] = useState<Choice>('system');
  useEffect(() => {
    try { setValue(((localStorage.getItem('aih_theme') as Choice) || 'system')); } catch { /* private mode: keep default */ }
  }, []);

  function choose(v: Choice) {
    setValue(v);
    try { localStorage.setItem('aih_theme', v); } catch { /* not saved; still applied for this page */ }
    const h = document.documentElement;
    if (v === 'sln') h.setAttribute('data-theme', 'sln');
    else if (v === 'system') h.setAttribute('data-theme', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    else h.setAttribute('data-theme', v);
  }

  return (
    <section className="card card-pad stack gap-12" aria-labelledby="thT">
      <h2 className="h3" id="thT">Appearance</h2>
      <fieldset className="stack gap-8" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="muted small" style={{ marginBottom: 6 }}>Choose a theme. It is saved on this device.</legend>
        {OPTIONS.map(o => (
          <label key={o.value} className="row gap-12" style={{ alignItems: 'flex-start', cursor: 'pointer' }}>
            <input type="radio" name="theme" value={o.value} checked={value === o.value} onChange={() => choose(o.value)} style={{ marginTop: 4 }} />
            <span className="stack gap-2"><span className="bold">{o.label}</span><span className="muted xs">{o.note}</span></span>
          </label>
        ))}
      </fieldset>
    </section>
  );
}
