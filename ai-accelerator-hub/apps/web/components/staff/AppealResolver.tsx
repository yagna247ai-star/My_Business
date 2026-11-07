'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, ApiError } from '@/lib/client/api';
export function AppealResolver({ reviewId }: { reviewId: string }) {
  const router = useRouter(); const [err, setErr] = useState('');
  const go = async (outcome: 'upheld' | 'overturned') => { try { await api(`/api/v1/appeals/${reviewId}/resolve`, { body: { outcome } }); router.refresh(); } catch (e) { setErr((e as ApiError).message); } };
  return <div className="row gap-8 wrap" style={{ marginTop: 8 }}><button className="btn btn-outline btn-sm" type="button" onClick={() => go('upheld')}>Uphold decision</button><button className="btn btn-gold btn-sm" type="button" onClick={() => go('overturned')}>Overturn — re-review</button>{err && <span className="field-err">{err}</span>}</div>;
}
