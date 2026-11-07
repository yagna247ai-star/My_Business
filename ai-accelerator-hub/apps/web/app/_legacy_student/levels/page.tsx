import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function LevelsPage() {
  const tenant = await prisma.tenant.findUnique({ where: { slug: "demo" } });
  if(!tenant) return <div className="p-6 text-sm">Seed required</div>;
  if (!tenant) return <div className="p-6 text-sm">No tenant</div>;
  const journey = await prisma.journey.findFirst({ where: { tenantId: tenant.id } });
  if (!journey) return <div className="p-6 text-sm">No journey</div>;
  const levels = await prisma.level.findMany({ where: { journeyId: journey.id }, orderBy: { idx: "asc" }, include: { stage: true } });
  const user = await prisma.user.findUnique({ where: { email: "student@aihub.in" } });
  const enrollment = user ? await prisma.enrollment.findUnique({ where: { tenantId_userId_journeyId: { tenantId: tenant.id, userId: user.id, journeyId: journey.id } } }) : null;
  const progress = enrollment ? await prisma.progress.findMany({ where: { enrollmentId: enrollment.id } }) : [];

  const byId: Record<string, string> = Object.fromEntries(progress.map((p) => [p.levelId, p.state]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">My Levels — GenAI Career Accelerator</h1>
        <p className="mt-1 text-sm text-[#A0A8C0]">15 levels · 5 stages · progressive unlock (competence-gated). Only Level 1 is published — others are admin placeholders.</p>
      </div>

      <div className="grid gap-4">
        {levels.map((l) => {
          const state = byId[l.id] || (l.idx === 1 ? "available" : "locked");
          const locked = state === "locked";
          return (
            <Card key={l.id} className={`${locked ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${state === "approved" ? "bg-[#E8B94F] text-[#101426]" : state === "available" || state === "in_progress" ? "bg-[#3878F6] text-white" : "bg-[#2A3250] text-[#8890B0]"}`}>
                      L{l.idx} · {state.toUpperCase()}
                    </span>
                    <span className="text-xs text-[#8890B0]">{l.stage?.title} · {l.xpReward} XP</span>
                  </div>
                  <div className="mt-2 text-sm font-semibold">{l.title}</div>
                  <div className="mt-1 text-sm leading-5 text-[#A0A8C0]">{l.summary}</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {JSON.parse(l.tags || "[]").map((t: string) => (
                      <span key={t} className="rounded-full border border-[#2A3250] bg-[#101426] px-2 py-1 text-[11px] text-[#8890B0]">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="shrink-0">
                  {locked ? (
                    <span className="rounded-full bg-[#101426] px-4 py-2 text-xs font-semibold border border-[#2A3250]">🔒 Locked</span>
                  ) : (
                    <Link href={`/levels/${l.code}`} className="rounded-full bg-[#3878F6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2f66d6]">
                      Open →
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
