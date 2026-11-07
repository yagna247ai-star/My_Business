// Bundles app-v3 into a single self-contained HTML file (no build tooling needed).
// Usage: node app-v3/build.mjs   →  writes ../standalone-v3.html
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const read = p => readFileSync(join(root, p.split('?')[0]), 'utf8');
let html = read('index.html');

html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, href) => `<style>/* ${href.split('?')[0]} */\n${read(href)}</style>`);
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, src) => {
  const js = read(src).replace(/<\/script/gi, '<\\/script'); // never terminate the inline block early
  return `<script>/* ${src.split('?')[0]} */\n${js}</script>`;
});

const out = join(root, '..', 'standalone-v3.html');
writeFileSync(out, html);
console.log(`Wrote ${out} (${(Buffer.byteLength(html) / 1024).toFixed(1)} KB)`);
