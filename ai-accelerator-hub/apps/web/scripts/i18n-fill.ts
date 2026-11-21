/** Machine-translate every interface text that has no reviewed or stored translation yet. Safe to rerun. */
import { fillUiTranslations } from '../lib/i18n/machine';
import { prisma } from '../lib/prisma';

fillUiTranslations({ log: s => console.log(s) })
  .then(r => console.log(`i18n:fill — added ${r.added} translations; ${r.left} left for the next run`))
  .catch(e => { console.error('i18n:fill failed:', e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
