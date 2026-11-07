import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export default async function CertificatesPage(){
  const student = await prisma.user.findUnique({where:{email:"student@aihub.in"}});
  if(!student) return <div className="p-6 text-sm">Seed required</div>;
  const badges = await prisma.userBadge.findMany({where:{userId: student.id}, include:{badge:true}, orderBy:{earnedAt:"desc"}});
  const progress = await prisma.progress.findMany({where:{userId: student.id, state:"approved"}, include:{level:true}, orderBy:{completedAt:"desc"}});
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Certificates</h1>
      <p className="text-sm text-[#A0A8C0]">Earned via competence — not attendance. AI never sole authority for high-stakes certs (human review + appeals).</p>
      <div className="grid gap-3 md:grid-cols-2">
        {progress.map(p=>(
          <div key={p.id} className="rounded-2xl border border-[#E8B94F]/30 bg-[#1E2438] p-4">
            <div className="flex items-center justify-between"><span className="text-sm font-bold">{p.level.title}</span><span className="rounded-full bg-[#E8B94F] px-2 py-1 text-xs font-bold text-[#101426]">Certified</span></div>
            <div className="text-xs text-[#A0A8C0]">{p.level.code} · {p.completedAt ? new Date(p.completedAt).toLocaleDateString() : ""} · {p.xpEarned} XP</div>
            <div className="mt-2 text-xs text-[#8890B0]">Rubric {p.level.code}_RUBRIC ≥3.0 · Boss passed · Shareable card + verification hash</div>
            <button className="mt-2 rounded-full border border-[#2A3250] bg-[#101426] px-3 py-1 text-xs">Download PDF (mock)</button>
          </div>
        ))}
        {progress.length===0 && <div className="col-span-2 rounded-2xl border border-[#2A3250] bg-[#1E2438] p-6 text-sm text-[#8890B0]">No certificates yet — approve L01 to earn “Awakened”.</div>}
      </div>
      <div className="rounded-2xl border border-[#2A3250] bg-[#1E2438] p-4">
        <div className="text-sm font-bold">Badges ({badges.length}) — shareable cards</div>
        <div className="mt-2 flex flex-wrap gap-2">{badges.map(b=> <span key={b.id} className="rounded-full bg-[#E8B94F] px-3 py-1 text-xs font-bold text-[#101426]">{b.badge.icon} {b.badge.name} · {b.badge.tier}</span>)}{badges.length===0 && <span className="text-xs text-[#8890B0]">No badges.</span>}</div>
        <div className="mt-3 text-xs text-[#8890B0]">Badges via JSONLogic conditions, XP bonus, `user_badges` UNIQUE. Share: Reels-friendly card via Marketing Studio (human approval before publish).</div>
      </div>
    </div>
  );
}
