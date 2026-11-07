import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCtx } from "@/lib/server/context";
import { leaderboard } from "@/lib/domain/insights";

// Restored 2026-11-07 with the same fields. Now requires sign-in and is scoped to the caller's
// institution; the hall of fame uses the privacy-aware leaderboard (private learners and minors are anonymous).
export async function GET() {
  const ctx = await getCtx();
  if (!ctx) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in to continue." } }, { status: 401 });
  const quests = await prisma.quest.findMany({ orderBy: { xpReward: "desc" } });
  const badges = await prisma.badge.findMany({ orderBy: { xpBonus: "desc" }, take: 20 });
  // Mock seasonal: current month quest
  const seasonal = { code: "season-dec-2026", title: "December Sprint — Ship 3", xpReward: 150, endsAt: "2026-12-31", progress: 0 };
  // Hall of Fame: top 3 by XP in this institution
  const lb = await leaderboard(ctx, "tenant", 3);
  const hallWithNames = lb.rows.map(r => ({ userId: r.userId, name: r.name, xp: r.xp }));
  return NextResponse.json({ quests, badges, seasonal, hallOfFame: hallWithNames, referral: { code: "REF-demo", reward: 30 } });
}
