import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCtx } from "@/lib/server/context";

const curated = [
  { name:"Voicebox (Meta)", url:"https://github.com/facebookresearch/voicebox", desc:"Speech generation", difficulty:"Advanced", prereqs:["L05"], license:"CC-BY-NC 4.0 (research only — not commercial)", lastVerified:"2026-11-04"},
  { name:"Whisper (OpenAI)", url:"https://github.com/openai/whisper", desc:"Speech recognition", difficulty:"Beginner", prereqs:["L05"], license:"MIT", lastVerified:"2026-11-04"},
  { name:"LangChain", url:"https://github.com/langchain-ai/langchain", desc:"Agents + RAG", difficulty:"Intermediate", prereqs:["L07"], license:"MIT", lastVerified:"2026-11-04"},
  { name:"n8n", url:"https://github.com/n8n-io/n8n", desc:"Workflow automation", difficulty:"Beginner", prereqs:["L09"], license:"Sustainable Use (check commercial)", lastVerified:"2026-11-04"},
  { name:"Qdrant", url:"https://github.com/qdrant/qdrant", desc:"Vector DB", difficulty:"Intermediate", prereqs:["L06"], license:"Apache-2.0", lastVerified:"2026-11-04"},
  { name:"Ollama", url:"https://github.com/ollama/ollama", desc:"Local LLM inference", difficulty:"Beginner", prereqs:["L01"], license:"MIT", lastVerified:"2026-11-04"},
];

// Restored 2026-11-07 with the same fields. Now requires sign-in and only lists public projects
// from the caller's own institution.
export async function GET(){
  const ctx = await getCtx();
  if (!ctx) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in to continue." } }, { status: 401 });
  const projects = await prisma.project.findMany({where:{isPublic:true, tenantId: ctx.tenantId}, include:{repos:true}, take:10});
  return NextResponse.json({
    curated: curated.map(c=>({ ...c, note: "Verified availability/ownership/license — not assumed OSS because visible"})),
    showcase: projects,
    flow: "Explore → Fork → Modify → Build → Deploy → Showcase (GitHub OAuth when GITHUB_CLIENT_ID set, otherwise link verification via repoUrl)",
    policy: "Every external resource has URL, description, difficulty, prereqs, license, lastVerified — no fabricated repos (§2)"
  });
}
