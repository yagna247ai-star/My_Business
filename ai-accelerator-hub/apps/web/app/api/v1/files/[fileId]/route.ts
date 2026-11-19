import { NextResponse } from 'next/server';
import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { readFile } from '@/lib/domain/files';

export const GET = route(async (req, p) => {
  const f = await readFile(await requireCtx(), p.fileId);
  return new NextResponse(new Uint8Array(f.bytes), { headers: { 'content-type': f.mime, 'content-disposition': req.nextUrl.searchParams.get('inline') === '1' && /^image\/(png|jpeg|webp|gif)$/.test(f.mime) ? 'inline' : 'attachment', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox", 'cache-control': 'private, max-age=3600' } });
});
