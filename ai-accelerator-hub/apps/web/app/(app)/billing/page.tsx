import { requirePerm } from '@/lib/server/context';
import { listPlans } from '@/lib/payments/razorpay';
import { Plans } from '@/components/account/Plans';
import { guarded } from '@/lib/server/page';

export const metadata = { title: 'Plans & Billing' };
async function Billing() {
  const ctx = await requirePerm('billing:self');
  const d = await listPlans(ctx);
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle">Plans &amp; billing</h1><p className="desc">Payments run on Razorpay&apos;s hosted checkout (UPI, cards, net banking). We never see or store card details, and access is granted only after the payment is verified server-side.</p></section>
    {!d.configured && <p className="callout info small" style={{ margin: '16px 0' }}>Online payments are not enabled for this deployment yet. Enrolment through your institution works as usual.</p>}
    <div style={{ marginTop: 16 }}><Plans plans={d.plans} configured={d.configured} /></div>
    <section className="card" style={{ marginTop: 24 }}><h2 className="h3" style={{ padding: '18px 20px 0' }}>Invoices</h2>{d.invoices.length ? <div className="table-wrap" style={{ marginTop: 10 }}><table className="tbl"><thead><tr><th>Invoice</th><th>Date</th><th style={{ textAlign: 'right' }}>GST</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead><tbody>{d.invoices.map(i => <tr key={i.no}><td className="mono">{i.no}</td><td>{new Date(i.at).toLocaleDateString('en-IN')}</td><td className="num" style={{ textAlign: 'right' }}>₹{i.gstInr.toFixed(2)}</td><td className="num bold" style={{ textAlign: 'right' }}>₹{i.amountInr.toFixed(2)}</td></tr>)}</tbody></table></div> : <p className="text-2" style={{ padding: 20 }}>No invoices yet.</p>}</section>
  </>);
}

export default guarded(Billing);
