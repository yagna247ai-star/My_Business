import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function LevelDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { slug: "demo" } });
  if (!tenant) return <div className="p-6">No tenant</div>;
  const level = await prisma.level.findFirst({ where: { tenantId: tenant.id, code } });
  if (!level) return <div className="p-6">Level not found</div>;
  const activities = await prisma.activity.findMany({ where: { levelId: level.id }, orderBy: { idx: "asc" } });

  // Demo progress for student
  const user = await prisma.user.findUnique({ where: { email: "student@aihub.in" } });
  const enrollment = user ? await prisma.enrollment.findFirst({ where: { tenantId: tenant.id, userId: user.id } }) : null;
  const progress = enrollment ? await prisma.progress.findUnique({ where: { enrollmentId_levelId: { enrollmentId: enrollment.id, levelId: level.id } } }) : null;
  const activityProgress = progress ? await prisma.activityProgress.findMany({ where: { progressId: progress.id } }) : [];
  const apById: Record<string, string> = Object.fromEntries(activityProgress.map((ap) => [ap.activityId, ap.state]));
  const submissions = progress ? await prisma.submission.findMany({ where: { progressId: progress.id }, orderBy: { createdAt: "desc" } }) : [];
  const isL01 = level.code === "L01_AWAKENING";

  return (
    <div className="space-y-6">
      <Link href="/levels" className="text-xs text-[#8890B0] hover:text-white">← Back to levels</Link>
      <div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#E8B94F] px-2.5 py-1 text-xs font-bold text-[#101426]">L{level.idx}</span>
          <span className="text-xs text-[#8890B0]">{level.code} · {level.xpReward} XP · {progress?.state || "available"}</span>
        </div>
        <h1 className="mt-2 text-xl font-bold">{level.title}</h1>
        <p className="mt-1 text-sm leading-5 text-[#A0A8C0]">{level.summary}</p>
        <p className="mt-2 text-xs leading-4 text-[#8890B0]">Progressive unlock via competence — attendance alone never passes. All progress is DB-backed (progress + activity_progress + submissions + xp_ledger).</p>
      </div>

      {/* 6-activity tabs */}
      <div className="grid gap-4">
        {activities.map((a) => {
          const cfg = JSON.parse(a.config || "{}");
          const state = apById[a.id] || "pending";
          const done = state === "completed";
          return (
            <Card key={a.id} className={`${done ? "border-[#E8B94F]/30" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${done ? "bg-[#E8B94F]" : state === "in_progress" ? "bg-[#3878F6]" : "bg-[#2A3250]"}`} />
                    <span className="text-xs font-bold tracking-widest text-[#8890B0]">ACTIVITY {a.idx}</span>
                    <span className="rounded-full bg-[#101426] px-2 py-1 text-xs font-semibold border border-[#2A3250]">+{a.xpReward} XP</span>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${done ? "bg-[#E8B94F] text-[#101426]" : "bg-[#2A3250] text-[#8890B0]"}`}>{state}</span>
                  </div>
                  <div className="mt-2 text-sm font-semibold">{a.title}</div>
                  <div className="mt-1 text-xs leading-4 text-[#A0A8C0]">
                    {cfg.placeholder ? "Placeholder — admin will publish real content. No fabricated lesson." : JSON.stringify(cfg).slice(0, 200)}
                  </div>
                  {a.code === "MISSION_BRIEFING" && isL01 && (
                    <div className="mt-3 rounded-xl border border-[#3878F6]/20 bg-[#3878F6]/5 p-3 text-xs leading-4 text-[#A0A8C0]">
                      <strong className="text-white">The Cookie Factory —</strong> the mould is broken. Model cookies as objects (shape, bake state, shared oven_temp). Stakeholder: Factory Ops. Boss preview: The Mould Trial.
                    </div>
                  )}
                  {a.code === "LEARN" && isL01 && (
                    <div className="mt-3 space-y-2">
                      <div className="rounded-xl bg-[#101426] p-3 text-xs">▶ Video: “Mould and the Cookie” (9m) — min 80% watch (server-verified)</div>
                      <div className="rounded-xl bg-[#101426] p-3 text-xs">📄 MD: “Shared or Personal?” — class vs instance attributes</div>
                      <div className="rounded-xl bg-[#101426] p-3 text-xs">❓ Quiz: 4 Qs — pass ≥60% to complete Learn</div>
                    </div>
                  )}
                  {a.code === "EXPLORE_GITHUB" && isL01 && (
                    <div className="mt-3 rounded-xl bg-[#101426] p-3 text-xs leading-4">🔗 Repos: org/cookie-demo (must run `python demo.py`) + org/oop-examples (optional) — 2 code Qs, ≥1 correct. GitHub OAuth check or self-attest.</div>
                  )}
                  {a.code === "BUILD" && isL01 && (
                    <div className="mt-3 rounded-xl bg-[#101426] p-3 text-xs leading-4">🛠 Scaffold: level01-scaffold — Todos: class Cookie, __init__(self,shape), oven_temp (class attr), 2 instances — harness `pytest tests/test_cookie.py -q` + git push to linked repo.</div>
                  )}
                  {a.code === "SUBMIT_PROOF" && isL01 && (
                    <form action="/api/submissions" method="post" className="mt-3 space-y-2 rounded-xl bg-[#101426] p-3">
                      <input type="hidden" name="levelCode" value={level.code} />
                      <div className="text-xs font-semibold">Submit proof (real, not fake):</div>
                      <input name="repoUrl" placeholder="https://github.com/you/cookie-demo" className="w-full rounded-lg border border-[#2A3250] bg-[#0e1324] px-3 py-2 text-xs" />
                      <textarea name="reflectionMd" placeholder="Reflection ≥50 words — what you learned about objects vs instances" rows={3} className="w-full rounded-lg border border-[#2A3250] bg-[#0e1324] px-3 py-2 text-xs" />
                      <button type="submit" className="rounded-full bg-[#3878F6] px-4 py-2 text-xs font-semibold text-white">Submit for review</button>
                      <div className="text-[11px] text-[#8890B0]">Creates submission (pending) + activity_progress completed (+5 XP server-side). Mentor review → rubric → XP.</div>
                    </form>
                  )}
                  {a.code === "EVALUATION_BOSS" && isL01 && (
                    <div className="mt-3 space-y-2 rounded-xl bg-[#101426] p-3 text-xs leading-4">
                      <div>📋 Rubric L01_RUBRIC — 5 dims weighted (Correctness 30, OOP 25, Quality 20, Reflection 15, Boss 10) — pass ≥3.0 and boss ≥2.</div>
                      <div>👹 Boss: Cookie.count + @classmethod total_baked() — harness `tests/test_boss.py` 3 tests, 3 attempts, 60m, review SLA 48h, AI pre-review.</div>
                      {submissions[0] && <div className="rounded-lg border border-[#2A3250] p-2">Latest: {submissions[0].state} · {submissions[0].repoUrl}</div>}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* State & XP flow */}
      <div className="rounded-xl border border-[#2A3250] bg-[#1E2438] p-4 text-xs leading-4 text-[#A0A8C0]">
        <strong className="text-white">State/XP flow (happy):</strong> available → A1 viewed +5 → A2 80%+quiz≥60% +18 → A3 clone+1/2 +10 → A4 push +35 → A5 submitted +5 → A6 in_progress → AI pre-review + human approved (3.45) + boss 3/3 → +47 → progress approved → enrollment.current_level_idx=2 → L2 unlocked → badge oop-master +20 → ZINCRBY → Novu level_unlocked → Socket progress:updated. On needs_changes/rejected: A6 stays in_progress, A5 available for resubmit, no XP loss.
      </div>

      <div className="flex gap-2">
        <form action="/api/progress/complete" method="post">
          <input type="hidden" name="levelCode" value={level.code} />
          <input type="hidden" name="action" value="mark_activity" />
          <input type="hidden" name="activityIdx" value="1" />
          <button type="submit" className="rounded-full bg-[#E8B94F] px-4 py-2 text-xs font-bold text-[#101426]">Mark A1 complete (+5 XP demo)</button>
        </form>
        <Link href="/dashboard" className="rounded-full border border-[#2A3250] bg-[#1E2438] px-4 py-2 text-xs font-semibold">Back to dashboard</Link>
      </div>
    </div>
  );
}
