/**
 * Demo learner for the AI-Powered Data Analytics journey (local demo only).
 * Creates one learner in the demo institution, enrols them in data-analytics-journey, and
 * publishes its nine modules so the 45 days can be opened. Do not run against production data.
 *   DATABASE_URL=file:./local.db npx tsx prisma/demo-data-analytics-learner.ts
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const EMAIL = 'datalearner@aihub.in';
const PASSWORD = 'Learner@12345';

async function main() {
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug: 'demo' } });
  const journey = await prisma.journey.findUniqueOrThrow({ where: { tenantId_slug: { tenantId: tenant.id, slug: 'data-analytics-journey' } } });
  const role = await prisma.role.findUniqueOrThrow({ where: { code: 'learner' } });

  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: {},
    create: { email: EMAIL, name: 'Data Learner', emailVerified: true, passwordHash: await bcrypt.hash(PASSWORD, 10) },
  });
  await prisma.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
    update: { roleId: role.id },
    create: { tenantId: tenant.id, userId: user.id, roleId: role.id, status: 'active' },
  });
  const enrollment = await prisma.enrollment.upsert({
    where: { tenantId_userId_journeyId: { tenantId: tenant.id, userId: user.id, journeyId: journey.id } },
    update: { state: 'active' },
    create: { tenantId: tenant.id, userId: user.id, journeyId: journey.id, currentLevelIdx: 1 },
  });

  const levels = await prisma.level.findMany({ where: { journeyId: journey.id }, orderBy: { idx: 'asc' } });
  for (const lv of levels) {
    await prisma.level.update({ where: { id: lv.id }, data: { isPublished: true } });
    await prisma.progress.upsert({
      where: { enrollmentId_levelId: { enrollmentId: enrollment.id, levelId: lv.id } },
      update: {},
      create: { tenantId: tenant.id, enrollmentId: enrollment.id, levelId: lv.id, userId: user.id, state: 'available', unlockedAt: new Date() },
    });
  }
  await prisma.streak.upsert({ where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } }, update: {}, create: { tenantId: tenant.id, userId: user.id } });
  await prisma.userSetting.upsert({ where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } }, update: {}, create: { tenantId: tenant.id, userId: user.id } });

  console.log(`✓ demo learner ${EMAIL} / ${PASSWORD} enrolled in ${journey.slug} with ${levels.length} modules`);
}

main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
