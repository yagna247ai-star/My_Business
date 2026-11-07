import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { isNeo4jEnabled, runCypher } from "@/lib/neo4j";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") || "tenant";
  const limit = Math.min(parseInt(searchParams.get("limit")||"10"), 50);
  const tenant = await prisma.tenant.findUnique({where:{slug:"demo"}});
  if(!tenant) return NextResponse.json({error:"No tenant"},{status:500});

  // Try Neo4j graph first (primary), then Redis (not configured), then Prisma
  if(isNeo4jEnabled()){
    try{
      const res = await runCypher(`MATCH (u:User)-[:COMPLETED]->(l:Level) WHERE u.tenantId=$tid WITH u, count(l) as levels, sum(l.xpReward) as xp RETURN u.id as userId, u.name as name, levels, xp ORDER BY xp DESC LIMIT $limit`, {tid: tenant.id, limit});
      if(res && res.records.length>0){
        return NextResponse.json({ source:"neo4j", scope, leaderboard: res.records });
      }
    }catch(e){ console.warn("neo4j leaderboard fallback",e); }
  }
  // Prisma fallback — validated
  const rows = await prisma.xpLedger.groupBy({
    by:["userId"],
    where:{tenantId: tenant.id},
    _sum:{amount:true},
    orderBy:{_sum:{amount:"desc"}},
    take: limit,
  });
  const users = await prisma.user.findMany({where:{id:{in: rows.map(r=>r.userId)}}, select:{id:true, name:true, email:true}});
  const board = rows.map((r,i)=>({
    rank: i+1,
    userId: r.userId,
    name: users.find(u=>u.id===r.userId)?.name || users.find(u=>u.id===r.userId)?.email || r.userId.slice(0,8),
    xp: r._sum.amount,
    source: "prisma_validated"
  }));
  return NextResponse.json({ source:"prisma_validated", scope, leaderboard: board, antiAbuse: "idempotency_key UNIQUE + hash chain, no self-award" });
}
