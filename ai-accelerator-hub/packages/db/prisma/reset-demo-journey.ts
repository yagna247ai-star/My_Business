/**
 * Local demo only: clears the demo learner's progress in every module of the data analytics journey
 * (activities, boss, submissions, XP), and leaves every module available. Touches no other learner.
 *   DATABASE_URL=file:./local.db npx tsx prisma/reset-demo-journey.ts
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const EMAIL = 'datalearner@aihub.in';
async function main() {
  const user = await prisma.user.findUniqueOrThrow({ where: { email: EMAIL } });
  const levels = await prisma.level.findMany({ where: { journey: { slug: 'data-analytics-journey' } } });
  for (const level of levels) {
    const progress = await prisma.progress.findFirst({ where: { userId: user.id, levelId: level.id } });
    if (progress) {
      const subs = await prisma.submission.findMany({ where: { progressId: progress.id }, select: { id: true } });
      await prisma.review.deleteMany({ where: { submissionId: { in: subs.map(s => s.id) } } });
      await prisma.submission.deleteMany({ where: { progressId: progress.id } });
      await prisma.activityProgress.deleteMany({ where: { progressId: progress.id } });
      await prisma.bossChallengeProgress.deleteMany({ where: { progressId: progress.id } });
      await prisma.progress.update({ where: { id: progress.id }, data: { xpEarned: 0, state: 'available', completedAt: null } });
    }
    await prisma.xpLedger.deleteMany({ where: { userId: user.id, levelId: level.id } });
  }
  console.log(`✓ demo journey progress reset for ${EMAIL} (${levels.length} modules)`);
}
main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
