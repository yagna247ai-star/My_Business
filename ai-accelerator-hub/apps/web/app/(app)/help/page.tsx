import { Download } from 'lucide-react';
import { requireCtx } from '@/lib/server/context';
import { guarded } from '@/lib/server/page';
import { Markdown } from '@/components/learn/Markdown';
import { Tr } from '@/components/i18n/Tr';
import { GUIDE } from '@/lib/help/guide.generated';
import Link from 'next/link';
import { SECTION_LINK, sectionAnchor } from '@/lib/help/routes';
import { HELP_PDF } from '@/components/help/HelpButton';

export const metadata = { title: 'Help — The Simple Guide' };

async function Help() {
  await requireCtx();
  return (<>
    <section className="ph ph-plain"><span className="eyebrow"><Tr>Help</Tr></span><h1 id="pageTitle">{GUIDE.title}</h1>
      <p className="desc">{GUIDE.intro.split('\n').filter(Boolean).slice(-1)[0]}</p>
      <a className="btn btn-outline btn-sm" href={HELP_PDF} download style={{ marginTop: 10 }}><Download size={14} aria-hidden="true" /><Tr>Download the guide (PDF)</Tr></a></section>
    <div className="grid-12" style={{ alignItems: 'start' }}>
      <nav className="span-4 card card-pad" aria-label="Guide contents" style={{ position: 'sticky', top: 84 }}>
        <b className="small"><Tr>Contents</Tr></b>
        <ol className="small" style={{ margin: '8px 0 0', paddingLeft: 20, display: 'grid', gap: 4 }}>{GUIDE.sections.map(s => <li key={s.n}><a className="link" href={`#${sectionAnchor(s.n)}`}>{s.title}</a></li>)}</ol>
      </nav>
      <div className="span-8 stack gap-16">{GUIDE.sections.map(s => (
        <article key={s.n} id={sectionAnchor(s.n)} className="card card-pad" style={{ scrollMarginTop: 80 }} aria-labelledby={`hs-${s.n}`}>
          <h2 className="h2" id={`hs-${s.n}`} style={{ marginTop: 0 }}>{s.n}. {s.title}</h2>
          <Markdown md={s.md} />
          {SECTION_LINK[s.n] && <Link className="btn btn-outline btn-sm" href={SECTION_LINK[s.n].href} style={{ marginTop: 8 }}><Tr>{SECTION_LINK[s.n].label}</Tr> →</Link>}
        </article>))}</div>
    </div>
  </>);
}
export default guarded(Help);
