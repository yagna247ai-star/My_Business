import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/, "upper required").regex(/[a-z]/, "lower required").regex(/[0-9]/, "number required"),
  inviteCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const raw = {
      name: String(form.get("name") || ""),
      email: String(form.get("email") || "").toLowerCase(),
      password: String(form.get("password") || ""),
      inviteCode: String(form.get("inviteCode") || ""),
    };
    // Also support JSON
    const ct = req.headers.get("content-type") || "";
    let data = raw;
    if (ct.includes("application/json")) {
      const j = await req.json().catch(() => raw);
      data = { name: j.name, email: String(j.email || "").toLowerCase(), password: j.password, inviteCode: j.inviteCode };
    }
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    const tenant = await prisma.tenant.findUnique({ where: { slug: "demo" } });
  if(!tenant) return NextResponse.json({error:"No tenant"},{status:500});
    if (!tenant) return NextResponse.json({ error: "No tenant" }, { status: 500 });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, name, passwordHash: hash, emailVerified: true },
    });

    const learnerRole = await prisma.role.findUnique({ where: { code: "learner" } });
    if (!learnerRole) return NextResponse.json({ error: "No learner role" }, { status: 500 });

    await prisma.membership.create({
      data: { tenantId: tenant.id, userId: user.id, roleId: learnerRole.id, status: "active" },
    });

    // Enroll in journey
    const journey = await prisma.journey.findFirst({ where: { tenantId: tenant.id } });
    if (journey) {
      const enrollment = await prisma.enrollment.create({
        data: { tenantId: tenant.id, userId: user.id, journeyId: journey.id, currentLevelIdx: 1, state: "active" },
      });
      const l1 = await prisma.level.findUnique({ where: { journeyId_idx: { journeyId: journey.id, idx: 1 } } });
      if (l1) {
        const prog = await prisma.progress.create({
          data: { tenantId: tenant.id, enrollmentId: enrollment.id, levelId: l1.id, userId: user.id, state: "available" },
        });
        await prisma.bossChallengeProgress.create({ data: { progressId: prog.id, state: "locked" } });
        await prisma.streak.create({ data: { tenantId: tenant.id, userId: user.id, currentStreak: 1, longestStreak: 1, lastActiveDate: new Date().toISOString().split("T")[0] } });
        await prisma.entitlement.createMany({
          data: [
            { tenantId: tenant.id, userId: user.id, feature: "level_access", remaining: 15 },
            { tenantId: tenant.id, userId: user.id, feature: "ai_credits", remaining: 50 },
          ],
        });
      }
    }

    await prisma.auditLog.create({
      data: { tenantId: tenant.id, actorUserId: user.id, action: "user.register", resourceType: "User", resourceId: user.id, after: JSON.stringify({ email }) },
    });

    // For form POST, redirect to login
    if (req.headers.get("accept")?.includes("text/html") || ct.includes("multipart/form-data") || ct.includes("application/x-www-form-urlencoded")) {
      return NextResponse.redirect(new URL("/login?registered=1", req.url));
    }
    return NextResponse.json({ ok: true, userId: user.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
