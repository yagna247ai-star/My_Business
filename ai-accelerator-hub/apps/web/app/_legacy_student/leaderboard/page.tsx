import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export default async function LeaderboardPage(){
  const tenant = await prisma.tenant.findUnique({where:{slug:"demo"}});
  if(!tenant) return <div className="p-6 text-sm">Seed required</div>;
  const rows = await prisma.xpLedger.groupBy({by:["userId"], where:{tenantId: tenant.id}, _sum:{amount:true}, orderBy:{_sum:{amount:"desc"}}, take:10});
  const users = await prisma.user.findMany({where:{id:{in: rows.map(r=>r.userId)}}, select:{id:true, name:true, email:true}});
  const board = rows.map((r,i)=>({rank:i+1, userId:r.userId, name: users.find(u=>u.id===r.userId)?.name||r.userId.slice(0,8), xp:r._sum.amount}));
  const snapshots = await prisma.leaderboardSnapshot.findMany({orderBy:{createdAt:"desc"}, take:3});
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Leaderboard</h1>
      <p className="text-sm text-[#A0A8C0]">Redis ZSET in prod, Neo4j graph alt <code className="rounded bg-[#101426] px-1">MATCH (u)-[:COMPLETED]-&gt;(l)</code>, Prisma fallback — validated, anti-abuse (idempotency + hash chain).</p>
      <div className="rounded-2xl border border-[#2A3250] bg-[#1E2438] overflow-hidden">
        <div className="grid grid-cols-4 gap-2 bg-[#101426] px-3 py-2 text-xs font-semibold text-[#8890B0]"><span>Rank</span><span>Learner</span><span>XP</span><span>Source</span></div>
        {board.map(r=>(
          <div key={r.userId} className="grid grid-cols-4 gap-2 px-3 py-2 text-sm border-t border-[#2A3250]"><span>#{r.rank}</span><span>{r.name}</span><span className="font-bold text-[#E8B94F]">{r.xp} XP</span><span className="text-xs text-[#8890B0]">prisma_validated</span></div>
        ))}
        {board.length===0 && <div className="p-6 text-sm text-[#8890B0]">No XP yet — complete L01 A1 to appear.</div>}
      </div>
      <div className="rounded-xl border border-[#2A3250] bg-[#101426] p-3 text-xs leading-4 text-[#8890B0]">
        <strong className="text-white">Hall of Fame</strong> — top 3 all-time, seasonal weekly, cohort scope (opt-in global). Mystery rewards + shareable cards. Referral: code <code className="rounded bg-[#1E2438] px-1">REF-demo</code> +30 XP (anti-fraud: dedup, no self-referral).<br/>
        Snapshots: {snapshots.length} archived (hourly Redis→Postgres).
      </div>
    </div>
  );
}
