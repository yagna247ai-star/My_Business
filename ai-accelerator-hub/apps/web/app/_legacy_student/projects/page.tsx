import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export default async function ProjectsPage(){
  const tenant = await prisma.tenant.findUnique({where:{slug:"demo"}});
  const student = await prisma.user.findUnique({where:{email:"student@aihub.in"}});
  if(!tenant || !student) return <div className="p-6 text-sm">Seed required</div>;
  const projects = await prisma.project.findMany({where:{tenantId: tenant.id, userId: student.id}, include:{repos:true}, orderBy:{createdAt:"desc"}});
  const submissions = await prisma.submission.findMany({where:{tenantId: tenant.id, userId: student.id}, orderBy:{createdAt:"desc"}, take:5});
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">My Projects</h1>
      <p className="text-sm text-[#A0A8C0]">GitHub-linked · commit history · PRs · showcase. Flow: Explore → Fork → Modify → Build → Deploy → Showcase.</p>
      <div className="rounded-2xl border border-[#2A3250] bg-[#1E2438] p-4">
        <div className="text-sm font-bold">Projects ({projects.length})</div>
        {projects.map(p=>(
          <div key={p.id} className="mt-3 rounded-xl border border-[#2A3250] bg-[#101426] p-3">
            <div className="text-sm font-semibold">{p.title} {p.isPublic && <span className="rounded-full bg-[#E8B94F] px-2 py-0.5 text-xs font-bold text-[#101426]">Public</span>}</div>
            <div className="text-xs text-[#A0A8C0]">{p.description}</div>
            {p.repos.map(r=> { const meta = JSON.parse(r.analysis||"{}"); return <a key={r.id} href={r.repoUrl} target="_blank" className="text-xs text-[#3878F6] underline block">{r.repoUrl} · {r.provider} {meta.license?`· ${meta.license}`:""}</a>;})}
          </div>
        ))}
        {projects.length===0 && <div className="mt-2 text-sm text-[#8890B0]">No projects — link a repo via <code className="rounded bg-[#101426] px-1">POST /api/projects</code>.</div>}
      </div>
      <div className="rounded-2xl border border-[#2A3250] bg-[#1E2438] p-4">
        <div className="text-sm font-bold">Recent Submissions</div>
        {submissions.map(s=>(
          <div key={s.id} className="mt-2 rounded-xl border border-[#2A3250] bg-[#101426] px-3 py-2 text-xs">
            <div className="font-semibold">{s.repoUrl||s.url} · {s.state}</div>
            <div className="text-[#8890B0]">{new Date(s.submittedAt).toLocaleDateString()} · {s.type}</div>
          </div>
        ))}
        {submissions.length===0 && <div className="mt-2 text-sm text-[#8890B0]">No submissions — submit via L01 /levels/L01_AWAKENING.</div>}
      </div>
    </div>
  );
}
