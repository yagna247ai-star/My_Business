/** All 17 industry domains, sorted by name. Each carries one flagship problem through the 40-day journey. */
import { DOMAINS_A } from './catalog-a';
import { DOMAINS_B } from './catalog-b';
import { ENTERPRISE } from './enterprise';
import type { DomainSpec } from './types';

export type { DomainSpec };
type Draft = Omit<DomainSpec, 'enterprise'>;
const withProfile = (d: Draft): DomainSpec => {
  const enterprise = ENTERPRISE[d.slug];
  if (!enterprise) throw new Error(`No enterprise profile for domain ${d.slug}`);
  return { ...d, enterprise };
};
export const DOMAINS: DomainSpec[] = ([...DOMAINS_A, ...DOMAINS_B] as Draft[]).map(withProfile).sort((a, b) => a.name.localeCompare(b.name));
export const domainBySlug = (slug: string) => DOMAINS.find(d => d.slug === slug) ?? null;
