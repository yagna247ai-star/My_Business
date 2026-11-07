import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// POST /api/submissions — creates submission (pending) + marks Activity 5 completed + server-side XP (+5) with idempotency
// Requires: repoUrl, reflectionMd, levelCode (for demo, uses student@aihub.in)
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const repoUrl = String(form.get("repoUrl") || form.get("url") || "").trim();
    const reflectionMd = String(form.get("reflectionMd") || "").trim();
    const levelCode = String(form.get("levelCode") || "L01_AWAKENING").trim();
    const idempotencyKey = req.headers.get("idempotency-key") || req.headers.get("x-idempotency-key") || `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    if (!repoUrl || !repoUrl.startsWith("https://")) return NextResponse.json({ error: "Valid https repoUrl required" }, { status: 400 });
    try { new URL(repoUrl); } catch { return NextResponse.json({ error: "Invalid URL" }, { status: 400 }); }
    if (reflectionMd.split(/\s+/).filter(Boolean).length < 10) return NextResponse.json({ error: "Reflection ≥10 words required (≥50 words recommended)" }, { status: 400 });

    // Idempotency check
    const existingKey = await prisma.idempotencyKey.findUnique({ where: { key: idempotencyKey } });
    if (existingKey) return NextResponse.json(JSON.parse(existingKey.response || "{}"), { status: 200 });

    const tenant = await prisma.tenant.findUnique({ where: { slug: "demo" } });
  if(!tenant) return NextResponse.json({error:"No tenant"},{status:500});
    if (!tenant) return NextResponse.json({ error: "No tenant" }, { status: 500 });
    const user = await prisma.user.findUnique({ where: { email: "student@aihub.in" } });
    if (!user) return NextResponse.json({ error: "Demo user not seeded" }, { status: 500 });

    const level = await prisma.level.findFirst({ where: { tenantId: tenant.id, code: levelCode } });
    if (!level) return NextResponse.json({ error: "Level not found" }, { status: 404 });
    const enrollment = await prisma.enrollment.findUnique({ where: { tenantId_userId_journeyId: { tenantId: tenant.id, userId: user.id, journeyId: level.journeyId } } });
    if (!enrollment) return NextResponse.json({ error: "Not enrolled" }, { status: 400 });
    const progress = await prisma.progress.findUnique({ where: { enrollmentId_levelId: { enrollmentId: enrollment.id, levelId: level.id } } });
    if (!progress) return NextResponse.json({ error: "No progress" }, { status: 400 });

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        tenantId: tenant.id, userId: user.id, progressId: progress.id,
        type: "repo", repoUrl, reflectionMd, state: "pending", url: repoUrl,
        metadata: JSON.stringify({ levelCode, wordCount: reflectionMd.split(/\s+/).length }),
      },
    });

    // Mark Activity 5 (SUBMIT_PROOF) completed + award +5 XP (server-side, no client can set amount)
    const act5 = await prisma.activity.findUnique({ where: { levelId_idx: { levelId: level.id, idx: 5 } } });
    if (act5) {
      await prisma.activityProgress.upsert({
        where: { progressId_activityId: { progressId: progress.id, activityId: act5.id } },
        update: { state: "completed", xpEarned: act5.xpReward, completedAt: new Date(), data: JSON.stringify({ submissionId: submission.id }) },
        create: { progressId: progress.id, activityId: act5.id, userId: user.id, enrollmentId: enrollment.id, state: "completed", xpEarned: act5.xpReward, completedAt: new Date(), data: JSON.stringify({ submissionId: submission.id }) },
      });
      // XP ledger — append-only, idempotency, hash chain
      const idem = `xp-${user.id}-${act5.id}-${submission.id}`;
      const prev = await prisma.xpLedger.findFirst({ where: { tenantId: tenant.id, userId: user.id }, orderBy: { createdAt: "desc" } });
      const rowHash = crypto.createHash("sha256").update(JSON.stringify({ userId: user.id, amount: act5.xpReward, prevHash: prev?.rowHash || "genesis", idem })).digest("hex");
      await prisma.xpLedger.create({
        data: { tenantId: tenant.id, userId: user.id, amount: act5.xpReward, source: "submission_created", levelId: level.id, activityId: act5.id, idempotencyKey: idem, prevHash: prev?.rowHash || null, rowHash, metadata: JSON.stringify({ submissionId: submission.id }) },
      }).catch(() => {}); // ignore duplicate idempotency
      // Update progress xpEarned
      await prisma.progress.update({ where: { id: progress.id }, data: { xpEarned: { increment: act5.xpReward }, state: "submitted" } });
      // Streak touch (IST date)
      const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      await prisma.streak.upsert({
        where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
        update: { lastActiveDate: today, currentStreak: { increment: 0 } },
        create: { tenantId: tenant.id, userId: user.id, currentStreak: 1, longestStreak: 1, lastActiveDate: today },
      });
      await prisma.streakEvent.create({ data: { tenantId: tenant.id, userId: user.id, date: today, type: "active" } }).catch(() => {});
    }

    await prisma.auditLog.create({ data: { tenantId: tenant.id, actorUserId: user.id, action: "submission.create", resourceType: "Submission", resourceId: submission.id, after: JSON.stringify({ repoUrl }) } });

    const response = { ok: true, submissionId: submission.id, state: submission.state };
    await prisma.idempotencyKey.create({ data: { key: idempotencyKey, tenantId: tenant.id, scope: "submission.create", response: JSON.stringify(response), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } }).catch(() => {});
    // For form POST, redirect back
    if (req.headers.get("accept")?.includes("text/html")) {
      return NextResponse.redirect(new URL(`/levels/${level.code}?submitted=1`, req.url));
    }
    return NextResponse.json(response);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const tenant = await prisma.tenant.findUnique({ where: { slug: "demo" } });
  if(!tenant) return NextResponse.json({error:"No tenant"},{status:500});
  if (!tenant) return NextResponse.json({ error: "No tenant" }, { status: 500 });
  const submissions = await prisma.submission.findMany({ where: { tenantId: tenant.id }, orderBy: { createdAt: "desc" }, take: 20, include: { user: { select: { email: true, name: true } } } });
  return NextResponse.json(submissions);
}
