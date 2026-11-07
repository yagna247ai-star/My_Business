/**
 * Curated open-source library (MASTER PROMPT §13 + research policy).
 *
 * Sources: the projects in /Users/apple/Documents/ThinkNous/GenAI-Projects (forks under
 * yagna247ai-star), resolved to their TRUE upstream repositories, plus resources referenced by Level 1.
 * Curators set category / difficulty / level / guidance. Licence, archive status and dates are
 * NEVER hand-entered: `verifyLibrary()` fetches them from the GitHub API and only then writes rows.
 *
 * Run:  DATABASE_URL=file:./dev.db npx tsx prisma/library.ts      (needs network)
 */
import { PrismaClient } from '@prisma/client';

type Curated = { fullName: string; category: string; difficulty: 'beginner' | 'intermediate' | 'advanced'; prerequisites: string; levelIdx?: number; note?: string };

export const CURATED: Curated[] = [
  // Learning
  { fullName: 'microsoft/generative-ai-for-beginners', category: 'learning', difficulty: 'beginner', prerequisites: 'None', levelIdx: 1 },
  { fullName: 'GenAIDevelopment/PythonFoundations', category: 'learning', difficulty: 'beginner', prerequisites: 'None', levelIdx: 8 },
  { fullName: 'ishandutta0098/zero-to-lightning', category: 'learning', difficulty: 'intermediate', prerequisites: 'Python, basic machine learning', levelIdx: 13 },
  { fullName: 'GenAIDevelopment/agenticai', category: 'agents', difficulty: 'intermediate', prerequisites: 'Python, Jupyter', levelIdx: 10 },
  { fullName: 'ishandutta0098/outskill', category: 'learning', difficulty: 'beginner', prerequisites: 'Python, Jupyter', levelIdx: 4 },
  { fullName: 'GenAIDevelopment/kb_articles_rag_prd', category: 'rag', difficulty: 'intermediate', prerequisites: 'Python, embeddings basics', levelIdx: 9 },
  { fullName: 'GenAIDevelopment/onboarding_rag_sample', category: 'rag', difficulty: 'intermediate', prerequisites: 'Python, embeddings basics', levelIdx: 9 },
  { fullName: 'GenAIDevelopment/agentic_ai_demo', category: 'agents', difficulty: 'intermediate', prerequisites: 'Python', levelIdx: 10 },
  // Voice, speech, TTS
  { fullName: 'jamiepine/voicebox', category: 'voice_ai', difficulty: 'intermediate', prerequisites: 'Running desktop apps, basic audio concepts', levelIdx: 5 },
  { fullName: 'debpalash/VoiceStudio', category: 'voice_ai', difficulty: 'advanced', prerequisites: 'Python, GPU or Apple Silicon recommended', levelIdx: 5 },
  // Agents & automation
  { fullName: 'FoundationAgents/OpenManus', category: 'agents', difficulty: 'advanced', prerequisites: 'Python, API keys for an LLM provider', levelIdx: 10 },
  { fullName: 'NousResearch/hermes-agent', category: 'agents', difficulty: 'advanced', prerequisites: 'Python, LLM APIs', levelIdx: 11 },
  { fullName: 'ishandutta0098/orion', category: 'agents', difficulty: 'advanced', prerequisites: 'Python, GitHub API', levelIdx: 12 },
  { fullName: 'kingsidharth/podcaster_crew', category: 'agents', difficulty: 'intermediate', prerequisites: 'Python, CrewAI', levelIdx: 10 },
  // Search, workspace, gateways
  { fullName: 'ItzCrazyKns/Vane', category: 'search', difficulty: 'intermediate', prerequisites: 'Docker, TypeScript basics', levelIdx: 9 },
  { fullName: 'odysseus-dev/odysseus', category: 'workspace', difficulty: 'advanced', prerequisites: 'Docker, self-hosting', levelIdx: 13 },
  { fullName: 'tashfeenahmed/freellmapi', category: 'llm_gateway', difficulty: 'intermediate', prerequisites: 'REST APIs', levelIdx: 13 },
  { fullName: 'harishkotra/compass', category: 'llm_gateway', difficulty: 'advanced', prerequisites: 'LLM APIs, routing concepts', levelIdx: 13 },
  // AI coding & app builders
  { fullName: 'dyad-sh/dyad', category: 'ai_coding', difficulty: 'beginner', prerequisites: 'None (desktop app)', levelIdx: 7, note: 'Apache-2.0 outside src/pro/; src/pro/ has its own restrictive licence.' },
  // Image, video, music, vision
  { fullName: 'invoke-ai/InvokeAI', category: 'image_gen', difficulty: 'intermediate', prerequisites: 'GPU recommended', levelIdx: 5 },
  { fullName: 'upscayl/upscayl', category: 'image_gen', difficulty: 'beginner', prerequisites: 'None (desktop app)', levelIdx: 5 },
  { fullName: 'kamilstanuch/Autocrop-vertical', category: 'video_gen', difficulty: 'intermediate', prerequisites: 'Python, ffmpeg', levelIdx: 5, note: undefined }, // true origin of mutonby/openshorts (a fork); the fork's MIT claim cannot relicense the unlicensed original
  { fullName: 'ace-step/ACE-Step-1.5', category: 'music', difficulty: 'advanced', prerequisites: 'Python, GPU recommended', levelIdx: 5 },
  { fullName: 'ishandutta0098/mukh', category: 'multimodal', difficulty: 'intermediate', prerequisites: 'Python, computer-vision basics', levelIdx: 13 },
];

