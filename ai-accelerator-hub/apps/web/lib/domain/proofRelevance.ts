/**
 * Irrelevant proof is rejected straight away, with a reason the learner can act on:
 *   links        must point at the learner's own work in a place work lives (GitHub, Drive, OneDrive, Databricks,
 *                Power BI, Colab, Kaggle, Notion, a Loom or YouTube walkthrough), not a home page, a search,
 *                social media, or a link another learner already handed in.
 *   screenshots  must be new: not an image another learner submitted, and not one the learner already used
 *                for a different step. With an AI provider configured, the image must also show the work the
 *                step asks for (a photo, meme, blank screen or unrelated app is rejected). AI outages never block.
 */
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { langchainProvider } from '@/lib/ai/providers/langchain';

/* ---------- links (pure, exported for tests) ---------- */

const WORK_HOSTS = [
  'github.com', 'gist.github.com', 'gitlab.com', 'bitbucket.org',
  'drive.google.com', 'docs.google.com', 'sheets.google.com', 'colab.research.google.com', 'lookerstudio.google.com', 'datastudio.google.com',
  'onedrive.live.com', '1drv.ms', 'sharepoint.com', 'office.com', 'live.com',
  'cloud.databricks.com', 'azuredatabricks.net', 'gcp.databricks.com', 'databricks.com',
  'app.powerbi.com', 'powerbi.com', 'public.tableau.com',
  'kaggle.com', 'notion.so', 'notion.site', 'observablehq.com', 'huggingface.co', 'streamlit.app', 'vercel.app', 'netlify.app', 'github.io',
  'loom.com', 'youtube.com', 'youtu.be', 'vimeo.com', 'dropbox.com', 'box.com',
];
const NOT_WORK: [RegExp, string][] = [
  [/^(google|bing|duckduckgo|yahoo|search\.yahoo)\.[a-z]{2,3}(\.[a-z]{2})?$/, 'search results'],
  [/(^|\.)(instagram|facebook|fb|x|twitter|tiktok|snapchat|whatsapp|t|telegram|reddit|pinterest|linkedin)\.(com|me|org)$/, 'social media'],
  [/(^|\.)(bit\.ly|tinyurl\.com|goo\.gl|t\.co|is\.gd|rb\.gy|cutt\.ly)$/, 'a short link'],
  [/(^|\.)(chatgpt\.com|chat\.openai\.com|claude\.ai|gemini\.google\.com|wikipedia\.org|w3schools\.com|geeksforgeeks\.org|stackoverflow\.com|medium\.com)$/, 'someone else’s page'],
];
const hostIs = (host: string, d: string) => host === d || host.endsWith(`.${d}`);

/** null when the link can be proof of the learner's own work; otherwise the reason it cannot. */
export function proofLinkProblem(raw: string): string | null {
  let u: URL; try { u = new URL(raw); } catch { return 'Paste the full link, starting with https://'; }
  const host = u.hostname.toLowerCase().replace(/^www\./, '');
  const bad = NOT_WORK.find(([re]) => re.test(host));
  if (bad) return `This link is ${bad[1]}, not your work. Link to your own file, notebook, report or walkthrough video.`;
  if (!WORK_HOSTS.some(d => hostIs(host, d))) return 'Link to where your work is saved: GitHub, Google Drive or Docs, OneDrive, Databricks, Power BI, Colab, Kaggle, Notion, or a Loom or YouTube walkthrough.';
  const path = u.pathname.replace(/\/+$/, '');
  const yt = hostIs(host, 'youtube.com') ? (u.searchParams.get('v') || /^\/(shorts|live|embed)\/[\w-]{6,}/.test(path)) : true;
  // A learner's own deployed app or site (asha.streamlit.app) is their work even at its home page.
  const ownSite = ['streamlit.app', 'vercel.app', 'netlify.app', 'github.io', 'notion.site'].some(d => host.endsWith(`.${d}`));
  if (!path && !u.search && !ownSite) return 'This is the site’s home page. Open your own file or project there and copy its link.';
  if (!yt) return 'Link to your walkthrough video itself, not a channel or search page.';
  if (hostIs(host, 'github.com') && path.split('/').filter(Boolean).length < 2) return 'Link to your repository or file on GitHub (github.com/you/project), not a profile or GitHub page.';
  return null;
}

const norm = (raw: string) => { try { const u = new URL(raw); u.hash = ''; return `${u.hostname.replace(/^www\./, '')}${u.pathname.replace(/\/+$/, '')}${u.search}`.toLowerCase(); } catch { return raw.trim().toLowerCase(); } };

/** A link another learner in this institution already handed in. */
export async function linkUsedByOthers(ctx: Ctx, url: string): Promise<boolean> {
  const key = norm(url);
  const host = key.split('/')[0];
  const rows = await prisma.submission.findMany({ where: { tenantId: ctx.tenantId, userId: { not: ctx.userId }, url: { contains: host } }, select: { url: true }, take: 2000 });
  return rows.some(r => r.url && norm(r.url) === key);
}

/* ---------- screenshots ---------- */

type Shot = { id: string; sha256: string | null; mime: string };

/** Why this screenshot is not new proof, or null. Same image from another learner, or one this learner used elsewhere. */
export async function reusedShot(ctx: Ctx, f: Shot): Promise<string | null> {
  if (!f.sha256) return null;
  const same = await prisma.file.findMany({ where: { tenantId: ctx.tenantId, sha256: f.sha256, id: { not: f.id } }, select: { id: true, ownerId: true } });
  if (same.some(x => x.ownerId !== ctx.userId)) return 'This screenshot was already handed in by another learner. Take a screenshot of your own work.';
  const mine = same.map(x => x.id);
  if (!mine.length) return null;
  const used = await prisma.dayProgress.findFirst({ where: { userId: ctx.userId, OR: [{ fileId: { in: mine } }, ...mine.map(id => ({ steps: { contains: id } }))] }, select: { id: true } })
    ?? await prisma.activityProgress.findFirst({ where: { userId: ctx.userId, OR: mine.map(id => ({ data: { contains: id } })) }, select: { id: true } });
  return used ? 'You already used this screenshot for another step. Take a new one that shows this step’s work.' : null;
}

/** AI check that the image shows the asked-for work. null = fine or unknown (no provider, timeout, error). */
export async function screenshotOffTopic(bytes: Buffer, mime: string, what: string): Promise<string | null> {
  if (process.env.AI_PROOF_CHECK === 'off' || !langchainProvider.configured() || !langchainProvider.vision) return null;
  const system = [
    'You check screenshots that data-analytics learners upload as proof of their work.',
    'Decide if the image is a screenshot of computer work related to the task: a spreadsheet, SQL or code editor, terminal, notebook, database tool, dashboard, chart, document or similar.',
    'Be generous: accept partial, messy, cropped or non-English work, and any reasonable tool. Reject only images that are clearly unrelated: photos of people, places or things, memes, wallpapers, blank or nearly blank screens, home screens, or an app that has nothing to do with the task.',
    'Return ONLY JSON: {"ok": true|false, "feedback": "one short, kind sentence saying what the screenshot should show"}.',
  ].join('\n');
  try {
    const r = await Promise.race([
      langchainProvider.vision('proof-check', system, `Task: ${what}`, { bytes, mime }),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 15_000)),
    ]);
    const j = JSON.parse(r.text.replace(/^```(?:json)?\s*|\s*```$/g, '')) as { ok?: boolean; feedback?: string };
    return j.ok === false ? `This screenshot does not look like your work for this step. ${String(j.feedback || '').slice(0, 200)}`.trim() : null;
  } catch { return null; }
}
