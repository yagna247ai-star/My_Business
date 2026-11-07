import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export default async function SquadsPage(){
  const tenant = await prisma.tenant.findUnique({where:{slug:"demo"}});
  if(!tenant) return <div className="p-6 text-sm">Seed required</div>;
  const teams = await prisma.team.findMany({where:{tenantId: tenant.id}, include:{members:true, cohort:true}});
  const squadsFeed = [
    {id:1, author:"Aarav", text:"Shipped RAG demo — hybrid retrieval + re-rank, 89% faithfulness", likes:12},
    {id:2, author:"Demo Learner", text:"Just unlocked L02 — Prompt Craft! Who wants to pair on few-shot eval?", likes:5},
  ];
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Squads</h1>
      <p className="text-sm text-[#A0A8C0]">3–5 members, contribution-tracked, Graph: (:User)-[:MEMBER_OF]-&gt;(:Team).</p>
      <div className="rounded-2xl border border-[#2A3250] bg-[#1E2438] p-4">
        <div className="flex items-center justify-between"><span className="text-sm font-bold">Teams ({teams.length})</span><form action="/api/teams" method="post" className="flex gap-2"><input name="name" placeholder="New squad name" className="rounded-lg border border-[#2A3250] bg-[#101426] px-2 py-1 text-xs" /><button type="submit" className="rounded-full bg-[#3878F6] px-3 py-1 text-xs font-semibold text-white">Create</button></form></div>
        {teams.map(t=>(
          <div key={t.id} className="mt-3 rounded-xl border border-[#2A3250] bg-[#101426] p-3">
            <div className="text-sm font-semibold">{t.name} <span className="text-xs font-normal text-[#8890B0]">· {t.cohort?.name}</span></div>
            <div className="text-xs text-[#A0A8C0]">{t.members.length} members · lead {t.leadUserId?.slice(0,8)}</div>
          </div>
        ))}
        {teams.length===0 && <div className="mt-3 text-sm text-[#8890B0]">No teams — create one.</div>}
      </div>
      <div className="rounded-2xl border border-[#2A3250] bg-[#1E2438] p-4">
        <div className="text-sm font-bold">Community Feed (Instagram-style, moderated)</div>
        <div className="mt-3 space-y-3">
          {squadsFeed.map(p=>(
            <div key={p.id} className="rounded-xl border border-[#2A3250] bg-[#101426] p-3">
              <div className="text-sm font-semibold">{p.author} <span className="text-xs font-normal text-[#8890B0]">· 2h ago</span></div>
              <div className="text-sm text-[#A0A8C0]">{p.text}</div>
              <div className="mt-2 text-xs text-[#8890B0]">♥ {p.likes} · 💬 Reply · 🚩 Report · Block (moderation: report → review → appeal)</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-[#8890B0]">Privacy: profiles private by default, granular settings, no sensitive-data ads, limited DM for minors (§21).</div>
      </div>
    </div>
  );
}
