import Link from 'next/link';

export const metadata = { title: 'Page not found' };

/** Shown for unknown URLs and for records that don't exist or aren't yours (bug audit H4). */
export default function NotFound() {
  return (<main id="main" style={{ position: 'fixed', inset: 0, maxWidth: 'none', margin: 0, overflowY: 'auto', display: 'grid', placeItems: 'center', padding: 16, background: 'var(--bg, #F4F7FD)', color: 'var(--text, #0B1530)' }}>
    <div className="card empty" style={{ maxWidth: 480, width: '100%', background: 'var(--surface, #fff)', border: '1px solid var(--border, #E3E8F2)', borderRadius: 16, padding: 28, textAlign: 'center' }}>
      <p className="eyebrow" style={{ margin: 0 }}>404</p>
      <h1 className="h3" style={{ marginTop: 6 }}>We couldn’t find that page</h1>
      <p className="text-2" style={{ marginTop: 6 }}>The link may be old, mistyped, or for something you don’t have access to.</p>
      <div className="row gap-8 wrap" style={{ justifyContent: 'center', marginTop: 14 }}>
        <Link className="btn btn-gold btn-sm" href="/dashboard">Go to my home page</Link>
        <Link className="btn btn-outline btn-sm" href="/">Main site</Link>
      </div>
    </div>
  </main>);
}
