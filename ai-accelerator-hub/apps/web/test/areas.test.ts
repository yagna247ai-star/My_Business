import { describe, it, expect } from 'vitest';
import { AREAS, DEFAULT_AREA, normaliseArea, areaState, areasByState, areaSchema } from '@/lib/domain/areas';
import { stateOf } from '@/lib/domain/ranksCore';

// docs/AREA_PICKER_SPEC.md
describe('area catalogue', () => {
  it('AC-1: only Telangana and Andhra Pradesh, unique names, Bhagyanagar is the default', () => {
    expect(DEFAULT_AREA).toBe('Bhagyanagar');
    expect(new Set(AREAS.map(a => a.state))).toEqual(new Set(['Telangana', 'Andhra Pradesh']));
    const names = AREAS.map(a => a.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
    expect(AREAS.find(a => a.name === DEFAULT_AREA)?.state).toBe('Telangana');
    // 33 TG districts (Hyderabad folded into Bhagyanagar) + Secunderabad; 26 AP districts + 6 cities.
    expect(AREAS.filter(a => a.state === 'Telangana').length).toBe(34);
    expect(AREAS.filter(a => a.state === 'Andhra Pradesh').length).toBe(32);
  });
  it('no alias collides with another entry', () => {
    const seen = new Map<string, string>();
    for (const a of AREAS) for (const k of [a.name, ...(a.aliases ?? [])]) {
      const key = k.toLowerCase().replace(/[^a-z]/g, '');
      expect(seen.get(key) ?? a.name, `${k} is used twice`).toBe(a.name);
      seen.set(key, a.name);
    }
  });
  it('groups by state with Telangana first and Bhagyanagar at the top', () => {
    const g = areasByState();
    expect(g.map(x => x.state)).toEqual(['Telangana', 'Andhra Pradesh']);
    expect(g[0].areas[0]).toBe('Bhagyanagar');
  });
});

describe('normaliseArea', () => {
  it('AC-2: every Bhagyanagar spelling becomes Bhagyanagar', () => {
    for (const s of ['bagya space nagar', 'Bagyanagar', 'HYDERABAD', ' bhagya-nagar ', 'Bhagya Nagar', 'hyd', 'Bhagyanagar'])
      expect(normaliseArea(s), s).toBe('Bhagyanagar');
  });
  it('AC-3: aliases map to the official name; unknown or blank is null', () => {
    expect(normaliseArea('Rajahmundry')).toBe('Rajamahendravaram');
    expect(normaliseArea('warangal')).toBe('Warangal');
    expect(normaliseArea('Atlantis')).toBeNull();
    expect(normaliseArea('')).toBeNull();
    expect(normaliseArea(null)).toBeNull();
  });
});

describe('areaSchema (settings and admin validation)', () => {
  it('AC-4: accepts a listed area and stores its canonical name', () => {
    expect(areaSchema.parse('warangal')).toBe('Warangal');
  });
  it('AC-4: refuses an unlisted or blank area with a clear message', () => {
    const r = areaSchema.safeParse('Atlantis');
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toBe('Choose your area from the list.');
    expect(areaSchema.safeParse('').success).toBe(false);
  });
});

describe('state of an area', () => {
  it('AC-7: catalogue areas map to their state; older cities still map', () => {
    expect(areaState('Bhagyanagar')).toBe('Telangana');
    expect(stateOf('Bhagyanagar')).toBe('Telangana');
    expect(stateOf('Vijayawada')).toBe('Andhra Pradesh');
    expect(stateOf('NTR')).toBe('Andhra Pradesh');
    expect(stateOf('Bengaluru')).toBe('Karnataka');
  });
});
