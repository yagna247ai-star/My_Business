import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export default async function PortfolioPage(){
  const tenant = await prisma.tenant.findUnique({where:{slug:"demo"}});
  const student = await prisma.user.findUnique({where:{email:"student@aihub.in"}});
  if(!tenant || !student) return <div className="p-6 text-sm">Seed required</div>;
  const projects = await prisma.project.findMany({where:{tenantId: tenant.id, userId: student.id, isPublic:true}, include:{repos:true}});
  const badges = await prisma.userBadge.findMany({where:{userId: student.id}, include:{badge:true}});
  const xp = await prisma.xpLedger.aggregate({where:{tenantId: tenant.id, userId: student.id}, _sum:{amount:true}});
  const progress = await prisma.progress.findMany({where:{userId: student.id, state:"approved"}, include:{level:true}});
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">My Portfolio</h1>
      <p className="text-sm text-[#A0A8C0]">GitHub-style developer portfolio — verified projects + competency report (not vanity metrics).</p>
      <div className="rounded-2xl border border-[#2A3250] bg-[#1E2438] p-4">
        <div className="flex items-center gap-3"><div className="h-12 w-12 rounded-full bg-[#3878F6] flex items-center justify-center font-bold">{student.name?.[0]}</div><div><div className="font-bold">{student.name}</div><div className="text-xs text-[#A0A8C0]">{student.email} · {xp._sum.amount||0} XP · {progress.length} levels approved</div></div></div>
        <div className="mt-3 flex flex-wrap gap-2">{badges.map(b=> <span key={b.id} className="rounded-full bg-[#E8B94F] px-2 py-1 text-xs font-bold text-[#101426]">{b.badge.icon} {b.badge.name}</span>)}{badges.length===0 && <span className="text-xs text-[#8890B0]">No badges yet — complete L01.</span>}</div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {projects.map(p=>(
          <div key={p.id} className="rounded-2xl border border-[#2A3250] bg-[#1E2438] p-4">
            <div className="h-24 rounded-xl bg-[#101426] flex items-center justify-center text-xs text-[#8890B0]">Cover: 16:9 showcase</div>
            <div className="mt-2 text-sm font-bold">{p.title}</div>
            <div className="text-xs text-[#A0A8C0]">{p.description}</div>
            <div className="mt-2 flex gap-2 text-xs"><a href={p.repos[0]?.repoUrl} target="_blank" className="text-[#3878F6] underline">GitHub</a><span className="text-[#8890B0]">· Contribution graph</span></div>
          </div>
        ))}
        {projects.length===0 && <div className="col-span-2 rounded-2xl border border-[#2A3250] bg-[#1E2438] p-6 text-sm text-[#8890B0]">No public projects — showcase via GitHub Lab.</div>}
      </div>
      <div className="rounded-xl border border-[#2A3250] bg-[#101426] p-3 text-xs leading-4 text-[#8890B0]">
        <strong className="text-white">Competency report:</strong> {progress.length}/15 levels, {xp._sum.amount||0} XP, {badges.length} badges. Talent Marketplace access is consent-gated — companies see only what you authorize. No opaque ranking.
      </div>
    </div>
  );
}
