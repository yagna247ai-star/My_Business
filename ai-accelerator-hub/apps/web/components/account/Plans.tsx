'use client';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, ApiError } from '@/lib/client/api';
import { Tr } from '@/components/i18n/Tr';
import { Tv } from '@/components/i18n/Tv';

type Plan = { slug: string; name: string; amountInr: number; interval: string };
declare global { interface Window { Razorpay?: new (o: Record<string, unknown>) => { open: () => void } } }
export function Plans({ plans, configured }: { plans: Plan[]; configured: boolean }) {
  const router = useRouter(); const [err, setErr] = useState(''); const [busy, setBusy] = useState('');
  const buy = async (slug: string) => {
    setErr(''); setBusy(slug);
    try {
      const o = await api<{ razorpayOrderId: string; amount: number; currency: string; keyId: string }>('/api/v1/billing/orders', { body: { planSlug: slug } });
      if (!window.Razorpay) throw new Error('Checkout failed to load. Check your connection and try again.');
      // Hosted checkout. Success here is NOT trusted: access is granted only after the signed webhook arrives.
      new window.Razorpay({ key: o.keyId, order_id: o.razorpayOrderId, amount: o.amount, currency: o.currency, name: 'AI Accelerator Hub', handler: () => { setTimeout(() => router.refresh(), 3000); } }).open();
    } catch (e) { setErr((e as ApiError).message || String(e)); } finally { setBusy(''); }
  };
  return (<>
    {configured && <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />}
    {err && <p className="callout warn small" role="alert" style={{ marginBottom: 12 }}><Tv v={err} /></p>}
    <div className="track-grid">{plans.map(p => <article key={p.slug} className="card trk"><h2 className="h3">{p.name}</h2><div className="kpi" style={{ padding: 0 }}><div className="v">{p.amountInr ? `₹${p.amountInr.toLocaleString('en-IN')}` : <Tr>Free</Tr>}</div><div className="d">{p.amountInr ? `per ${p.interval === 'yearly' ? 'year' : p.interval === 'monthly' ? 'month' : 'purchase'} · GST included` : <Tr>Level 1 and the community</Tr>}</div></div>{p.amountInr > 0 && <button className="btn btn-gold" type="button" disabled={!configured || busy === p.slug} onClick={() => buy(p.slug)}>{configured ? (busy === p.slug ? <Tr>Opening checkout…</Tr> : <Tr>Choose plan</Tr>) : <Tr>Online payment not enabled yet</Tr>}</button>}</article>)}</div>
  </>);
}
