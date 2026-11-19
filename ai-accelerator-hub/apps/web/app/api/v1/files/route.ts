import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { badRequest } from '@/lib/server/errors';
import { uploadFile } from '@/lib/domain/files';

export const POST = route(async req => {
  // Sign-in first: a signed-out caller must not make the server read an upload body.
  const ctx = await requireCtx();
  let form: FormData;
  try { form = await req.formData(); } catch { throw badRequest('Send the file as multipart/form-data, in a field named "file".'); }
  const f = form.get('file');
  if (!(f instanceof File)) throw badRequest('Attach a file as "file".');
  const buf = Buffer.from(await f.arrayBuffer());
  return uploadFile(ctx, { filename: f.name || 'upload', mime: f.type || 'application/octet-stream', bytes: buf }, { entityType: typeof form.get('entityType') === 'string' ? form.get('entityType') as string : undefined, entityId: typeof form.get('entityId') === 'string' ? form.get('entityId') as string : undefined });
});
