/**
 * Local demo only: clears the demo learner's Module 1 activity progress, submissions and XP, so a
 * proof run starts clean. Touches nothing else. Refuses to run unless the learner is the demo account.
 *   DATABASE_URL=file:./local.db npx tsx prisma/reset-demo-module1.ts
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const EMAIL = 'datalearner@aihub.in';
async function main() {
  const user = await prisma.user.findUniqueOrThrow({ where: { email: EMAIL } });
  const level = await prisma.level.findFirstOrThrow({ where: { code: 'DA01_FUNDAMENTALS' } });
  const progress = await prisma.progress.findFirst({ where: { userId: user.id, levelId: level.id } });
  if (progress) {
    await prisma.activityProgress.deleteMany({ where: { progressId: progress.id } });
    await prisma.bossChallengeProgress.deleteMany({ where: { progressId: progress.id } });
    await prisma.submission.deleteMany({ where: { progressId: progress.id } });
    await prisma.progress.update({ where: { id: progress.id }, data: { xpEarned: 0, state: 'available' } });
  }
  await prisma.xpLedger.deleteMany({ where: { userId: user.id, levelId: level.id } });
  console.log('✓ demo Module 1 progress reset for', EMAIL);
}
main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
