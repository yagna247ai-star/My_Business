import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { GUIDE } from '@/lib/help/guide.generated';
import { helpSectionsFor, sectionByNumber } from '@/lib/help/routes';

const MD = join(__dirname, '../../../docs/help/SIMPLE_GUIDE.md');

describe('Simple Guide help', () => {
  it('the generated help matches docs/help/SIMPLE_GUIDE.md (run node scripts/help-build.mjs after editing it)', () => {
    const md = readFileSync(MD, 'utf8');
    const headings = [...md.matchAll(/^## (\d+)\.\s+(.+)$/gm)].map(m => `${m[1]}. ${m[2].trim()}`);
    expect(GUIDE.sections.map(s => `${s.n}. ${s.title}`)).toEqual(headings);
    for (const s of GUIDE.sections) expect(md).toContain(s.md.split('\n')[0]);
  });
  it('every page shows sections that exist, and the right ones for key pages', () => {
    for (const p of ['/dashboard', '/levels', '/levels/DA02_SQL/days/6', '/levels/X/activities/1', '/showcase', '/admin/showcase', '/review', '/coach', '/settings', '/billing', '/somewhere-new'])
      for (const n of helpSectionsFor(p)) expect(sectionByNumber(n), `${p} → ${n}`).toBeTruthy();
    expect(helpSectionsFor('/levels/DA02_SQL/days/6')).toContain(5);
    expect(helpSectionsFor('/levels/X/activities/1')).toContain(10);
    expect(helpSectionsFor('/admin/showcase')).toEqual([11, 14]);
    expect(helpSectionsFor('/review/abc')).toEqual([13]);
  });
  it('the PDF of the guide is published with the app', () => {
    expect(existsSync(join(__dirname, '../public/help/AI_Accelerator_Hub_Simple_Guide.pdf'))).toBe(true);
  });
});