const PERMISSIVE = new Set(['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'MPL-2.0']);
const COPYLEFT = new Set(['AGPL-3.0', 'GPL-3.0', 'GPL-2.0', 'LGPL-3.0', 'LGPL-2.1']);

export function classify(spdx: string | null, note?: string) {
  if (note && /src\/pro/.test(note)) return { licenseClass: 'mixed', usageNote: `Mixed licence. ${note} Fork and modify only the Apache-2.0 parts; read src/pro/LICENSE before touching anything there.` };
  if (!spdx || spdx === 'NOASSERTION') return { licenseClass: 'none', usageNote: 'No open-source licence found: the code is visible but all rights are reserved. Study and run it locally for learning; do not copy, redistribute or ship it in your projects without written permission from the author.' };
  if (PERMISSIVE.has(spdx)) return { licenseClass: 'permissive', usageNote: `${spdx}: you may fork, modify and reuse it, including commercially. Keep the copyright and licence notice.` };
  if (COPYLEFT.has(spdx)) return { licenseClass: 'copyleft', usageNote: `${spdx}: strong copyleft. You may fork and modify it, but if you distribute it — or for AGPL, offer it as a network service — you must publish your full source under the same licence.` };
  return { licenseClass: 'none', usageNote: `Licence ${spdx} needs manual review before use.` };
}

export async function verifyLibrary(prisma: PrismaClient, fetchImpl: typeof fetch = fetch) {
  const today = new Date().toISOString().slice(0, 10);
  const results: { fullName: string; ok: boolean; reason?: string }[] = [];
  const headers: Record<string, string> = { 'User-Agent': 'aihub-library-verifier', Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  for (const c of CURATED) {
    try {
      const res = await fetchImpl(`https://api.github.com/repos/${c.fullName}`, { headers, signal: AbortSignal.timeout(10000) });
      if (!res.ok) { results.push({ fullName: c.fullName, ok: false, reason: `HTTP ${res.status}` }); continue; }
      const d = await res.json() as { full_name: string; html_url: string; description: string | null; license: { spdx_id: string } | null; archived: boolean; pushed_at: string; fork: boolean };
      if (d.fork) { results.push({ fullName: c.fullName, ok: false, reason: 'is a fork — use the upstream' }); continue; }
      const spdx = d.license?.spdx_id && d.license.spdx_id !== 'NOASSERTION' ? d.license.spdx_id : (c.note ? 'Apache-2.0' : null);
      const { licenseClass, usageNote } = classify(d.license?.spdx_id ?? null, c.note);
      const row = { url: d.html_url, category: c.category, description: (d.description || 'No description provided by the author.').trim(), difficulty: c.difficulty, prerequisites: c.prerequisites, licenseSpdx: spdx, licenseClass, usageNote, levelIdx: c.levelIdx ?? null, archived: d.archived, lastPushedAt: d.pushed_at?.slice(0, 10) ?? null, lastVerified: today };
      await prisma.libraryResource.upsert({ where: { fullName: d.full_name }, update: row, create: { fullName: d.full_name, ...row } });
      results.push({ fullName: d.full_name, ok: true });
    } catch (e) {
      results.push({ fullName: c.fullName, ok: false, reason: (e as Error).message });
    }
  }
  return results;
}

if (require.main === module) {
  const prisma = new PrismaClient();
  verifyLibrary(prisma).then(r => {
    r.forEach(x => console.log(x.ok ? '✓' : '✗', x.fullName, x.reason || ''));
    console.log(`${r.filter(x => x.ok).length}/${r.length} verified`);
  }).finally(() => prisma.$disconnect());
}
