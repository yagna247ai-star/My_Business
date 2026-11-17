/** @type {import('next').NextConfig} */
const path = require('path');
const fs = require('fs');

// ── Environment ───────────────────────────────────────────────────────────────────────────────────
// Local dev keeps one .env at the repo root, but Next only reads .env files from apps/web. Load the root file
// too; process.loadEnvFile never overrides variables that are already set (Vercel / real env always win).
const rootEnv = path.resolve(__dirname, '../../.env');
if (!process.env.VERCEL && fs.existsSync(rootEnv)) process.loadEnvFile(rootEnv);

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Locally: copy .env.example to .env at the repo root. On Vercel: add it under Project → Settings → Environment Variables.');
}
// SQLite (local dev only): Prisma resolves a relative path from the schema folder, which bundling breaks, so pin
// it absolutely; and use one connection so concurrent writes queue instead of failing with "database busy".
if (process.env.DATABASE_URL.startsWith('file:') || process.env.DATABASE_URL.startsWith('"file:')) {
  let url = process.env.DATABASE_URL.replace(/^"|"$/g, '');
  if (/^file:\.\.?\//.test(url)) url = 'file:' + path.resolve(__dirname, '../../packages/db/prisma', url.slice(5));
  if (!/[?&]connection_limit=/.test(url)) url += (url.includes('?') ? '&' : '?') + 'connection_limit=1&socket_timeout=20';
  process.env.DATABASE_URL = url;
}

const isProd = process.env.NODE_ENV === 'production';
// Public site URL, e.g. https://nachikethaenterpries.business (Vercel previews fall back to their own URL).
const siteUrl = process.env.APP_URL || process.env.AUTH_URL || process.env.NEXTAUTH_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');
const siteHost = new URL(siteUrl).host;

// ── Security headers ──────────────────────────────────────────────────────────────────────────────
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"} https://checkout.razorpay.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com",
  "frame-src https://api.razorpay.com https://checkout.razorpay.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isProd ? ['upgrade-insecure-requests'] : []),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), microphone=(self), payment=(self "https://checkout.razorpay.com")' },
  ...(isProd ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }] : []),
];

const nextConfig = {
  // Lets a production build be verified locally without touching the dev server's .next folder.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  transpilePackages: ['@aihub/db'],
  poweredByHeader: false,
  // Monorepo: trace server files from the repo root so Vercel bundles the Prisma engine and workspace packages.
  outputFileTracingRoot: path.resolve(__dirname, '../..'),
  // Server Actions only from our own origin (no wildcard).
  experimental: { serverActions: { allowedOrigins: [siteHost, ...(process.env.APP_ORIGIN ? [process.env.APP_ORIGIN] : [])] } },
  images: { remotePatterns: [{ protocol: 'https', hostname: 'avatars.githubusercontent.com' }] },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Learner data must never sit in shared caches.
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
    ];
  },
  async redirects() {
    // One canonical host: www.<domain> → <domain> (keeps sign-in cookies on a single origin).
    if (!isProd || siteHost.startsWith('www.') || siteHost.startsWith('localhost')) return [];
    return [{ source: '/:path*', has: [{ type: 'host', value: `www.${siteHost}` }], destination: `${siteUrl}/:path*`, permanent: true }];
  },
};

module.exports = nextConfig;
