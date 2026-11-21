'use client';
/** "Read in Telugu" on a lesson page: asks the server to translate (cached after the first time), then reloads. */
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Languages } from 'lucide-react';
import { api } from '@/lib/client/api';
import { LOCALE_NAMES } from '@/lib/i18n/core';
import { useLocale, useT } from '@/components/i18n/I18nProvider';
import { Tv } from '@/components/i18n/Tv';

/** endpoint: what to translate (a day page, or a level's activities). */
export function TranslateLesson({ code, day, endpoint }: { code?: string; day?: number; endpoint?: string }) {
  const router = useRouter(); const t = useT(); const locale = useLocale();
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  if (locale === 'en') return null;
  const go = async () => {
    setBusy(true); setErr('');
    try { await api(endpoint ?? `/api/v1/levels/${code}/days/${day}/translate`, { method: 'POST', body: {}, timeoutMs: 120_000 }); router.refresh(); }
    catch { setErr(t('Translation is not available right now. The lesson is shown in English.')); }
    finally { setBusy(false); }
  };
  return (
    <div className="row gap-8 wrap" style={{ alignItems: 'center', marginBottom: 12, maxWidth: 820 }}>
      <button className="btn btn-outline btn-sm" type="button" disabled={busy} onClick={go}><Languages size={15} aria-hidden="true" />{busy ? t('Translating…') : t('Read in {lang}', { lang: LOCALE_NAMES[locale] })}</button>
      {err && <span className="field-err small" role="alert"><Tv v={err} /></span>}
    </div>
  );
}
