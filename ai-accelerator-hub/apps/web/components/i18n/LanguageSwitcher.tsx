'use client';
/** Language picker for pages without a profile (sign-in, sign-up). Signed-in users change it in Settings → Profile. */
import { useRouter } from 'next/navigation';
import { Languages } from 'lucide-react';
import { LOCALES, LOCALE_NAMES, isLocale } from '@/lib/i18n/core';
import { rememberLocale, useLocale, useT } from './I18nProvider';

export function LanguageSwitcher() {
  const router = useRouter(); const locale = useLocale(); const t = useT();
  return (
    <label className="row gap-8 small" style={{ alignItems: 'center', marginLeft: 'auto' }}>
      <Languages size={16} aria-hidden="true" /><span className="sr-only">{t('Language')}</span>
      <select className="select" style={{ width: 'auto', minHeight: 34, paddingBlock: 4 }} aria-label={t('Language')} value={locale}
        onChange={e => { const v = e.target.value; if (isLocale(v)) { rememberLocale(v); router.refresh(); } }}>
        {LOCALES.map(l => <option key={l} value={l}>{LOCALE_NAMES[l]}</option>)}
      </select>
    </label>
  );
}
