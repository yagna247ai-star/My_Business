import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { badRequest } from '@/lib/server/errors';
import { uploadFile } from '@/lib/domain/files';

export const POST = route(async req => {
  const form = await req.formData();
  const f = form.get('file');
  if (!(f instanceof File)) throw badRequest('Attach a file as "file".');
  const buf = Buffer.from(await f.arrayBuffer());
  return uploadFile(await requireCtx(), { filename: f.name || 'upload', mime: f.type || 'application/octet-stream', bytes: buf }, { entityType: typeof form.get('entityType') === 'string' ? form.get('entityType') as string : undefined, entityId: typeof form.get('entityId') === 'string' ? form.get('entityId') as string : undefined });
});
