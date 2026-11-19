/**
 * Create or update the production staff/admin accounts (docs/enterprise-gaps/06-seed-and-admin-accounts.md).
 *
 * Run it once, from your own machine, against the production database. It is NOT part of the Vercel build,
 * because it prints one-time passwords and they must never reach build logs.
 *
 *   cd packages/db
 *   DATABASE_URL='postgresql://…prod…' \
 *   STAFF='ops@yourco.com=tenant_admin,pm@yourco.com=program_mgr,money@yourco.com=finance' \
 *   npx tsx prisma/provision-staff.ts            # add DRY_RUN=1 first to preview
 *
 * Inputs
 *   STAFF            comma-separated email=role pairs (required). Optional display name: email=role:Full Name
 *   TENANT_SLUG      institution to attach them to (default: DEFAULT_TENANT_SLUG or "demo")
 *   DRY_RUN=1        show what would change, write nothing
 *   RESET_PASSWORD=1 also issue a new password to accounts that already exist
 *   STAFF_PASSWORD   use this password instead of a random one (min 8 chars). Prefer random.
 *
 * Rules
 *   - Only staff roles and super_admin can be granted; learner is self-signup. super_admin also sets User.globalRole.
 *   - Known demo accounts (@aihub.in seed users, @example.com smoke accounts) are refused.
 *   - New accounts get a random 24-character password, shown once. Existing passwords are kept unless RESET_PASSWORD=1.
 *   - Every change is written to the audit log as action staff.provisioned.
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import crypto from 'crypto';

const STAFF_ROLES = {
  super_admin: { name: 'Super Admin', description: 'Platform owner — tenants, billing, global audit' },
  tenant_admin: { name: 'Institution Admin', description: 'Manage users, branding, cohorts for tenant' },
  program_mgr: { name: 'Program Manager', description: 'Design journeys, publish levels, analytics' },
  instructor: { name: 'Instructor', description: 'Author content, assignments, grading' },
  mentor: { name: 'Cohort Mentor', description: '1:1 guidance, office hours' },
  reviewer: { name: 'Reviewer', description: 'Approve submissions, QA' },
  team_lead: { name: 'Team Lead', description: 'View team progress, approve team submissions' },
  finance: { name: 'Finance', description: 'Invoices, refunds, Razorpay reconciliation, GST' },
  support: { name: 'Support/Moderator', description: 'Tickets, moderation, audited impersonation' },
} as const;
type StaffRole = keyof typeof STAFF_ROLES;

const DEMO_EMAILS = new Set(['admin@aihub.in', 'student@aihub.in', 'mentor@aihub.in', 'instructor@aihub.in', 'finance@aihub.in']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Entry = { email: string; role: StaffRole; name: string | null };

export function parseStaff(raw: string): Entry[] {
  const out: Entry[] = [];
  const seen = new Set<string>();
  for (const part of raw.split(',').map(s => s.trim()).filter(Boolean)) {
    const eq = part.indexOf('=');
    if (eq < 1) throw new Error(`"${part}" must look like email=role`);
    const email = part.slice(0, eq).trim().toLowerCase();
    const [roleRaw, ...nameParts] = part.slice(eq + 1).split(':');
    const role = roleRaw.trim();
    const name = nameParts.join(':').trim() || null;
    if (!EMAIL_RE.test(email)) throw new Error(`"${email}" is not a valid email`);
    if (DEMO_EMAILS.has(email) || email.endsWith('@example.com')) throw new Error(`"${email}" is a demo/test account and cannot be a production admin`);
    if (!(role in STAFF_ROLES)) throw new Error(`"${role}" is not a staff role. Use one of: ${Object.keys(STAFF_ROLES).join(', ')}`);
    if (seen.has(email)) throw new Error(`"${email}" is listed twice`);
    seen.add(email);
    out.push({ email, role: role as StaffRole, name });
  }
  if (!out.length) throw new Error('STAFF is empty. Example: STAFF="ops@yourco.com=tenant_admin"');
  return out;
}

const chosen = process.env.STAFF_PASSWORD;
const newPassword = () => chosen || crypto.randomBytes(18).toString('base64url'); // 24 chars, ~144 bits

async function main() {
  if (process.env.VERCEL || process.env.CI) throw new Error('Refusing to run in a build/CI environment: it would print passwords to logs. Run it locally.');
  const entries = parseStaff(process.env.STAFF || '');
  const tenantSlug = (process.env.TENANT_SLUG || process.env.DEFAULT_TENANT_SLUG || 'demo').trim();
  const dry = process.env.DRY_RUN === '1';
  const reset = process.env.RESET_PASSWORD === '1';
  if (chosen !== undefined && chosen.length < 8) throw new Error('STAFF_PASSWORD must be at least 8 characters.');

  const prisma = new PrismaClient();
  try {
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) throw new Error(`Tenant "${tenantSlug}" not found. Set TENANT_SLUG.`);
    console.log(`${dry ? '[dry run] ' : ''}Provisioning ${entries.length} staff account(s) in tenant "${tenant.slug}"\n`);

    // Make sure every staff role exists (idempotent; does not overwrite edited names).
    if (!dry) for (const [code, r] of Object.entries(STAFF_ROLES)) await prisma.role.upsert({ where: { code }, update: {}, create: { code, ...r } });
    const roleIds = Object.fromEntries((await prisma.role.findMany()).map(r => [r.code, r.id]));

    const issued: { email: string; role: string; password: string }[] = [];
    for (const e of entries) {
      const user = await prisma.user.findUnique({ where: { email: e.email }, include: { memberships: { where: { tenantId: tenant.id }, include: { role: true } } } });
      const current = user?.memberships[0]?.role.code;
      const issue = !user || !user.passwordHash || reset;
      const plan = `${user ? 'existing user' : 'new user'}, role ${current ?? 'none'} -> ${e.role}${issue ? ', new password' : ''}`;
      if (dry) { console.log(`- ${e.email}: ${plan}`); continue; }

      const password = issue ? newPassword() : null;
      await prisma.$transaction(async tx => {
        const u = user
          ? await tx.user.update({ where: { id: user.id }, data: { ...(e.role === 'super_admin' ? { globalRole: 'super_admin' } : {}), ...(e.name ? { name: e.name } : {}), ...(password ? { passwordHash: bcrypt.hashSync(password, 12) } : {}) } })
          : await tx.user.create({ data: { email: e.email, name: e.name, emailVerified: true, globalRole: e.role === 'super_admin' ? 'super_admin' : null, passwordHash: bcrypt.hashSync(password!, 12) } });
        const m = await tx.membership.upsert({
          where: { tenantId_userId: { tenantId: tenant.id, userId: u.id } },
          update: { roleId: roleIds[e.role], status: 'active' },
          create: { tenantId: tenant.id, userId: u.id, roleId: roleIds[e.role], status: 'active' },
        });
        await tx.auditLog.create({ data: { tenantId: tenant.id, actorUserId: null, action: 'staff.provisioned', resourceType: 'Membership', resourceId: m.id, before: JSON.stringify({ role: current ?? null }), after: JSON.stringify({ role: e.role, passwordIssued: !!password }) } });
      });
      console.log(`✓ ${e.email}: ${plan}`);
      if (password && !chosen) issued.push({ email: e.email, role: e.role, password });
    }

    if (issued.length) {
      console.log('\nOne-time passwords. Store them in a password manager now; they are not saved anywhere and will not be shown again.');
      console.log('Send each one privately (not by email in plain text). Re-run with RESET_PASSWORD=1 to rotate.\n');
      for (const i of issued) console.log(`  ${i.email.padEnd(36)} ${i.role.padEnd(13)} ${i.password}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) main().catch(e => { console.error(`✗ ${e.message}`); process.exitCode = 1; });
