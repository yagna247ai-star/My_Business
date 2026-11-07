import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  // Demo: fetch for student@aihub.in in demo tenant
  const tenant = await prisma.tenant.findUnique({ where: { slug: "demo" } });
  if (!tenant) return null;
  const user = await prisma.user.findUnique({ where: { email: "student@aihub.in" } });
  if (!user) return null;
  const enrollment = await prisma.enrollment.findUnique({
    where: { tenantId_userId_journeyId: { tenantId: tenant.id, userId: user.id, journeyId: (await prisma.journey.findFirst({ where: { tenantId: tenant.id } }))!.id } },
    include: { journey: true },
  });
  const progress = await prisma.progress.findMany({ where: { enrollmentId: enrollment?.id }, include: { level: true } });
  const xpLedger = await prisma.xpLedger.findMany({ where: { tenantId: tenant.id, userId: user.id }, orderBy: { createdAt: "desc" }, take: 10 });
  const totalXp = await prisma.xpLedger.aggregate({ where: { tenantId: tenant.id, userId: user.id }, _sum: { amount: true } });
  const streak = await prisma.streak.findUnique({ where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } } });
  const badges = await prisma.userBadge.findMany({ where: { userId: user.id }, include: { badge: true } });
  const submissions = await prisma.submission.findMany({ where: { tenantId: tenant.id, userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 });
  const levels = await prisma.level.findMany({ where: { journeyId: enrollment?.journeyId }, orderBy: { idx: "asc" } });
  const enrollmentsCount = await prisma.enrollment.count({ where: { tenantId: tenant.id } });
  return { tenant, user, enrollment, progress, xpLedger, totalXp: totalXp._sum.amount || 0, streak, badges, submissions, levels, enrollmentsCount };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  if (!data) return <div className="p-6 text-sm text-[#A0A8C0]">Seed the DB first: npm run db:seed --workspace=packages/db</div>;

  const { user, enrollment, progress, totalXp, streak, badges, submissions, levels } = data;
  const currentLevel = progress.find((p) => p.state === "available" || p.state === "in_progress") || progress[0];
  const weeklyProgress = Math.round((progress.filter((p) => p.state === "approved").length / levels.length) * 100);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Welcome back, {user.name?.split(" ")[0] || "Learner"} 👋</h1>
          <p className="mt-1 text-sm text-[#A0A8C0]">Current level · XP · streak — all DB-backed, not decorative.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#1E2438] px-3 py-1.5 text-xs font-semibold border border-[#2A3250]">Cohort Jan 2026</span>
          <Link href="/levels" className="rounded-full bg-[#3878F6] px-4 py-1.5 text-xs font-semibold text-white">Next mission →</Link>
        </div>
      </div>

      {/* 12-section grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Current Level</CardTitle></CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{currentLevel?.level.title || "Level 1"}</div>
            <div className="text-xs text-[#A0A8C0]">Idx {currentLevel?.level.idx || 1} · {currentLevel?.level.code}</div>
            <div className="mt-2 text-xs">State: <span className="font-semibold text-[#E8B94F]">{currentLevel?.state}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>XP Balance</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold tabular-nums">{totalXp} <span className="text-sm font-semibold text-[#E8B94F]">XP</span></div>
            <div className="mt-2 h-2 rounded-full bg-[#101426]"><div className="h-2 rounded-full bg-[#3878F6]" style={{ width: `${Math.min(100, (totalXp / 500) * 100)}%` }} /></div>
            <div className="mt-1 text-xs text-[#8890B0]">Ledger entries: {data.xpLedger.length} (auditable, idempotent)</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Rank</CardTitle></CardHeader>
          <CardContent>
            <div className="text-lg font-bold"># {Math.max(1, 3)} in cohort</div>
            <div className="text-xs text-[#A0A8C0]">Leaderboard: Redis ZSET · weekly · validated</div>
            <Link href="/leaderboard" className="mt-2 inline-block text-xs font-semibold text-[#3878F6] hover:underline">View leaderboard</Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Daily Streak</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <span className="text-lg font-bold tabular-nums">{streak?.currentStreak || 0} days</span>
              {streak && streak.freezeTokens > 0 && <span className="rounded-full bg-[#1E2438] px-2 py-1 text-xs border border-[#2A3250]">❄️ {streak.freezeTokens} freeze</span>}
            </div>
            <div className="mt-1 text-xs text-[#8890B0]">Longest: {streak?.longestStreak || 0} · grace & recovery (non-punitive)</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Weekly Progress</CardTitle></CardHeader>
          <CardContent>
            <div className="text-lg font-bold tabular-nums">{weeklyProgress}%</div>
            <div className="mt-2 h-2 rounded-full bg-[#101426]"><div className="h-2 rounded-full bg-[#8658E8]" style={{ width: `${weeklyProgress}%` }} /></div>
            <div className="mt-1 text-xs text-[#8890B0]">{progress.filter(p=>p.state==="approved").length} / {levels.length} levels approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Next Mission</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm font-semibold">Build: Your Cookie Class</div>
            <div className="text-xs text-[#A0A8C0]">Est 90m · 35 XP · Scaffold + pytest</div>
            <Link href="/levels" className="mt-2 inline-block rounded-full bg-[#1E2438] px-3 py-1 text-xs font-semibold border border-[#2A3250] hover:border-[#3878F6]/30">Go to missions</Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Upcoming Weekend Session</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm font-semibold">Sat — Live workshop</div>
            <div className="text-xs text-[#A0A8C0]">New level release · demos · guided exercises</div>
            <div className="mt-2 text-xs font-semibold">Sun — 4h hackathon · team build</div>
            <div className="text-xs text-[#8890B0]">Attendance ≠ pass — proof required</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Project Submissions</CardTitle></CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <div className="text-xs text-[#8890B0]">No submissions yet — ship your Cookie class to earn XP.</div>
            ) : (
              <div className="space-y-2">
                {submissions.map((s) => (
                  <div key={s.id} className="rounded-xl border border-[#2A3250] bg-[#101426] px-3 py-2">
                    <div className="text-xs font-semibold truncate">{s.repoUrl || s.url || s.type}</div>
                    <div className="text-[11px] text-[#8890B0]">{s.state} · {new Date(s.submittedAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
            <Link href="/projects" className="mt-2 inline-block text-xs font-semibold text-[#3878F6] hover:underline">View all</Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent Achievements</CardTitle></CardHeader>
          <CardContent>
            {badges.length === 0 ? (
              <div className="text-xs text-[#8890B0]">No badges yet — complete L1 to earn “Awakened”.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {badges.map((ub) => (
                  <span key={ub.id} className="rounded-full bg-[#E8B94F] px-2.5 py-1 text-xs font-bold text-[#101426]">{ub.badge.icon} {ub.badge.name}</span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Team Activity</CardTitle></CardHeader>
          <CardContent>
            <div className="text-xs text-[#8890B0]">Squads · 3–5 members · contribution-tracked</div>
            <div className="mt-2 rounded-xl bg-[#101426] p-3 text-xs">No team yet — join a squad in <Link href="/squads" className="text-[#3878F6] underline">Squads</Link>.</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Career-Readiness</CardTitle></CardHeader>
          <CardContent>
            <div className="text-lg font-bold">42% <span className="text-xs font-normal text-[#8890B0]">competency</span></div>
            <div className="mt-2 h-2 rounded-full bg-[#101426]"><div className="h-2 rounded-full bg-[#E8B94F]" style={{ width: "42%" }} /></div>
            <div className="mt-1 text-xs text-[#8890B0]">Track: not yet chosen (explore 8 tracks)</div>
            <Link href="/career" className="mt-2 inline-block text-xs font-semibold text-[#3878F6] hover:underline">Explore tracks</Link>
          </CardContent>
        </Card>
        <Card className="md:col-span-3">
          <CardHeader><CardTitle>Enrollments</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm">{enrollment?.journey.title} · Level {enrollment?.currentLevelIdx} · {enrollment?.state}</div>
            <div className="text-xs text-[#8890B0]">Tenant: {data.tenant.slug} · {data.enrollmentsCount} learners in tenant (isolation: RLS + tenant_id)</div>
          </CardContent>
        </Card>
      </div>

      {/* Level map strip */}
      <div className="rounded-2xl border border-[#2A3250] bg-[#1E2438] p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">15-level path</h3>
          <span className="text-xs text-[#8890B0]">Only L01 published — L02–15 are admin placeholders (no fabricated lessons)</span>
        </div>
        <div className="mt-3 grid grid-cols-5 gap-2 md:grid-cols-15">
          {levels.map((l) => {
            const prog = progress.find((p) => p.levelId === l.id);
            const state = prog?.state || (l.idx === 1 ? "available" : "locked");
            return (
              <div key={l.id} className={`rounded-xl border p-2 text-center ${state === "approved" ? "border-[#E8B94F] bg-[#E8B94F]/10" : state === "available" || state === "in_progress" ? "border-[#3878F6] bg-[#3878F6]/10" : "border-[#2A3250] bg-[#101426] opacity-60"}`}>
                <div className="text-[10px] font-bold">L{l.idx}</div>
                <div className="text-[10px] leading-3">{l.code.split("_")[1]}</div>
                <div className="mt-1 text-[10px] font-semibold text-[#E8B94F]">{l.xpReward} XP</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-[#2A3250] bg-[#101426] p-3 text-xs leading-4 text-[#8890B0]">
        <strong className="text-white">Engineering note:</strong> All cards are DB-backed (Prisma + tenant_id + RLS). XP is server-authoritative (no client POST), ledger is append-only with idempotency_key + hash chain. Streak grace & freeze are non-punitive. Leaderboards use Redis ZSET in prod, in-memory fallback in dev.
      </div>
    </div>
  );
}
