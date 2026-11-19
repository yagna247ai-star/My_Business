/**
 * Client-safe helpers for review feedback (no database). The automated reviewer writes each gap as
 * "<Area>: <what to do>." These turn that text into highlighted items, each with the points a fix earns.
 */
export const GAP_POINTS: Record<string, number> = { Boss: 5, Reflection: 3, Method: 3, 'Data checks': 2 };

export type Gap = { area: string; text: string; points: number };

export function parseGaps(feedback: string | null | undefined): Gap[] {
  if (!feedback) return [];
  const areas = Object.keys(GAP_POINTS).map(a => a.replace(' ', '\\s'));
  const re = new RegExp(`(${areas.join('|')}):\\s*([^]*?)(?=(?:${areas.join('|')}):|Fix these|$)`, 'g');
  const out: Gap[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(feedback)) !== null) {
    const area = m[1].replace(/\s+/g, ' ');
    out.push({ area, text: m[2].trim(), points: GAP_POINTS[area] ?? 1 });
  }
  return out;
}
