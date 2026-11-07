'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Suspense, useState } from 'react';
import { AuthCard } from '@/components/auth/AuthCard';

function LoginForm() {
  const router = useRouter(); const sp = useSearchParams();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setBusy(true);
    const r = await signIn('credentials', { email, password, redirect: false });
    setBusy(false);
    if (!r || r.error) { setError('That email and password do not match, or the account is temporarily locked after too many attempts.'); return; }
    router.push(sp.get('next') || '/dashboard'); router.refresh();
  };
  return (
    <AuthCard title="Sign in" subtitle={sp.get('registered') ? 'Your account is ready. Sign in to start Level 1.' : 'Welcome back.'}>
      <form className="stack gap-16" onSubmit={submit} noValidate>
        <div><label className="field-label" htmlFor="email">Email</label><input className="input" id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div><label className="field-label" htmlFor="password">Password</label><input className="input" id="password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></div>
        {error && <p className="field-err" role="alert">{error}</p>}
        <button className="btn btn-gold btn-block" type="submit" disabled={busy || !email || !password}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <p className="small text-2">New here? <Link className="link" href="/register">Create an account</Link></p>
      </form>
    </AuthCard>
  );
}
export default function LoginPage() { return <Suspense><LoginForm /></Suspense>; }
