import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(){
  const tracks = await prisma.track.findMany({orderBy:{code:"asc"}});
  const student = await prisma.user.findUnique({where:{email:"student@aihub.in"}});
  if(!student) return NextResponse.json({error:"Not seeded"},{status:500});
  const enrollments = student ? await prisma.trackEnrollment.findMany({where:{userId: student.id}}) : [];
  return NextResponse.json({
    tracks: tracks.map(t=>({
      code: t.code,
      title: t.title,
      description: t.description,
      enrolled: enrollments.some(e=>e.trackId===t.id),
      prerequisites: t.prerequisites ? JSON.parse(t.prerequisites) : null,
      pathways: { beginner: "L11", intermediate: "L12", advanced: "L13", capstone: "Portfolio + rubric + career-readiness score" },
      noCodeOption: true
    })),
    note: "Explore all 8, choose 1, change preserves history — no/low/pro-code per §7"
  });
}

export async function POST(req: Request){
  const { trackCode } = await req.json();
  if(!trackCode) return NextResponse.json({error:"trackCode required"},{status:400});
  const track = await prisma.track.findUnique({where:{code: trackCode}});
  if(!track) return NextResponse.json({error:"Unknown track"},{status:404});
  const student = await prisma.user.findUnique({where:{email:"student@aihub.in"}});
  if(!student) return NextResponse.json({error:"Not seeded"},{status:500});
  const existing = await prisma.trackEnrollment.findUnique({where:{userId_trackId:{userId: student.id, trackId: track.id}}});
  if(existing) return NextResponse.json({enrollment: existing, note:"Already enrolled — history preserved"});
  const enrollment = await prisma.trackEnrollment.create({data:{userId: student.id, trackId: track.id, state:"active"}});
  return NextResponse.json({ enrollment, track: track.title });
}
