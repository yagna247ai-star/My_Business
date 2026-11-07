'use client';
/** Fallback for unexpected page errors (bug audit H4): calm message, retry, and a reference for support. */
import Link from 'next/link';
import { useEffect } from 'react';

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (<div className="card empty" role="alert">
    <h1 className="h3">Something went wrong on this page</h1>
    <p className="text-2" style={{ marginTop: 6, maxWidth: '56ch', marginInline: 'auto' }}>Nothing you did is lost. Try again, or go back to your home page. If it keeps happening, tell your mentor{error.digest ? <> and quote reference <code>{error.digest}</code></> : null}.</p>
    <div className="row gap-8 wrap" style={{ justifyContent: 'center', marginTop: 14 }}>
      <button className="btn btn-gold btn-sm" type="button" onClick={reset}>Try again</button>
      <Link className="btn btn-outline btn-sm" href="/dashboard">Go to my home page</Link>
    </div>
  </div>);
}
