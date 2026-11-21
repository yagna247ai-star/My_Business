import { requirePerm } from '@/lib/server/context';
import { listPlans } from '@/lib/payments/razorpay';
import { Plans } from '@/components/account/Plans';
import { guarded } from '@/lib/server/page';
import { Tr } from '@/components/i18n/Tr';
import { Tv } from '@/components/i18n/Tv';

export const metadata = { title: 'Plans & Billing' };
async function Billing() {
  const ctx = await requirePerm('billing:self');
  const d = await listPlans(ctx);
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle"><Tr>Plans &amp; billing</Tr></h1><p className="desc"><Tr>Payments run on Razorpay&apos;s hosted checkout (UPI, cards, net banking). We never see or store card details, and access is granted only after the payment is verified server-side.</Tr></p></section>
    {!d.configured && <p className="callout info small" style={{ margin: '16px 0' }}><Tr>Online payments are not enabled for this deployment yet. Enrolment through your institution works as usual.</Tr></p>}
    <div style={{ marginTop: 16 }}><Plans plans={d.plans} configured={d.configured} /></div>
    <section className="card" style={{ marginTop: 24 }}><h2 className="h3" style={{ padding: '18px 20px 0' }}><Tr>Invoices</Tr></h2>{d.invoices.length ? <div className="table-wrap" style={{ marginTop: 10 }}><table className="tbl"><thead><tr><th><Tr>Invoice</Tr></th><th><Tr>Date</Tr></th><th style={{ textAlign: 'right' }}>GST</th><th style={{ textAlign: 'right' }}><Tr>Total</Tr></th></tr></thead><tbody>{d.invoices.map(i => <tr key={i.no}><td className="mono"><Tv v={i.no} /></td><td>{new Date(i.at).toLocaleDateString('en-IN')}</td><td className="num" style={{ textAlign: 'right' }}>₹{i.gstInr.toFixed(2)}</td><td className="num bold" style={{ textAlign: 'right' }}>₹{i.amountInr.toFixed(2)}</td></tr>)}</tbody></table></div> : <p className="text-2" style={{ padding: 20 }}><Tr>No invoices yet.</Tr></p>}</section>
  </>);
}

export default guarded(Billing);
