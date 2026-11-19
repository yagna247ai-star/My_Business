/**
 * Local demo only: 22 fictional learners in five areas, with approved levels and XP, so area crowns,
 * the global ranking and the final-fight bracket have real rows to rank. Re-runnable (fixed keys).
 * Also sets the main demo learner's area to Hyderabad. Do not run against production data.
 *   DATABASE_URL=file:./local.db npx tsx prisma/demo-area-learners.ts
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const PASSWORD = 'Learner@12345';

// name, area, levels approved (1–9), share of each level's XP earned (0–1)
const LEARNERS: [string, string, number, number][] = [
  ['Asha Reddy', 'Hyderabad', 9, 0.95], ['Vikram Rao', 'Hyderabad', 7, 0.9], ['Meena Iyer', 'Hyderabad', 5, 0.85], ['Kiran Kumar', 'Hyderabad', 3, 0.8],
  ['Sita Devi', 'Danda', 8, 0.92], ['Ramesh Naik', 'Danda', 6, 0.88], ['Lakshmi Bai', 'Danda', 2, 0.9],
  ['Arjun Shetty', 'Bengaluru', 9, 0.88], ['Divya Hegde', 'Bengaluru', 6, 0.93], ['Rahul Gowda', 'Bengaluru', 4, 0.75],
  ['Priya Nair', 'Chennai', 7, 0.97], ['Karthik Raman', 'Chennai', 5, 0.8], ['Anitha Selvam', 'Chennai', 1, 1],
  ['Sneha Patil', 'Pune', 8, 0.86], ['Omkar Joshi', 'Pune', 3, 0.9],
  // More Hyderabad learners so the city has its own board (10+ ranked learners).
  ['Bhadra Kommu', 'Hyderabad', 8, 0.9], ['Allu Harisha', 'Hyderabad', 8, 0.85], ['Kartheek M', 'Hyderabad', 7, 0.95],
  ['Divya Bhavani', 'Hyderabad', 6, 0.9], ['Soujanya Rao', 'Hyderabad', 6, 0.8], ['Raj Adidela', 'Hyderabad', 4, 0.9], ['Amrutha Raj', 'Hyderabad', 2, 0.85],
];
// Recent XP (last few hours) for a few learners, so "movement since yesterday" has real changes to show.
const RECENT: Record<string, number> = { 'Kiran Kumar': 520, 'Meena Iyer': 330, 'Raj Adidela': 260 };
const OLD = new Date(Date.now() - 3 * 24 * 3600e3);

async function main() {
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug: 'demo' } });
  const journey = await prisma.journey.findUniqueOrThrow({ where: { tenantId_slug: { tenantId: tenant.id, slug: 'data-analytics-journey' } }, include: { levels: { orderBy: { idx: 'asc' } } } });
  const role = await prisma.role.findUniqueOrThrow({ where: { code: 'learner' } });
  const hash = await bcrypt.hash(PASSWORD, 10);

  for (const [name, area, approved, share] of LEARNERS) {
    const email = `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@demo.aihub.in`;
    const user = await prisma.user.upsert({ where: { email }, update: { name, area }, create: { email, name, area, emailVerified: true, passwordHash: hash } });
    await prisma.membership.upsert({ where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } }, update: { roleId: role.id, status: 'active' }, create: { tenantId: tenant.id, userId: user.id, roleId: role.id, status: 'active' } });
    const enr = await prisma.enrollment.upsert({
      where: { tenantId_userId_journeyId: { tenantId: tenant.id, userId: user.id, journeyId: journey.id } },
      update: { state: 'active', currentLevelIdx: Math.min(approved + 1, 9) },
      create: { tenantId: tenant.id, userId: user.id, journeyId: journey.id, currentLevelIdx: Math.min(approved + 1, 9) },
    });
    for (const lv of journey.levels) {
      const done = lv.idx <= approved;
      const xp = done ? Math.round(lv.xpReward * share) : 0;
      const state = done ? 'approved' : lv.idx === approved + 1 ? 'available' : 'locked';
      await prisma.progress.upsert({
        where: { enrollmentId_levelId: { enrollmentId: enr.id, levelId: lv.id } },
        update: { state, xpEarned: xp, completedAt: done ? new Date() : null },
        create: { tenantId: tenant.id, enrollmentId: enr.id, userId: user.id, levelId: lv.id, state, xpEarned: xp, completedAt: done ? new Date() : null },
      });
      const key = `demo-area:${user.id}:${lv.id}`;
      if (done) await prisma.xpLedger.upsert({ where: { idempotencyKey: key }, update: { amount: xp, createdAt: OLD }, create: { tenantId: tenant.id, userId: user.id, amount: xp, source: 'level_complete', levelId: lv.id, idempotencyKey: key, createdAt: OLD } });
      else await prisma.xpLedger.deleteMany({ where: { idempotencyKey: key } });
    }
  }
  for (const [name, amount] of Object.entries(RECENT)) {
    const user = await prisma.user.findFirstOrThrow({ where: { name, email: { endsWith: '@demo.aihub.in' } } });
    const lv = journey.levels[0];
    const key = `demo-recent:${user.id}`;
    await prisma.xpLedger.upsert({ where: { idempotencyKey: key }, update: { amount, createdAt: new Date() }, create: { tenantId: tenant.id, userId: user.id, amount, source: 'quest', levelId: lv.id, idempotencyKey: key } });
  }
  await prisma.user.update({ where: { email: 'datalearner@aihub.in' }, data: { area: 'Hyderabad' } });
  console.log(`✓ ${LEARNERS.length} demo learners in 5 areas (password ${PASSWORD}); datalearner@aihub.in set to Hyderabad`);
}
main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
