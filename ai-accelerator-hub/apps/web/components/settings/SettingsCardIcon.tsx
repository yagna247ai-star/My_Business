'use client';
import { SETTINGS_ICONS, type SettingsIcon } from './SettingsNav';

export function SettingsCardIcon({ icon }: { icon: SettingsIcon }) {
  const I = SETTINGS_ICONS[icon];
  return <I size={20} aria-hidden="true" />;
}
