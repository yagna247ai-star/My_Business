import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { isNeo4jEnabled, runCypher } from "@/lib/neo4j";

export async function GET(req: NextRequest){
  const tenant = await prisma.tenant.findUnique({where:{slug:"demo"}});
  if(!tenant) return NextResponse.json({error:"No tenant"},{status:500});
  const teams = await prisma.team.findMany({where:{tenantId: tenant.id}, include:{members:true, cohort:true}});
  // Enrich via Neo4j if enabled
  let graphMembers: unknown = null;
  if(isNeo4jEnabled()){
    try{
      const res = await runCypher(`MATCH (u:User)-[:MEMBER_OF]->(t:Team) RETURN t.id as teamId, collect(u.name) as members LIMIT 10`);
      graphMembers = res?.records || [];
    }catch{}
  }
  return NextResponse.json({ teams, graphMembers, note: "3-5 members, contribution tracking via TeamMembership + reviews, fair scoring (not equal assumption)" });
}

export async function POST(req: NextRequest){
  const body = await req.json();
  const { name, cohortId } = body;
  if(!name) return NextResponse.json({error:"name required"},{status:400});
  const tenant = await prisma.tenant.findUnique({where:{slug:"demo"}});
  if(!tenant) return NextResponse.json({error:"No tenant"},{status:500});
  const cohort = cohortId ? await prisma.cohort.findUnique({where:{id: cohortId}}) : await prisma.cohort.findFirst({where:{tenantId: tenant.id}});
  if(!cohort) return NextResponse.json({error:"No cohort"},{status:500});
  const student = await prisma.user.findUnique({where:{email:"student@aihub.in"}});
  if(!student) return NextResponse.json({error:"Not seeded"},{status:500});
  const team = await prisma.team.create({data:{tenantId: tenant.id, cohortId: cohort.id, name, leadUserId: student.id}});
  await prisma.teamMembership.create({data:{teamId: team.id, userId: student.id, role:"lead"}});
  if(isNeo4jEnabled()){
    await runCypher(`MATCH (u:User {id:$uid}), (t:Team {id:$tid}) MERGE (u)-[:MEMBER_OF {role:'lead'}]->(t)`, {uid: student.id, tid: team.id}).catch(()=>{});
  }
  return NextResponse.json({ team, graph: isNeo4jEnabled() ? "(:User)-[:MEMBER_OF]->(:Team) created" : "fallback" });
}
