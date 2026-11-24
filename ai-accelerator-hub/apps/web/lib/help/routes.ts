/**
 * Which sections of the Simple Guide the Help button shows on each page. Most specific path first; the first match
 * wins. Section numbers are the "## N." headings of docs/help/SIMPLE_GUIDE.md.
 */
import { GUIDE } from './guide.generated';

const RULES: [RegExp, number[]][] = [
  [/^\/levels\/[^/]+\/days\//, [5, 7]],
  [/^\/levels\/[^/]+\/activities\//, [6, 9, 10]],
  [/^\/levels/, [4, 7]],
  [/^\/dashboard/, [3, 8]],
  [/^\/onboarding/, [12, 3]],
  [/^\/agent-lab/, [12]],
  [/^\/hackathons/, [11]],
  [/^\/(achievements|ranks|leaderboard)/, [8]],
  [/^\/(feed|library)/, [11, 15]],
  [/^\/showcase/, [11, 9]],
  [/^\/coach/, [10]],
  [/^\/review/, [13]],
  [/^\/admin\/showcase/, [11, 14]],
  [/^\/admin\/moderation/, [14, 11]],
  [/^\/admin/, [14]],
  [/^\/settings\/(people|institute)/, [14, 2]],
  [/^\/settings/, [3, 15]],
  [/^\/(career|talent)/, [12, 15]],
  [/^\/billing/, [14]],
  [/^\/help/, [1]],
];

export function helpSectionsFor(pathname: string): number[] {
  const hit = RULES.find(([re]) => re.test(pathname));
  return hit ? hit[1] : [1, 2];
}

export const sectionByNumber = (n: number) => GUIDE.sections.find(s => s.n === n) ?? null;
export const sectionAnchor = (n: number) => `section-${n}`;

/** Where each section's feature lives, for the "Go to this page" button (none for sections that are not one page). */
export const SECTION_LINK: Record<number, { href: string; label: string }> = {
  3: { href: '/settings', label: 'Open Settings' },
  4: { href: '/levels', label: 'Open your Journey' },
  5: { href: '/levels', label: 'Open your Journey' },
  6: { href: '/levels', label: 'Open your Journey' },
  8: { href: '/achievements', label: 'Open Achievements' },
  10: { href: '/coach', label: 'Open AI Coaches' },
  11: { href: '/showcase', label: 'Open the Showcase' },
  12: { href: '/agent-lab', label: 'Open Agent Lab' },
  13: { href: '/review', label: 'Open the Review Queue' },
  14: { href: '/admin', label: 'Open Program pages' },
  15: { href: '/settings', label: 'Open Settings' },
};
