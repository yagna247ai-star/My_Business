import { redirect } from 'next/navigation';

/** People moved to Settings → People, the single People screen (kept so old links and bookmarks still work). */
export default async function AdminPeopleRedirect({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  redirect(filter === 'attention' ? '/settings/people?filter=attention' : '/settings/people');
}
