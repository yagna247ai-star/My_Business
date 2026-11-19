/**
 * Set the role of the production smoke-test account, for the automated admin-screen check.
 * Runs during a Vercel build only when SMOKE_ROLE_EMAIL and SMOKE_ROLE are passed as build env for that one deploy.
 * Only the smoke-test account can be changed (must end with @example.com), and only to learner or program_mgr.
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const email = (process.env.SMOKE_ROLE_EMAIL || '').trim().toLowerCase();
const roleCode = (process.env.SMOKE_ROLE || '').trim();

async function main() {
  if (!email) return;
  if (!email.endsWith('@example.com')) throw new Error('smoke-role: only @example.com smoke-test accounts can be changed.');
  if (!['learner', 'program_mgr'].includes(roleCode)) throw new Error('smoke-role: role must be learner or program_mgr.');
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  const role = await prisma.role.findUniqueOrThrow({ where: { code: roleCode } });
  const r = await prisma.membership.updateMany({ where: { userId: user.id }, data: { roleId: role.id } });
  console.log(`✓ smoke-role: ${email} set to ${roleCode} (${r.count} membership)`);
}
main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
