// API docs (docs/API_DOCS_SPEC.md): every route of the platform in Swagger UI. Super Admins and Institution Admins only.
import Link from 'next/link';
import { requirePerm } from '@/lib/server/context';
import { guarded } from '@/lib/server/page';
import { SwaggerUi } from './SwaggerUi';

export const metadata = { title: 'API docs' };

async function ApiDocs() {
  await requirePerm('institute:manage');
  return (
    <main style={{ background: '#fff', color: '#1b1f24', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px 0' }}>
        <Link href="/dashboard" style={{ fontWeight: 700 }}>← Back to the platform</Link>
        <p style={{ marginTop: 10, fontSize: 14 }}>Every API route, generated from the code. “Try it out” calls the live API as <b>you</b>, with your own session: changes are real.</p>
      </div>
      <SwaggerUi />
    </main>
  );
}

export default guarded(ApiDocs);
