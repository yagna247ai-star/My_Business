import { ExternalLink, ShieldCheck, AlertTriangle, Lock } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireCtx } from '@/lib/server/context';
import { guarded } from '@/lib/server/page';

export const metadata = { title: 'Open-source Library' };
const CAT: Record<string, string> = { learning: 'Learning', voice_ai: 'Voice & speech AI', agents: 'AI agents', rag: 'RAG', search: 'AI search', workspace: 'AI workspace', llm_gateway: 'LLM gateways & routing', ai_coding: 'AI coding & app builders', image_gen: 'Image generation', video_gen: 'Video generation', music: 'Music generation', multimodal: 'Multimodal & vision' };
const CLASS = { permissive: { cls: 'badge-success', I: ShieldCheck, t: 'Permissive' }, copyleft: { cls: 'badge-warn', I: AlertTriangle, t: 'Copyleft' }, mixed: { cls: 'badge-warn', I: AlertTriangle, t: 'Mixed licence' }, none: { cls: 'badge-neutral', I: Lock, t: 'No licence — study only' } } as const;
async function Library() {
  await requireCtx();
  const items = await prisma.libraryResource.findMany({ orderBy: [{ category: 'asc' }, { fullName: 'asc' }] });
  const cats = [...new Set(items.map(i => i.category))];
  return (<>
    <section className="ph ph-cream"><div style={{ position: 'relative' }}><span className="eyebrow">GitHub Lab</span><h1 id="pageTitle">A verified open-source library</h1><p className="desc">Every project links to its original upstream repository. Licence, activity and archive status come from the GitHub API, with the date we last checked. Visible code is not automatically open source — read the usage note before you fork.</p></div></section>
    {cats.map(c => (
      <section key={c} style={{ marginBottom: 24 }} aria-labelledby={`c-${c}`}><h2 className="h3" id={`c-${c}`} style={{ marginBottom: 10 }}>{CAT[c] || c}</h2>
        <div className="track-grid">{items.filter(i => i.category === c).map(i => { const k = CLASS[i.licenseClass as keyof typeof CLASS] || CLASS.none; return (
          <article key={i.id} className="card trk"><div className="row between gap-12" style={{ alignItems: 'flex-start' }}><div style={{ minWidth: 0 }}><h3 className="h3" style={{ overflowWrap: 'anywhere' }}>{i.fullName}</h3><p className="text-2 small" style={{ marginTop: 4 }}>{i.description}</p></div><a className="btn btn-outline btn-sm" href={i.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${i.fullName} on GitHub`}><ExternalLink size={14} /></a></div>
            <div className="row gap-8 wrap"><span className={`badge ${k.cls}`}><k.I size={13} />{i.licenseSpdx || 'None'} · {k.t}</span><span className="badge badge-neutral">{i.difficulty}</span>{i.levelIdx && <span className="badge badge-gold">Level {i.levelIdx}</span>}{i.archived && <span className="badge badge-warn">Archived</span>}</div>
            <p className="gate small">{i.usageNote}</p>
            <p className="muted xs">Prerequisites: {i.prerequisites} · last push {i.lastPushedAt || '—'} · verified {i.lastVerified}</p>
          </article>); })}</div>
      </section>
    ))}
  </>);
}

export default guarded(Library);
