import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export default async function CareerPage(){
  const tracks = await prisma.track.findMany({orderBy:{code:"asc"}});
  const student = await prisma.user.findUnique({where:{email:"student@aihub.in"}});
  if(!student) return <div className="p-6 text-sm">Seed required</div>;
  const enrollments = await prisma.trackEnrollment.findMany({where:{userId: student.id}});
  const enrolledCodes = new Set(enrollments.map(e=>e.trackId));
  const byId = Object.fromEntries(tracks.map(t=>[t.id, t.code]));
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">AI Career Paths</h1>
      <p className="text-sm text-[#A0A8C0]">Explore 8, choose 1 — change preserves history. Each: prereqs, Beginner/Intermediate/Advanced, capstone, rubric, portfolio, career-readiness score.</p>
      <div className="grid gap-3 md:grid-cols-2">
        {tracks.map(t=>(
          <div key={t.id} className="rounded-2xl border border-[#2A3250] bg-[#1E2438] p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-bold">{t.title} <span className="text-xs font-normal text-[#8890B0]">({t.code})</span></div>
                <div className="text-xs text-[#A0A8C0]">{t.description}</div>
              </div>
              {enrolledCodes.has(t.id) ? <span className="rounded-full bg-[#E8B94F] px-2 py-1 text-xs font-bold text-[#101426]">Enrolled</span> : <form action="/api/tracks" method="post"><input type="hidden" name="trackCode" value={t.code} /><button formAction="/api/tracks" className="rounded-full bg-[#3878F6] px-3 py-1 text-xs font-semibold text-white">Enroll</button></form>}
            </div>
            <div className="mt-2 flex gap-1 text-[11px] text-[#8890B0]"><span>L11</span><span>→</span><span>L12 ship 2</span><span>→</span><span>L13 scale + OSS</span></div>
            <div className="mt-1 text-[11px] text-[#8890B0]">Capstone: track-specific, rubric 10 dims, portfolio required, no/low/pro-code.</div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-[#2A3250] bg-[#1E2438] p-4">
        <div className="text-sm font-bold">Talent Marketplace (consent-gated)</div>
        <div className="text-xs text-[#A0A8C0]">Companies see only profiles students explicitly authorize. No opaque AI ranking — skill-based discovery + project browsing + hackathon sponsorship. Student: resume builder, verified portfolio, competency report, mock interviews.</div>
        <div className="mt-2 text-xs text-[#8890B0]">Corporate: `GET /api/tracks` + `GET /api/leaderboard` + `GET /api/github` — all tenant-scoped + consent check.</div>
      </div>
    </div>
  );
}
