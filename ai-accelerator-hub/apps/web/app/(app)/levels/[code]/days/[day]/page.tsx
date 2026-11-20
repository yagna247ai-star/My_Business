import Link from 'next/link';
import { Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requirePerm } from '@/lib/server/context';
import { getEnrollment } from '@/lib/domain/journey';
import { parseMarkdown, parseInline, type Block } from '@/lib/domain/lessonMarkdown';
import { guarded } from '@/lib/server/page';

export const dynamic = 'force-dynamic';

function Inline({ text }: { text: string }) {
  return <>{parseInline(text).map((p, i) => p.kind === 'bold' ? <strong key={i}>{p.text}</strong> : p.kind === 'code' ? <code key={i} className="mono" style={{ padding: '1px 5px', borderRadius: 6, background: 'var(--surface-3)' }}>{p.text}</code> : <span key={i}>{p.text}</span>)}</>;
}

function Render({ block }: { block: Block }) {
  switch (block.type) {
    case 'h': {
      const Tag = block.level === 1 ? 'h1' : block.level === 2 ? 'h2' : 'h3';
      return <Tag className={block.level === 1 ? 'h2' : 'h3'} style={{ marginTop: block.level === 1 ? 0 : 22, marginBottom: 8 }}><Inline text={block.text} /></Tag>;
    }
    case 'p': return <p style={{ margin: '8px 0', lineHeight: 1.6 }}><Inline text={block.text} /></p>;
    case 'quote': return <blockquote className="card" style={{ margin: '12px 0', padding: '10px 14px', borderLeft: '4px solid var(--primary)', background: 'var(--gold-tint)' }}><Inline text={block.text} /></blockquote>;
    case 'ul': return <ul style={{ margin: '8px 0', paddingLeft: 22, lineHeight: 1.6, listStyle: 'disc' }}>{block.items.map((x, i) => <li key={i}><Inline text={x} /></li>)}</ul>;
    case 'ol': return <ol style={{ margin: '8px 0', paddingLeft: 26, lineHeight: 1.6, listStyle: 'decimal' }}>{block.items.map((x, i) => <li key={i}><Inline text={x} /></li>)}</ol>;
    case 'table': return (
      <div style={{ overflowX: 'auto', margin: '12px 0' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14 }}>
          <thead><tr>{block.header.map((h, i) => <th key={i} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--border)' }}><Inline text={h} /></th>)}</tr></thead>
          <tbody>{block.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', verticalAlign: 'top' }}><Inline text={c} /></td>)}</tr>)}</tbody>
        </table>
      </div>
    );
    case 'code': return <pre className="mono" style={{ margin: '12px 0', padding: 14, borderRadius: 12, background: 'var(--surface-3)', overflowX: 'auto', fontSize: 13, lineHeight: 1.5 }}><code>{block.text}</code></pre>;
  }
}

async function DayPage({ params }: { params: Promise<{ code: string; day: string }> }) {
  const { code, day } = await params;
  const dayNo = Number(day);
  const ctx = await requirePerm('learn:self');
  const enrollment = await getEnrollment(ctx);
  const level = await prisma.level.findFirst({ where: { tenantId: ctx.tenantId, journeyId: enrollment.journeyId, code } });
  if (!level) return <div className="card empty"><h1 className="h3">Module not found</h1></div>;
  const progress = await prisma.progress.findUnique({ where: { enrollmentId_levelId: { enrollmentId: enrollment.id, levelId: level.id } } });
  if (!progress || progress.state === 'locked') {
    return <div className="card empty"><div className="ic-wrap"><Lock size={22} /></div><h1 className="h3">{level.title} is locked</h1><p className="text-2" style={{ marginTop: 6 }}>Finish the earlier module first.</p></div>;
  }
  const content = await prisma.content.findFirst({ where: { levelId: level.id, kind: 'md', position: dayNo } });
  if (!content) return <div className="card empty"><h1 className="h3">Day {dayNo} is not in {level.title}</h1></div>;

  const [prev, next] = await Promise.all([
    prisma.content.findFirst({ where: { kind: 'md', position: dayNo - 1, level: { journeyId: enrollment.journeyId, tenantId: ctx.tenantId } }, select: { position: true, level: { select: { code: true } } } }),
    prisma.content.findFirst({ where: { kind: 'md', position: dayNo + 1, level: { journeyId: enrollment.journeyId, tenantId: ctx.tenantId } }, select: { position: true, level: { select: { code: true } } } }),
  ]);
  const body = (JSON.parse(content.payload || '{}').body as string) || '';
  const blocks = parseMarkdown(body);

  return (<>
    <section className="ph ph-plain" style={{ marginBottom: 14 }}>
      <span className="eyebrow">{level.title} · Day {dayNo} of 45</span>
      <h1 id="pageTitle" className="sr-only">{content.title}</h1>
      <div className="row between wrap gap-12" style={{ marginTop: 6 }}>
        <div className="bar" style={{ flex: 1, minWidth: 200 }} aria-label={`Day ${dayNo} of 45`}><i style={{ width: `${(dayNo / 45) * 100}%` }} /></div>
        <span className="muted small">{Math.round((dayNo / 45) * 100)}% of the 45 days</span>
      </div>
    </section>
    <article className="card card-pad" style={{ maxWidth: 820 }} aria-label={content.title || `Day ${dayNo}`}>
      {blocks.map((b, i) => <Render key={i} block={b} />)}
    </article>
    <nav className="row between wrap gap-12" aria-label="Day navigation" style={{ marginTop: 18, maxWidth: 820 }}>
      {prev ? <Link className="btn btn-outline" href={`/levels/${prev.level.code}/days/${prev.position}`}><ChevronLeft size={16} /> Day {prev.position}</Link> : <span />}
      {next ? <Link className="btn btn-primary" href={`/levels/${next.level.code}/days/${next.position}`}>Day {next.position} <ChevronRight size={16} /></Link> : <span />}
    </nav>
  </>);
}

export default guarded(DayPage);
