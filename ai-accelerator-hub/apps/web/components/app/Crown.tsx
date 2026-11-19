/**
 * Gold SVG crown: three points with jewels and a band of diamonds.
 * tier 1 = gold, 2 = silver, 3 = bronze. Works in server and client components (no hooks).
 * Gradient ids are fixed per tier; repeated definitions are identical, so reuse on one page is safe.
 */
const TIERS = {
  1: { light: '#FFE58A', mid: '#E8B94F', dark: '#A8781C', jewel: '#C0392B', name: 'Gold' },
  2: { light: '#F4F6F8', mid: '#C3C9D1', dark: '#7D8590', jewel: '#2E6FD8', name: 'Silver' },
  3: { light: '#F2C39A', mid: '#C98A55', dark: '#8A5326', jewel: '#1E8F5A', name: 'Bronze' },
} as const;

export type CrownTier = 1 | 2 | 3;

export function Crown({ tier = 1, size = 18, title }: { tier?: CrownTier; size?: number; title?: string }) {
  const c = TIERS[tier];
  const id = `crown-grad-${tier}`;
  return (
    <svg className="crown-svg" width={size} height={size * 0.8} viewBox="0 0 40 32" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} focusable="false">
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.light} />
          <stop offset="0.55" stopColor={c.mid} />
          <stop offset="1" stopColor={c.dark} />
        </linearGradient>
      </defs>
      {/* three points */}
      <path d="M3 24 L5 9 L13 17 L20 4 L27 17 L35 9 L37 24 Z" fill={`url(#${id})`} stroke={c.dark} strokeWidth="1.4" strokeLinejoin="round" />
      {/* jewels on the tips */}
      <circle cx="5" cy="8.5" r="2.4" fill={c.jewel} stroke={c.dark} strokeWidth="0.8" />
      <circle cx="20" cy="3.6" r="2.6" fill={c.jewel} stroke={c.dark} strokeWidth="0.8" />
      <circle cx="35" cy="8.5" r="2.4" fill={c.jewel} stroke={c.dark} strokeWidth="0.8" />
      {/* band with diamonds */}
      <rect x="3" y="23.5" width="34" height="6.5" rx="1.6" fill={`url(#${id})`} stroke={c.dark} strokeWidth="1.4" />
      {[11, 20, 29].map(x => <path key={x} d={`M${x} 24.6 L${x + 2.2} 26.75 L${x} 28.9 L${x - 2.2} 26.75 Z`} fill={c.light} stroke={c.dark} strokeWidth="0.6" />)}
    </svg>
  );
}

export const crownTierName = (tier: CrownTier) => TIERS[tier].name;
