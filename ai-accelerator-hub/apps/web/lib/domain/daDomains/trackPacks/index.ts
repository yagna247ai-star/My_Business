/**
 * Every domain that offers difficulty tracks, as the sign-up form, track picker and journey page need them.
 * Client-safe (no DomainSpec). To add a domain: write trackPacks/<domain>.ts and register it here and in tracks.ts.
 */
import { EDUCATION_TRACKS } from '../dossiers/education-tracks';
import { BFSI_PACK } from './bfsi';
import { quizFor, type TrackPackUi } from './types';

export const EDUCATION_PACK: TrackPackUi = {
  domain: 'education', org: 'school group', tracks: EDUCATION_TRACKS,
  criticalAck: 'I understand the Critical track rules: I will use synthetic data only and never real disclosures; a person always decides, and the system never contacts a child or family; children’s data is shown only to people who need it.',
  love: { easy: 'Making something simple that busy people use every day', intermediate: 'Discovering strengths nobody noticed', hard: 'Predicting what will happen before it happens', critical: 'Protecting people when the stakes are highest' },
  need: { easy: 'No child falls behind after an absence', intermediate: 'Every child’s strengths are recognised', hard: 'No child leaves without anyone noticing', critical: 'Every child is safe' },
};

export const TRACK_PACKS: Record<string, TrackPackUi> = { education: EDUCATION_PACK, bfsi: BFSI_PACK };
export const quizForDomain = (domain: string) => (TRACK_PACKS[domain] ? quizFor(TRACK_PACKS[domain]) : []);
