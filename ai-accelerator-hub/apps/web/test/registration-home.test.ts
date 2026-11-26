// docs/REGISTRATION_HOME_SPEC.md
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { pickHome, resolveCode } from '@/lib/domain/institutionsCore';

const root = join(__dirname, '..');
const sln = { id: 'sln', code: 'SLNHRD', type: 'skill_centre', slug: 'slnhrd', status: 'active' };
const hub = { id: 'hub', code: null as string | null, type: 'platform', slug: 'aiachub', status: 'active' };

describe('new learners land in AIHUB', () => {
  it('AC-1: AIHUB holder, else the platform institution, else DEFAULT_TENANT_SLUG', () => {
    expect(pickHome([sln, { ...hub, code: 'AIHUB' }], 'slnhrd')?.id).toBe('hub');
    expect(pickHome([sln, hub], 'slnhrd')?.id).toBe('hub'); // the production bug: no AIHUB code, env points at SLN
    expect(pickHome([sln, { ...hub, type: 'other' }], 'slnhrd')?.id).toBe('sln');
    expect(pickHome([sln, { ...hub, code: 'AIHUB', status: 'suspended' }], 'x')).toBeNull();
  });

  it('AC-2: AIHUB and an empty code mean the home; other codes still work', () => {
    const tenants = [{ id: 'sln', code: 'SLNHRD', status: 'active' }, { id: 'hub', code: null, status: 'active' }];
    expect(resolveCode('aihub', tenants, [])).toEqual({ kind: 'default' });
    expect(resolveCode('', tenants, [])).toEqual({ kind: 'default' });
    expect(resolveCode('SLNHRD', tenants, [])).toEqual({ kind: 'institution', tenantId: 'sln' });
    expect(resolveCode('AIHUB', [...tenants, { id: 'h2', code: 'AIHUB', status: 'active' }], [])).toEqual({ kind: 'institution', tenantId: 'h2' });
  });

  it('AC-3: the form starts with AIHUB and says where the learner lands', () => {
    const f = readFileSync(join(root, 'app/(auth)/register/page.tsx'), 'utf8');
    expect(f).toMatch(/inviteCode: 'AIHUB'/);
    expect(f).toMatch(/You&apos;ll join/);
    const r = readFileSync(join(root, 'app/api/v1/register/journeys/route.ts'), 'utf8');
    expect(r).toMatch(/institutionPreview/);
  });

  it('AC-4: only a Super Admin moves AIHUB, and it is audited', () => {
    const s = readFileSync(join(root, 'lib/domain/institutions.ts'), 'utf8');
    const fn = s.slice(s.indexOf('export async function makeDefaultHome'));
    expect(fn).toMatch(/if \(!ctx\.superAdmin\) throw forbidden/);
    expect(fn).toMatch(/institution\.default_home/);
    expect(fn).toMatch(/suggestCode/);
  });

  it('AC-5: the migration only fills an empty AIHUB, never on an SLN institution', () => {
    const m = readFileSync(join(root, '../../packages/db/prisma/migrations/0024_aihub_home/migration.sql'), 'utf8');
    expect(m).toMatch(/NOT EXISTS \(SELECT 1 FROM "tenants" x WHERE x\."code" = 'AIHUB'\)/);
    expect(m).toMatch(/NOT LIKE '%sln%'/);
  });
});
