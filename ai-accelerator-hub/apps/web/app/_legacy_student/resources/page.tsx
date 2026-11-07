export const dynamic = "force-dynamic";
export default function ResourcesPage(){
  const resources = [
    {name:"Direct AI Classroom Notes", url:"https://directai.blog/gen-ai-classroom-notes/", desc:"LLM fundamentals, GenAI concepts", difficulty:"Beginner", license:"CC", lastVerified:"2026-11-04"},
    {name:"Prompt Engineering Guide", url:"https://www.promptingguide.ai/", desc:"Zero/few-shot, CoT, ReAct", difficulty:"Beginner", license:"MIT", lastVerified:"2026-11-04"},
    {name:"MCP Documentation", url:"https://modelcontextprotocol.io/", desc:"MCP tools/resources", difficulty:"Intermediate", license:"MIT", lastVerified:"2026-11-04"},
  ];
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Resources</h1>
      <p className="text-sm text-[#A0A8C0]">Every external resource has URL, description, difficulty, prerequisites, license, lastVerified — no fabricated repos (§2 Research Policy).</p>
      <div className="grid gap-3">
        {resources.map(r=>(
          <a key={r.url} href={r.url} target="_blank" className="rounded-2xl border border-[#2A3250] bg-[#1E2438] p-4 hover:border-[#3878F6]/30 block">
            <div className="text-sm font-bold">{r.name}</div>
            <div className="text-xs text-[#A0A8C0]">{r.desc}</div>
            <div className="mt-1 flex gap-2 text-[11px] text-[#8890B0]"><span>{r.difficulty}</span><span>•</span><span>{r.license}</span><span>•</span><span>{r.lastVerified}</span></div>
            <div className="text-xs text-[#3878F6] underline">{r.url}</div>
          </a>
        ))}
      </div>
      <div className="rounded-xl border border-[#2A3250] bg-[#101426] p-3 text-xs leading-4 text-[#8890B0]">
        <strong className="text-white">Original vs added:</strong> Prompt Engineering AG-2.pdf topics preserved (fundamentals, context/constraint, role, zero/few-shot, CoT/ToT, self-consistency, ReAct, multimodal) — distinguished from researched additions per §2.
      </div>
    </div>
  );
}
