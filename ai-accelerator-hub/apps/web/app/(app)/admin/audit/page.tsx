import { requirePerm } from '@/lib/server/context';
import { auditLog } from '@/lib/domain/admin';
import { guarded } from '@/lib/server/page';

export const metadata = { title: 'Audit Log' };
async function Audit({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const ctx = await requirePerm('audit:read'); const q = ((await searchParams).q || '').slice(0, 60);
  const rows = await auditLog(ctx, q);
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle">Audit log</h1><p className="desc">Append-only record of sign-ins, reviews, role changes, consent, payments and data exports in {ctx.tenantName}.</p></section>
    <form className="row gap-12" style={{ margin: '16px 0' }} role="search"><label className="sr-only" htmlFor="q">Filter by action</label><input className="input" id="q" name="q" defaultValue={q} placeholder="Filter by action, e.g. review, auth, privacy" style={{ maxWidth: 360 }} /><button className="btn btn-outline" type="submit">Filter</button></form>
    <div className="card table-wrap"><table className="tbl"><caption className="sr-only">Audit log</caption><thead><tr><th>When (IST)</th><th>Actor</th><th>Action</th><th>Resource</th></tr></thead><tbody>{rows.length ? rows.map(r => <tr key={r.id}><td className="small">{r.at.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td><td className="bold">{r.actor}</td><td><span className="badge badge-neutral mono">{r.action}</span></td><td className="small">{r.resource}{r.resourceId ? ` · ${r.resourceId.slice(-8)}` : ''}</td></tr>) : <tr><td colSpan={4} className="muted">No matching entries.</td></tr>}</tbody></table></div>
  </>);
}

export default guarded(Audit);
