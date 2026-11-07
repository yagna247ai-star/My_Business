/**
 * Page guard (bug audit H4). Domain helpers throw AppError (401/403/404) — right for API routes,
 * but in a page an uncaught throw renders a 500. `guarded` maps them to what a person expects:
 *   401 → sign-in page · 403 → a no-access card with a way home · 404 → the not-found page.
 * Anything else is rethrown to app/(app)/error.tsx.
 */
import * as React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ShieldOff } from 'lucide-react';
import { AppError } from './errors';

export function NoAccess({ message }: { message: string }) {
  return (<div className="card empty" role="alert">
    <div className="ic-wrap"><ShieldOff size={22} aria-hidden="true" /></div>
    <h1 className="h3">This page isn’t available to you</h1>
    <p className="text-2" style={{ marginTop: 6, maxWidth: '56ch', marginInline: 'auto' }}>{message}</p>
    <Link className="btn btn-gold btn-sm" style={{ marginTop: 14 }} href="/dashboard">Go to my home page</Link>
  </div>);
}

export function guarded<P>(Page: (props: P) => Promise<React.ReactNode>) {
  return async function GuardedPage(props: P) {
    try {
      return await Page(props);
    } catch (e) {
      if (!(e instanceof AppError)) throw e; // includes Next's own redirect()/notFound() signals
      if (e.status === 401) redirect('/login');
      if (e.status === 404) notFound();
      if (e.status === 403) return <NoAccess message={e.message === 'You do not have permission to do that.' ? 'Your role doesn’t include this page. Use the menu on the left to find the pages for your role.' : e.message} />;
      return <NoAccess message={e.message} />;
    }
  };
}
