'use client';
/**
 * Track picker for domains that offer difficulty tracks (Easy, Intermediate, Hard, Critical), with the Ikigai quiz.
 * The learner chooses; the quiz only recommends. The track can change until Module 1 is complete, then it is fixed.
 */
import { useState } from 'react';
import { EDUCATION_TRACKS, IKIGAI_QUIZ, TRACK_LABEL, recommendTrack } from '@/lib/domain/daDomains/dossiers/education-tracks';
import type { TrackLevel } from '@/lib/domain/daDomains/dossiers/types';

export const TRACK_META: Record<string, { tracks: typeof EDUCATION_TRACKS }> = { education: { tracks: EDUCATION_TRACKS } };

type Option = { slug: string; track: string };
const CIRCLE: Record<string, string> = { love: 'What you love', skills: 'What you are good at', needs: 'What the world needs', paid: 'What you can be paid for', time: 'Your time' };

export function TrackPicker({ domain, options, value, onPick, ack, onAck, disabled, error }: {
  domain: string; options: Option[]; value: string; onPick: (slug: string) => void; ack: boolean; onAck: (v: boolean) => void; disabled?: boolean; error?: string;
}) {
  const meta = TRACK_META[domain];
  const [answers, setAnswers] = useState<number[]>([]);
  if (!meta) return null;
  const chosen = options.find(o => o.slug === value)?.track as TrackLevel | undefined;
  const done = answers.filter(a => a !== undefined).length === IKIGAI_QUIZ.length;
  const rec = done ? recommendTrack(answers).level : null;
  const slugFor = (l: TrackLevel) => options.find(o => o.track === l)?.slug;

  return (
    <div className="stack gap-8" style={{ marginTop: 12 }}>
      <span className="field-label" id="trackLabel">Your track</span>
      <span className="small text-2">Each track is a different problem from the same school group, with its own data, steps and solution. You can change track until you finish Module 1; after that your track stays fixed to Day 45.</span>
      <details className="card card-pad" style={{ padding: 12 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Not sure? Find your track (5 questions)</summary>
        <div className="stack gap-8" style={{ marginTop: 10 }}>
          {IKIGAI_QUIZ.map((q, i) => (
            <fieldset key={i} style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className="small"><span className="text-2" style={{ textTransform: 'uppercase', letterSpacing: '.06em', fontSize: 11 }}>{CIRCLE[q.circle]}</span><br /><b>{q.question}</b></legend>
              {q.options.map((o, j) => (
                <label key={j} className="small" style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer', marginTop: 4 }}>
                  <input type="radio" name={`ikigai-${i}`} checked={answers[i] === j} disabled={disabled} onChange={() => setAnswers(a => { const n = [...a]; n[i] = j; return n; })} style={{ marginTop: 3, flex: 'none' }} />
                  <span>{o.label}</span>
                </label>
              ))}
            </fieldset>
          ))}
          {rec && (
            <p className="callout info small" role="status" style={{ margin: 0 }}>
              <span>Recommended for you: <b>{TRACK_LABEL[rec]}</b> — {meta.tracks.find(t => t.level === rec)!.title}.{' '}
                {slugFor(rec) && <button type="button" className="link" onClick={() => onPick(slugFor(rec)!)} disabled={disabled}>Choose it</button>}</span>
            </p>
          )}
        </div>
      </details>
      <div role="radiogroup" aria-labelledby="trackLabel" className="stack gap-8" id="trackChoice">
        {meta.tracks.map(t => {
          const slug = slugFor(t.level);
          if (!slug) return null;
          return (
            <label key={t.level} className="card card-pad" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', padding: 12, borderColor: value === slug ? 'var(--gold, currentColor)' : undefined }}>
              <input type="radio" name="track" value={t.level} aria-label={`${TRACK_LABEL[t.level]} track`} checked={value === slug} disabled={disabled} onChange={() => onPick(slug)} style={{ marginTop: 3, flex: 'none' }} />
              <span style={{ minWidth: 0 }}>
                <b>{TRACK_LABEL[t.level]}: {t.title}</b>{rec === t.level && <span className="badge badge-gold" style={{ marginLeft: 8 }}>Recommended</span>}
                <span className="small text-2" style={{ display: 'block' }}>{t.question}</span>
                <span className="small text-2" style={{ display: 'block', marginTop: 2 }}>{t.effort} · {t.scope.find(s => s.label.startsWith('Source'))?.value}</span>
              </span>
            </label>
          );
        })}
      </div>
      {chosen === 'critical' && (
        <label className="small callout warn" htmlFor="trackAck" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', margin: 0 }}>
          <input id="trackAck" type="checkbox" checked={ack} onChange={e => onAck(e.target.checked)} disabled={disabled} style={{ marginTop: 3, flex: 'none', width: 16, height: 16 }} />
          <span>I understand the Critical track rules: I will use synthetic data only and never real disclosures; a person always decides, and the system never contacts a child or family; children’s data is shown only to people who need it.</span>
        </label>
      )}
      {error && <div className="field-err" role="alert">{error}</div>}
    </div>
  );
}
