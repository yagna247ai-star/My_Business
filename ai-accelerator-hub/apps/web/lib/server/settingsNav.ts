import type { Ctx } from '@/lib/server/context';
import { hasPerm } from '@/lib/server/context';
import { settingsSections } from '@/lib/domain/settingsAdmin';
import { canEditTrackSettings } from '@/lib/domain/trackRules';
import type { SettingsIcon, SettingsLink } from '@/components/settings/SettingsNav';

export type SettingsCard = SettingsLink & { description: string; admin: boolean };

/** Every Settings destination this person may open, in menu order. One list drives both the side menu and the hub cards. */
export function settingsCards(ctx: Ctx): SettingsCard[] {
  const s = settingsSections(ctx);
  const c = (href: string, label: string, icon: SettingsIcon, group: string, description: string, admin: boolean): SettingsCard => ({ href, label, icon, group, description, admin });
  const out: SettingsCard[] = [c('/settings/profile', 'Profile & privacy', 'profile', 'Settings', 'Your photo, theme, language, area, leaderboard privacy and account deletion.', false)];
  if (s.institute || s.institutes) out.push(c('/settings/institute', s.institutes ? 'Institutes' : 'Institute', 'institute', 'Administration', s.institutes ? 'Your institute’s details, plus create, edit, deactivate and delete institutes.' : 'Your institute’s name and contact details.', true));
  if (s.people) out.push(c('/settings/people', 'People', 'people', 'Administration', 'Everyone, their progress and streaks; add, edit, nudge or remove people, and open any profile.', true));
  if (ctx.superAdmin) out.push(c('/settings/access', 'Access', 'access', 'Administration', 'Give any person extra permissions, or take some away, on top of their role.', true));
  out.push(c('/settings/password', 'Password', 'password', 'Settings', 'Change your password.', false));
  if (s.cohorts) out.push(c('/settings/cohorts', 'Cohorts', 'cohorts', 'Administration', 'Create cohorts, set dates and size, refresh invite codes, delete cohorts.', true));
  if (s.talent) out.push(c('/settings/talent', 'Talent', 'talent', 'Administration', 'Post and manage opportunities, and moderate learner talent profiles.', true));
  if (canEditTrackSettings(ctx)) out.push(c('/settings/tracks', 'Learning tracks', 'learn', 'Program', 'Choose which staff roles can move learners between Easy, Intermediate, Hard and Critical tracks.', true));
  if (hasPerm(ctx, 'content:manage')) out.push(c('/admin/journeys', 'Journeys', 'journeys', 'Program', 'Build journeys and levels. Super Admin picks the default journey.', true));
  if (hasPerm(ctx, 'cohort:manage')) out.push(c('/admin/hackathons', 'Hackathons', 'hackathons', 'Program', 'Create and run hackathons.', true));
  if (hasPerm(ctx, 'audit:read')) out.push(c('/admin/audit', 'Audit log', 'audit', 'Program', 'See who changed what, and when.', true));
  return out;
}

export const settingsLinks = (ctx: Ctx): SettingsLink[] => [{ href: '/settings', label: 'Overview', icon: 'grid', group: 'Settings' }, ...settingsCards(ctx).map(({ href, label, icon, group }) => ({ href, label, icon, group }))];
