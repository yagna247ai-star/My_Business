/** A lesson page rendered from its Markdown, exactly as learners see it (day pages and Content review share this). */
import { parseMarkdown, parseInline, type Block } from '@/lib/domain/lessonMarkdown';
import { Tv } from '@/components/i18n/Tv';

function Inline({ text }: { text: string }) {
  return <>{parseInline(text).map((p, i) => p.kind === 'bold' ? <strong key={i}><Tv v={p.text} /></strong> : p.kind === 'code' ? <code key={i} className="mono" style={{ padding: '1px 5px', borderRadius: 6, background: 'var(--surface-3)' }}>{p.text}</code> : <span key={i}><Tv v={p.text} /></span>)}</>;
}

export function Render({ block }: { block: Block }) {
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
    case 'img': return (
      <figure style={{ margin: '14px 0' }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- own-site screenshots, sized by CSS */}
        <img src={block.src} alt={block.alt} loading="lazy" style={{ width: '100%', height: 'auto', borderRadius: 12, border: '1px solid var(--border)', boxShadow: '0 6px 24px rgba(10,15,30,.08)' }} />
        {block.alt && <figcaption className="muted small" style={{ marginTop: 6, textAlign: 'center' }}><Tv v={block.alt} /></figcaption>}
      </figure>
    );
    case 'code': return <pre className="mono" style={{ margin: '12px 0', padding: 14, borderRadius: 12, background: 'var(--surface-3)', overflowX: 'auto', fontSize: 13, lineHeight: 1.5 }}><code>{block.text}</code></pre>;
  }
}


export function Markdown({ md }: { md: string }) {
  return <>{parseMarkdown(md).map((b, i) => <Render key={i} block={b} />)}</>;
}
