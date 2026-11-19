import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { setAvatar, clearAvatar } from '@/lib/domain/avatar';

const schema = z.object({ fileId: z.string().regex(/^[a-z0-9]{20,40}$/i) });

/** Choose an uploaded image as the profile photo. Upload it first with POST /api/v1/files (entityType=avatar). */
export const PUT = route(async req => setAvatar(await requireCtx(), (await body(req, schema)).fileId));

/** Remove the profile photo. */
export const DELETE = route(async () => clearAvatar(await requireCtx()));
