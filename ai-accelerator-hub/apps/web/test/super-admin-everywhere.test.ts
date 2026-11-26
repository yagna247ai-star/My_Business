// docs/SUPER_ADMIN_EVERYWHERE_SPEC.md
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = join(__dirname, '..');
const ctxSrc = readFileSync(join(root, 'lib/server/context.ts'), 'utf8');

describe('Super Admin in every institution', () => {
  it('AC-1: a Super Admin membership anywhere counts', () => {
    expect(ctxSrc).toMatch(/globalRole === 'super_admin'\s*\|\| !!\(await prisma\.membership\.findFirst\(\{ where: \{ userId: user\.id, status: 'active', role: \{ code: 'super_admin' \} \}/);
  });
  it('AC-2: an ordinary membership never lowers a Super Admin', () => {
    const tail = ctxSrc.slice(ctxSrc.indexOf('membership = membership!;'));
    expect(tail).toMatch(/if \(superAdmin\) return \{[^}]*role: 'super_admin'[^}]*superAdmin: true, perms: effectivePerms\('super_admin'/);
  });
  it('AC-3: the switcher shows for every Super Admin', () => {
    expect(readFileSync(join(root, 'app/(app)/layout.tsx'), 'utf8')).toMatch(/canSwitch: ctx\.superAdmin \|\| activeMemberships > 1/);
  });
  it('AC-4: the migration only grants, from active Super Admin memberships', () => {
    const m = readFileSync(join(root, '../../packages/db/prisma/migrations/0025_super_admin_everywhere/migration.sql'), 'utf8');
    expect(m).toMatch(/UPDATE "users" SET "globalRole" = 'super_admin'/);
    expect(m).toMatch(/r\."code" = 'super_admin' AND m\."status" = 'active'/);
    expect(m).not.toMatch(/DELETE|SET "globalRole" = NULL/i);
  });
  it('AC-5: the platform owner is a Super Admin for the whole platform', () => {
    const m = readFileSync(join(root, '../../packages/db/prisma/migrations/0026_platform_owner_super_admin/migration.sql'), 'utf8');
    expect(m).toMatch(/SET "globalRole" = 'super_admin'\s+WHERE lower\("email"\) = 'yagna247\.ai@gmail\.com'/);
    expect(m).not.toMatch(/DELETE|SET "globalRole" = NULL/i);
  });
});
