import { redirect } from 'next/navigation';
// One Ranks page (docs/RANKS_UNIFIED_SPEC.md): Area crowns is a tab of /ranks.
export default async function AreaStandings({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const { level } = await searchParams;
  redirect(`/ranks?tab=areas${level ? `&level=${encodeURIComponent(level)}` : ''}`);
}
