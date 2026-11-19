import { redirect } from 'next/navigation';
import { getCtx } from '@/lib/server/context';
import { SettingsNav } from '@/components/settings/SettingsNav';
import { settingsLinks } from '@/lib/server/settingsNav';

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCtx();
  if (!ctx) redirect('/login');
  return (<div className="set-wrap">
    <SettingsNav links={settingsLinks(ctx)} />
    <div style={{ minWidth: 0 }}>{children}</div>
  </div>);
}
