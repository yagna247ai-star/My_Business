import { redirect } from 'next/navigation';
// One Ranks page (docs/RANKS_UNIFIED_SPEC.md): Standings is the "My cohort" tab of /ranks.
export default function Standings() { redirect('/ranks?tab=cohort'); }
