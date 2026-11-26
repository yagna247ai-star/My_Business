// The OpenAPI document for every route (docs/API_DOCS_SPEC.md). Super Admins and Institution Admins only.
import { route } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import doc from '@/lib/apiDocs/openapi.generated.json';

export const GET = route(async () => { await requirePerm('institute:manage'); return doc; });
