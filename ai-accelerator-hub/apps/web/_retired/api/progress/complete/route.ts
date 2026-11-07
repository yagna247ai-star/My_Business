import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Demo helper: mark an activity complete and award XP server-side (idempotent)
// In prod, this would be protected by auth + tenant guard + CASL; here demo uses student@aihub.in
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const levelCode = String(form.get("levelCode") || "L01_AWAKENING");
    const activityIdx = parseInt(String(form.get("activityIdx") || "1"), 10);

    const tenant = await prisma.tenant.findUnique({ where: { slug: "demo" } });
  if(!tenant) return NextResponse.json({error:"No tenant"},{status:500});
    if (!tenant) return NextResponse.json({ error: "No tenant" }, { status: 500 });
    const user = await prisma.user.findUnique({ where: { email: "student@aihub.in" } });
    if (!user) return NextResponse.json({ error: "Not seeded" }, { status: 500 });

    const level = await prisma.level.findFirst({ where: { tenantId: tenant.id, code: levelCode } });
    if (!level) return NextResponse.json({ error: "Level not found" }, { status: 404 });
    const activity = await prisma.activity.findUnique({ where: { levelId_idx: { levelId: level.id, idx: activityIdx } } });
    if (!activity) return NextResponse.json({ error: "Activity not found" }, { status: 404 });

    const enrollment = await prisma.enrollment.findUnique({ where: { tenantId_userId_journeyId: { tenantId: tenant.id, userId: user.id, journeyId: level.journeyId } } });
    if (!enrollment) return NextResponse.json({ error: "Not enrolled" }, { status: 400 });
    let progress = await prisma.progress.findUnique({ where: { enrollmentId_levelId: { enrollmentId: enrollment.id, levelId: level.id } } });
    if (!progress) {
      progress = await prisma.progress.create({ data: { tenantId: tenant.id, enrollmentId: enrollment.id, levelId: level.id, userId: user.id, state: "in_progress" } });
    }

    // Anti-abuse: if already completed, return existing (no duplicate XP)
    const existing = await prisma.activityProgress.findUnique({ where: { progressId_activityId: { progressId: progress.id, activityId: activity.id } } });
    if (existing?.state === "completed") {
      return NextResponse.redirect(new URL(`/levels/${level.code}?already=1`, req.url));
    }

    await prisma.activityProgress.upsert({
      where: { progressId_activityId: { progressId: progress.id, activityId: activity.id } },
      update: { state: "completed", xpEarned: activity.xpReward, completedAt: new Date() },
      create: { progressId: progress.id, activityId: activity.id, userId: user.id, enrollmentId: enrollment.id, state: "completed", xpEarned: activity.xpReward, completedAt: new Date() },
    });

    // Server-side XP ledger (never trust client amount) — idempotency + hash chain
    const idem = `xp-${user.id}-${activity.id}-${progress.id}`;
    const prev = await prisma.xpLedger.findFirst({ where: { tenantId: tenant.id, userId: user.id }, orderBy: { createdAt: "desc" } });
    const rowHash = crypto.createHash("sha256").update(JSON.stringify({ userId: user.id, amount: activity.xpReward, prevHash: prev?.rowHash || "genesis", idem })).digest("hex");
    try {
      await prisma.xpLedger.create({
        data: { tenantId: tenant.id, userId: user.id, amount: activity.xpReward, source: "activity_complete", levelId: level.id, activityId: activity.id, idempotencyKey: idem, prevHash: prev?.rowHash || null, rowHash, metadata: JSON.stringify({ activityCode: activity.code }) },
      });
      await prisma.progress.update({ where: { id: progress.id }, data: { xpEarned: { increment: activity.xpReward }, state: "in_progress" } });
    } catch {
      // duplicate idempotency — no double XP
    }

    // Streak (non-punitive, IST)
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    await prisma.streak.upsert({
      where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
      update: { lastActiveDate: today },
      create: { tenantId: tenant.id, userId: user.id, currentStreak: 1, longestStreak: 1, lastActiveDate: today },
    });
    await prisma.streakEvent.create({ data: { tenantId: tenant.id, userId: user.id, date: today, type: "active" } }).catch(() => {});
    await prisma.auditLog.create({ data: { tenantId: tenant.id, actorUserId: user.id, action: "activity.complete", resourceType: "ActivityProgress", resourceId: activity.id, after: JSON.stringify({ activityCode: activity.code, xp: activity.xpReward }) } });

    return NextResponse.redirect(new URL(`/levels/${level.code}?completed=${activityIdx}`, req.url));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
