import { NextRequest } from 'next/server';
import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { badRequest } from '@/lib/server/errors';
import { checkDataset } from '@/lib/domain/journey';
import { MAX_DATASET_BYTES } from '@/lib/domain/daDomains/datasetCheck';

/** Dataset check for domain journeys: multipart `file` (.csv or .xlsx, ≤ 5 MB) and `idx`. Read in memory; never stored. */
export const POST = route(async (req: NextRequest, p) => {
  const ctx = await requireCtx(); // sign-in before reading any body
  const len = Number(req.headers.get('content-length') || 0);
  if (len > MAX_DATASET_BYTES + 64 * 1024) throw badRequest('Keep the file under 5 MB. Upload a sample, not the whole dataset.');
  let form: FormData;
  try { form = await req.formData(); } catch { throw badRequest('Send the file as multipart/form-data, in a field named "file".'); }
  const f = form.get('file');
  if (!(f instanceof File)) throw badRequest('Attach your CSV or Excel file.');
  const idx = Number(form.get('idx') ?? 3);
  if (!Number.isInteger(idx) || idx < 1 || idx > 6) throw badRequest('Unknown step.');
  return checkDataset(ctx, p.code, idx, f.name || 'dataset.csv', Buffer.from(await f.arrayBuffer()));
}, { limit: { name: 'dataset-check', max: 30, windowMs: 10 * 60_000 } });
