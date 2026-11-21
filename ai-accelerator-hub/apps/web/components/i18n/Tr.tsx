'use client';
/** Translates a plain piece of interface text: <Tr>Mark briefing complete</Tr>. Works inside server and client components. */
import { useT } from './I18nProvider';

export function Tr({ children }: { children: string }) {
  const t = useT();
  return <>{t(children.replace(/\s+/g, ' ').trim())}</>;
}
