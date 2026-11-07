import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export default async function CoachPage(){
  const assistants = await prisma.aiAssistant.findMany({select:{code:true, name:true}});
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Unstuck / AI Coach</h1>
      <p className="text-sm text-[#A0A8C0]">5 assistants — Learning Coach, Project Mentor, Assessment, Career Mentor, Hackathon Judge — with human approval for consequential actions. No student private data leaked across tenants.</p>
      <div className="rounded-2xl border border-[#2A3250] bg-[#1E2438] p-4">
        <div className="text-sm font-bold">Ask the Coach</div>
        <form action="/api/ai/chat" method="post" className="mt-3 space-y-2">
          <select name="assistantCode" className="w-full rounded-lg border border-[#2A3250] bg-[#101426] px-3 py-2 text-sm">
            {assistants.map(a=> <option key={a.code} value={a.code}>{a.name} ({a.code})</option>)}
          </select>
          <textarea name="message" placeholder="I'm stuck on RAG chunking — how do I choose chunk size?" rows={3} className="w-full rounded-lg border border-[#2A3250] bg-[#101426] px-3 py-2 text-sm" />
          <button type="submit" className="rounded-full bg-[#3878F6] px-4 py-2 text-sm font-semibold text-white">Ask (streaming via LiteLLM, mock when keys absent)</button>
        </form>
        <div className="mt-3 text-xs leading-4 text-[#8890B0]">
          <strong className="text-white">Safety:</strong> Prompt injection defenses, PII redaction, tool permission controls, human approval for publish/payment/grade. Model usage monitored, hallucination warnings, source attribution.
        </div>
      </div>
      <div className="rounded-xl border border-[#2A3250] bg-[#101426] p-3 text-xs leading-4 text-[#8890B0]">
        <strong className="text-white">Try:</strong> <code className="rounded bg-[#1E2438] px-1">POST /api/ai/chat</code> with assistantCode concept-explainer. Quotas: 50 AI credits (entitlement), budgets per tenant. Secrets never hit browser.
      </div>
    </div>
  );
}
