'use client';
/** Swagger UI, pinned to swagger-ui-dist 5.17.14 with subresource integrity (docs/API_DOCS_SPEC.md AC-6). */
import { useEffect, useRef, useState } from 'react';

export const SWAGGER = {
  js: 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui-bundle.js',
  jsSri: 'sha384-wmyclcVGX/WhUkdkATwhaK1X1JtiNrr2EoYJ+diV3vj4v6OC5yCeSu+yW13SYJep',
  css: 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui.css',
  cssSri: 'sha384-wxLW6kwyHktdDGr6Pv1zgm/VGJh99lfUbzSn6HNHBENZlCN7W602k9VkGdxuFvPn',
};

type Bundle = (o: Record<string, unknown>) => unknown;

export function SwaggerUi() {
  const el = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    const css = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: SWAGGER.css, integrity: SWAGGER.cssSri, crossOrigin: 'anonymous' });
    const js = Object.assign(document.createElement('script'), { src: SWAGGER.js, integrity: SWAGGER.jsSri, crossOrigin: 'anonymous', async: true });
    js.onload = () => {
      const make = (window as unknown as { SwaggerUIBundle?: Bundle }).SwaggerUIBundle;
      if (!make || !el.current) { setErr('Swagger UI did not load.'); return; }
      make({ url: '/api/v1/openapi.json', domNode: el.current, deepLinking: true, docExpansion: 'none', filter: true, persistAuthorization: false, tryItOutEnabled: false, withCredentials: true });
    };
    js.onerror = () => setErr('Swagger UI could not be downloaded. Check your connection, or open /api/v1/openapi.json directly.');
    document.head.append(css); document.body.append(js);
    return () => { css.remove(); js.remove(); };
  }, []);
  return <>{err && <p role="alert" style={{ color: '#b42318', padding: 16 }}>{err}</p>}<div ref={el} /></>;
}
