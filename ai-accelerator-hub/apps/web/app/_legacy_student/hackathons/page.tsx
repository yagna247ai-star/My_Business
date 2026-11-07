import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export default async function HackathonsPage(){
  const tenant = await prisma.tenant.findUnique({where:{slug:"demo"}});
  if(!tenant) return <div className="p-6 text-sm">Seed required</div>;
  const teams = await prisma.team.findMany({where:{tenantId: tenant.id}, include:{members:true}});
  const rubric = await prisma.rubric.findUnique({where:{code:"GENERIC_RUBRIC"}});
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Hackathons</h1>
      <p className="text-sm text-[#A0A8C0]">Mon-Fri prep · Sat workshop (new level) · Sun 4h hackathon · next week refine/submit/AI+mentor+peer. Attendance ≠ pass.</p>
      <div className="rounded-2xl border border-[#2A3250] bg-[#1E2438] p-4">
        <div className="text-sm font-bold">Weekend Engine (cohort Jan 2026)</div>
        <div className="mt-2 grid gap-2 text-xs">
          <div className="rounded-xl bg-[#101426] p-3"><strong>Sat 10am IST</strong> — Live workshop, demos, guided exercises. Recording → `/api/resources`.</div>
          <div className="rounded-xl bg-[#101426] p-3"><strong>Sun 10am-2pm IST</strong> — 4h team hackathon, mentor rooms, `presence:join`. Submission window 7 days.</div>
          <div className="rounded-xl bg-[#101426] p-3"><strong>Eval</strong> — AI (rubric) + Mentor (functionality) + Peer (structured) → 10 dims, appeals allowed, AI never sole authority for career.</div>
        </div>
      </div>
      <div className="rounded-2xl border border-[#2A3250] bg-[#1E2438] p-4">
        <div className="text-sm font-bold">Teams ({teams.length}) — 3-5 members, contribution-tracked</div>
        {teams.map(t=>(
          <div key={t.id} className="mt-3 rounded-xl border border-[#2A3250] bg-[#101426] p-3">
            <div className="text-sm font-semibold">{t.name}</div>
            <div className="text-xs text-[#A0A8C0]">{t.members.length} members · fair scoring (not equal assumption) · mentor allocation</div>
            <div className="mt-2 flex gap-2">
              <span className="rounded-full bg-[#1E2438] px-2 py-1 text-xs border border-[#2A3250]">Problem: Build RAG for campus FAQs</span>
              <span className="rounded-full bg-[#E8B94F] px-2 py-1 text-xs font-bold text-[#101426]">Rubric: {rubric?.code}</span>
            </div>
          </div>
        ))}
        {teams.length===0 && <div className="mt-2 text-sm text-[#8890B0]">No teams yet — create via <code className="rounded bg-[#101426] px-1">POST /api/teams</code>.</div>}
      </div>
    </div>
  );
}
