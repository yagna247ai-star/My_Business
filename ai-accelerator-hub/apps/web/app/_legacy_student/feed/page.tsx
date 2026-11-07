import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export default async function FeedPage(){
  const posts = await prisma.project.findMany({where:{isPublic:true}, include:{user:{select:{name:true}}, repos:true}, orderBy:{createdAt:"desc"}, take:5});
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Community Feed</h1>
      <p className="text-sm text-[#A0A8C0]">Instagram-style creator feed · project cards · achievement shares · moderation (report/block/appeal, no grooming).</p>
      <div className="space-y-3">
        {posts.map(p=>(
          <div key={p.id} className="rounded-2xl border border-[#2A3250] bg-[#1E2438] p-4">
            <div className="flex items-center gap-2"><div className="h-8 w-8 rounded-full bg-[#3878F6] flex items-center justify-center text-xs font-bold">{p.user.name?.[0]||"U"}</div><div><div className="text-sm font-semibold">{p.user.name}</div><div className="text-xs text-[#8890B0]">Shipped {p.title} · 2h ago</div></div></div>
            <div className="mt-3 text-sm font-semibold">{p.title}</div>
            <div className="text-xs text-[#A0A8C0]">{p.description}</div>
            {p.repos[0] && <a href={p.repos[0].repoUrl} target="_blank" className="mt-2 inline-block text-xs text-[#3878F6] underline">{p.repos[0].repoUrl}</a>}
            <div className="mt-3 flex gap-4 text-xs text-[#8890B0]"><span>♥ 24</span><span>💬 5</span><span>↗ Share card</span><span>🚩 Report</span></div>
          </div>
        ))}
        {posts.length===0 && <div className="rounded-2xl border border-[#2A3250] bg-[#1E2438] p-6 text-sm text-[#8890B0]">No public showcases yet — ship your first project in GitHub Lab.</div>}
      </div>
    </div>
  );
}
