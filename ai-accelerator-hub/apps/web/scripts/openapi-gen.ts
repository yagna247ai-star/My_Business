// Writes lib/apiDocs/openapi.generated.json from the route files (docs/API_DOCS_SPEC.md). Run: npm run openapi
import { writeFileSync } from 'fs';
import { join } from 'path';
import { buildOpenApi } from '../lib/apiDocs/openapi';
import { readRouteFiles, moduleResolver } from '../lib/apiDocs/routeFiles';
const root = join(__dirname, '..');
const doc = buildOpenApi(readRouteFiles(join(root, 'app/api')), moduleResolver(root));
writeFileSync(join(root, 'lib/apiDocs/openapi.generated.json'), JSON.stringify(doc, null, 1) + '\n');
const ops = Object.values(doc.paths).reduce((n, p) => n + Object.keys(p).length, 0);
console.log(`openapi: ${Object.keys(doc.paths).length} paths, ${ops} operations`);
