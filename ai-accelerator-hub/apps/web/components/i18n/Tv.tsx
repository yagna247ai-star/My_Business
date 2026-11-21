'use client';
/** Translates a displayed value when it is interface text; numbers, elements and unknown text pass through unchanged. */
import type { ReactNode } from 'react';
import { useT } from './I18nProvider';

export function Tv({ v }: { v: ReactNode }) {
  const t = useT();
  return <>{typeof v === 'string' ? t(v) : v}</>;
}
