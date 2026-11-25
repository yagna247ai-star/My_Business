/**
 * The fixed list of learner areas (docs/AREA_PICKER_SPEC.md). Pure: no database.
 * Telangana and Andhra Pradesh only: every district plus the major cities, one official name each.
 * Hyderabad is folded into Bhagyanagar so the city is never split across spellings again.
 */
import { z } from 'zod';

export type AreaState = 'Telangana' | 'Andhra Pradesh';
export type Area = { name: string; state: AreaState; aliases?: string[] };

export const DEFAULT_AREA = 'Bhagyanagar';

const TG = (name: string, aliases?: string[]): Area => ({ name, state: 'Telangana', aliases });
const AP = (name: string, aliases?: string[]): Area => ({ name, state: 'Andhra Pradesh', aliases });

export const AREAS: readonly Area[] = [
  // Telangana: Bhagyanagar (Hyderabad), Secunderabad, and the other 32 districts.
  TG('Bhagyanagar', ['Hyderabad', 'Hyd', 'Bagyanagar', 'Bagya Nagar', 'Bhagya Nagar', 'Bagya Space Nagar', 'Bhagyanagaram']),
  TG('Secunderabad'),
  TG('Adilabad'), TG('Bhadradri Kothagudem', ['Kothagudem']), TG('Hanumakonda', ['Hanamkonda']), TG('Jagtial', ['Jagitial']),
  TG('Jangaon'), TG('Jayashankar Bhupalpally', ['Bhupalpally']), TG('Jogulamba Gadwal', ['Gadwal']), TG('Kamareddy'),
  TG('Karimnagar'), TG('Khammam'), TG('Kumuram Bheem Asifabad', ['Asifabad']), TG('Mahabubabad'),
  TG('Mahabubnagar', ['Mahbubnagar', 'Palamuru']), TG('Mancherial'), TG('Medak'), TG('Medchal-Malkajgiri', ['Medchal', 'Malkajgiri']),
  TG('Mulugu'), TG('Nagarkurnool'), TG('Nalgonda'), TG('Narayanpet'), TG('Nirmal'), TG('Nizamabad'),
  TG('Peddapalli', ['Ramagundam']), TG('Rajanna Sircilla', ['Sircilla']), TG('Ranga Reddy', ['Rangareddy']), TG('Sangareddy'),
  TG('Siddipet'), TG('Suryapet'), TG('Vikarabad'), TG('Wanaparthy'), TG('Warangal'), TG('Yadadri Bhuvanagiri', ['Bhuvanagiri', 'Bhongir']),
  // Andhra Pradesh: the 26 districts, then major cities.
  AP('Alluri Sitharama Raju', ['Paderu']), AP('Anakapalli'), AP('Anantapur', ['Ananthapuramu', 'Anantapuramu']), AP('Annamayya', ['Rayachoti']),
  AP('Bapatla'), AP('Chittoor'), AP('Dr. B.R. Ambedkar Konaseema', ['Konaseema', 'Amalapuram']), AP('East Godavari'),
  AP('Eluru'), AP('Guntur'), AP('Kakinada'), AP('Krishna', ['Machilipatnam']), AP('Kurnool'), AP('Nandyal'),
  AP('NTR'), AP('Palnadu', ['Narasaraopet']), AP('Parvathipuram Manyam', ['Parvathipuram']), AP('Prakasam'),
  AP('Sri Potti Sriramulu Nellore'), AP('Sri Sathya Sai', ['Puttaparthi']), AP('Srikakulam'), AP('Tirupati'),
  AP('Visakhapatnam', ['Vizag', 'Vishakapatnam', 'Visakha']), AP('Vizianagaram'), AP('West Godavari', ['Bhimavaram']), AP('YSR Kadapa', ['YSR', 'Cuddapah']),
  AP('Vijayawada', ['Bezawada']), AP('Amaravati', ['Amravati']), AP('Rajamahendravaram', ['Rajahmundry', 'Rajamundry']),
  AP('Nellore'), AP('Ongole'), AP('Kadapa'),
];

/** Lower-case letters only, so "Bhagya-Nagar ", "bhagya nagar" and "BHAGYANAGAR" compare equal. */
const key = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

const BY_KEY = new Map<string, Area>();
for (const a of AREAS) for (const k of [a.name, ...(a.aliases ?? [])]) BY_KEY.set(key(k), a);

/** The official name for any listed name or alias, or null if it is not in the list. */
export function normaliseArea(input: string | null | undefined): string | null {
  if (!input) return null;
  const k = key(input);
  return k ? BY_KEY.get(k)?.name ?? null : null;
}

export function areaState(input: string | null | undefined): AreaState | null {
  const n = normaliseArea(input);
  return n ? BY_KEY.get(key(n))!.state : null;
}

/** For the picker: Telangana first, Bhagyanagar at the top, the rest alphabetical. */
export function areasByState(): { state: AreaState; areas: string[] }[] {
  return (['Telangana', 'Andhra Pradesh'] as const).map(state => ({
    state,
    areas: AREAS.filter(a => a.state === state).map(a => a.name)
      .sort((x, y) => (x === DEFAULT_AREA ? -1 : y === DEFAULT_AREA ? 1 : x.localeCompare(y))),
  }));
}

/** Search for the picker: matches names and aliases, so "Hyderabad" finds Bhagyanagar. */
export function searchAreas(q: string): string[] {
  const k = key(q);
  if (!k) return AREAS.map(a => a.name);
  return AREAS.filter(a => [a.name, ...(a.aliases ?? [])].some(n => key(n).includes(k))).map(a => a.name);
}

/** Server validation: any listed name or alias in, the official name out. */
export const areaSchema = z.string().max(60).transform((v, c) => {
  const n = normaliseArea(v);
  if (!n) { c.addIssue({ code: 'custom', message: 'Choose your area from the list.' }); return z.NEVER; }
  return n;
});
