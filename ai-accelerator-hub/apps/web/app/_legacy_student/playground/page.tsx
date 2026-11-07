import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export default async function PlaygroundPage(){
  const assistants = await prisma.aiAssistant.findMany({select:{code:true, name:true, model:true}});
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">AI Playground</h1>
      <p className="text-sm text-[#A0A8C0]">5 assistants via LiteLLM gateway — streaming, tool-calling, fallback, budgets. Mock when keys absent (TEST MODE badge).</p>
      <div className="grid gap-3 md:grid-cols-2">
        {assistants.map(a=>(
          <div key={a.code} className="rounded-2xl border border-[#2A3250] bg-[#1E2438] p-4">
            <div className="text-sm font-bold">{a.name} <span className="text-xs font-normal text-[#8890B0]">({a.code})</span></div>
            <div className="text-xs text-[#A0A8C0]">{a.model}</div>
            <form action="/api/ai/chat" method="post" className="mt-3 flex gap-2">
              <input type="hidden" name="assistantCode" value={a.code} />
              <input name="message" placeholder={`Ask ${a.name}...`} className="flex-1 rounded-lg border border-[#2A3250] bg-[#101426] px-3 py-2 text-xs" />
              <button type="submit" className="rounded-full bg-[#3878F6] px-3 py-2 text-xs font-semibold text-white">Send</button>
            </form>
            <div className="mt-2 text-[11px] text-[#8890B0]">Try: POST /api/ai/chat {`{assistantCode: "${a.code}", message: "explain RAG"}`}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-[#3878F6]/20 bg-[#3878F6]/5 p-3 text-xs leading-4 text-[#A0A8C0]">
        <strong className="text-white">Gateway:</strong> Vercel AI SDK + LiteLLM → OpenAI/Anthropic/Gemini/Ollama. Quotas: tenant 100 $/mo, user 5 $/day via `ai_usage_ledger` + `entitlements`. Secrets server-side only. Failures → mock with badge, never silent fake.
      </div>
      <div className="rounded-xl bg-[#1E2438] p-3">
        <div className="text-xs font-semibold">Live test (fetch from browser console):</div>
        <pre className="mt-2 overflow-auto rounded bg-[#101426] p-2 text-[11px] text-[#A0A8C0]">{`fetch('/api/ai/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assistantCode:'concept-explainer',message:'What is RAG?'})}).then(r=>r.json()).then(console.log)`}</pre>
      </div>
    </div>
  );
}
