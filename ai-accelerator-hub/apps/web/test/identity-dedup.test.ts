// docs/IDENTITY_DEDUP_SPEC.md: pure rules (no database).
import { describe, it, expect } from 'vitest';
import { emailKey, nameMatch, scorePair, groupDuplicates, pickPrimary, pickDisplayName, maskEmail, mergeScope, ticketKey, autoMergePlan, emailAction, canAddEmail, MAX_EMAILS, protectiveSettings, type Setting, type IdentityRow, type DuplicateGroup } from '@/lib/domain/identityCore';

const row = (id: string, email: string, name: string | null, o: Partial<IdentityRow> = {}): IdentityRow => ({ id, email, emails: [email], name, githubId: null, hasPassword: true, isSuperAdmin: false, activity: 0, createdAt: new Date('2026-01-01'), ...o });

describe('identity dedup rules', () => {
  it('AC-1: email key ignores gmail dots, +tags, googlemail and case', () => {
    expect(emailKey('Mami.Dala+x@googlemail.com')).toBe(emailKey('mamidala@gmail.com'));
    expect(emailKey('a@outlook.com')).toBe(emailKey('a+b@outlook.com'));
    expect(emailKey('a.b@outlook.com')).not.toBe(emailKey('ab@outlook.com'));
  });

  it('AC-2: name matching', () => {
    expect(nameMatch('Mami Dala', 'dala  MAMI')).toBe('exact');
    expect(nameMatch('Mami Dala', 'Mámi Dala')).toBe('exact');
    expect(nameMatch('Mami Dala', 'Mami Dala Reddy')).toBe('subset');
    expect(nameMatch('Mami', 'Mami Dala')).toBe('none');
    expect(nameMatch('Priya Rao', 'Priya Sharma')).toBe('none');
    expect(nameMatch(null, 'Priya Sharma')).toBe('none');
  });

  it('AC-3: same email key or GitHub id is certain', () => {
    expect(scorePair(row('a', 'mami.dala@gmail.com', 'Mami Dala'), row('b', 'mamidala@gmail.com', 'Other Name')).level).toBe('certain');
    expect(scorePair(row('a', 'x@a.com', 'A B', { githubId: '42' }), row('b', 'y@b.com', 'C D', { githubId: '42' })).level).toBe('certain');
    expect(scorePair(row('a', 'x@a.com', 'A B', { emails: ['x@a.com', 'old@z.com'] }), row('b', 'old@z.com', 'C D')).level).toBe('certain');
  });

  it('AC-4: name + similar email is likely; name alone is only possible', () => {
    expect(scorePair(row('a', 'mami.dala@gmail.com', 'Mami Dala'), row('b', 'mamidala22@yahoo.com', 'Mami Dala R')).level).toBe('likely');
    expect(scorePair(row('a', 'priya@a.com', 'Priya Sharma'), row('b', 'zzqx@b.com', 'Priya Sharma')).level).toBe('possible');
    expect(scorePair(row('a', 'priya@a.com', 'Priya Sharma'), row('b', 'zzqx@b.com', 'Ravi Kumar')).level).toBe('none');
  });

  it('AC-5: groups are transitive, confidence is the weakest link, possibles are counted only', () => {
    const rows = [
      row('a', 'mami.dala@gmail.com', 'Mami Dala'),
      row('b', 'mamidala@gmail.com', 'Mami Dala'),       // certain with a
      row('c', 'mamidala22@yahoo.com', 'Mami Dala R'),   // likely with a/b
      row('d', 'priya@a.com', 'Priya Sharma'),
      row('e', 'zzqx@b.com', 'Priya Sharma'),            // possible only
      row('f', 'solo@x.com', 'Solo Person'),
    ];
    const r = groupDuplicates(rows);
    expect(r.groups).toHaveLength(1);
    expect(r.groups[0].memberIds.sort()).toEqual(['a', 'b', 'c']);
    expect(r.groups[0].confidence).toBe('likely');
    expect(r.possiblePairs).toBe(1);
    const certainOnly = groupDuplicates(rows.slice(0, 2));
    expect(certainOnly.groups[0].confidence).toBe('certain');
  });

  it('AC-6: primary order: password, super admin, activity, github, oldest', () => {
    const old = new Date('2025-01-01'), neu = new Date('2026-06-01');
    expect(pickPrimary([row('a', 'a@x.com', 'A B', { hasPassword: false }), row('b', 'b@x.com', 'A B')])).toBe('b');
    expect(pickPrimary([row('a', 'a@x.com', 'A B'), row('b', 'b@x.com', 'A B', { isSuperAdmin: true })])).toBe('b');
    expect(pickPrimary([row('a', 'a@x.com', 'A B', { activity: 9 }), row('b', 'b@x.com', 'A B', { activity: 2 })])).toBe('a');
    expect(pickPrimary([row('a', 'a@x.com', 'A B'), row('b', 'b@x.com', 'A B', { githubId: '1' })])).toBe('b');
    expect(pickPrimary([row('a', 'a@x.com', 'A B', { createdAt: neu }), row('b', 'b@x.com', 'A B', { createdAt: old })])).toBe('b');
  });

  it('AC-7: display name keeps the fuller name when one contains the other', () => {
    expect(pickDisplayName('Mami Dala', 'Mami Dala Reddy')).toBe('Mami Dala Reddy');
    expect(pickDisplayName('Mami Dala Reddy', 'Mami Dala')).toBe('Mami Dala Reddy');
    expect(pickDisplayName('Mami Dala', 'Someone Else')).toBe('Mami Dala');
    expect(pickDisplayName(null, 'Someone Else')).toBe('Someone Else');
  });

  it('AC-8: masks the email', () => {
    expect(maskEmail('mami.dala@gmail.com')).toBe('m•••@gmail.com');
  });
});

describe('who may merge, tickets and the automatic run', () => {
  const sa = { superAdmin: true, canManage: true, tenantId: 'T1' };
  const admin = { superAdmin: false, canManage: true, tenantId: 'T1' };
  const acct = (id: string, tenantIds: string[], isSuperAdmin = false) => ({ id, tenantIds, isSuperAdmin });

  it('AC-14: Super Admin merges anything; an institution admin only inside their own institution', () => {
    expect(mergeScope(sa, [acct('a', ['T1', 'T2']), acct('b', ['T3'])])).toEqual({ allowed: true });
    expect(mergeScope(admin, [acct('a', ['T1']), acct('b', ['T1'])])).toEqual({ allowed: true });
    expect(mergeScope(admin, [acct('a', ['T1']), acct('b', ['T1', 'T2'])])).toEqual({ allowed: false, reason: 'other_institution' });
    expect(mergeScope(admin, [acct('a', ['T1']), acct('b', [])])).toEqual({ allowed: false, reason: 'other_institution' });
    expect(mergeScope(admin, [acct('a', ['T1']), acct('b', ['T1'], true)])).toEqual({ allowed: false, reason: 'super_admin_account' });
    expect(mergeScope({ ...admin, canManage: false }, [acct('a', ['T1']), acct('b', ['T1'])])).toEqual({ allowed: false, reason: 'no_permission' });
  });

  it('AC-15: the ticket key ignores order and which account is primary', () => {
    expect(ticketKey(['b', 'a', 'c'])).toBe(ticketKey(['c', 'b', 'a']));
    expect(ticketKey(['a', 'b'])).not.toBe(ticketKey(['a', 'c']));
  });

  it('AC-16: only certain groups merge, big groups are escalated, a run is capped', () => {
    const g = (n: number, confidence: 'certain' | 'likely', size = 2): DuplicateGroup => ({ memberIds: Array.from({ length: size }, (_, i) => `g${n}-${i}`), primaryId: `g${n}-0`, confidence, reasons: [] });
    const plan = autoMergePlan([g(1, 'certain'), g(2, 'likely'), g(3, 'certain', 6), ...Array.from({ length: 30 }, (_, i) => g(10 + i, 'certain'))]);
    expect(plan.merge).toHaveLength(25);
    expect(plan.merge.every(x => x.confidence === 'certain' && x.memberIds.length <= 5)).toBe(true);
    expect(plan.escalate).toEqual([{ group: expect.objectContaining({ primaryId: 'g3-0' }), reason: 'too_many_accounts' }]);
    expect(plan.deferred).toBe(6); // 31 small certain groups, 25 merged now
    const withSuper = autoMergePlan([g(1, 'certain'), g(2, 'certain')], new Set(['g2-1']));
    expect(withSuper.merge.map(x => x.primaryId)).toEqual(['g1-0']);
    expect(withSuper.escalate).toEqual([{ group: expect.objectContaining({ primaryId: 'g2-0' }), reason: 'super_admin_account' }]);
  });
});

describe('own email management', () => {
  const rows = [{ id: 'p', isPrimary: true, pending: false }, { id: 's', isPrimary: false, pending: false }, { id: 'w', isPrimary: false, pending: true }];

  it('AC-23: the owner may remove a secondary or a pending email, never the primary, with no verification step', () => {
    expect(emailAction(rows, 'remove', 's')).toEqual({ ok: true });
    expect(emailAction(rows, 'remove', 'w')).toEqual({ ok: true });
    expect(emailAction(rows, 'remove', 'p')).toEqual({ ok: false, reason: 'primary' });
    expect(emailAction(rows, 'remove', 'zz')).toEqual({ ok: false, reason: 'not_found' });
  });

  it('AC-24: only a verified secondary can become primary', () => {
    expect(emailAction(rows, 'primary', 's')).toEqual({ ok: true });
    expect(emailAction(rows, 'primary', 'w')).toEqual({ ok: false, reason: 'not_verified' });
    expect(emailAction(rows, 'primary', 'p')).toEqual({ ok: false, reason: 'already_primary' });
  });

  it('AC-25: an account holds at most five emails, pending ones included', () => {
    expect(MAX_EMAILS).toBe(5);
    expect(canAddEmail(4)).toBe(true);
    expect(canAddEmail(5)).toBe(false);
  });
});

describe('minors and the rollout switch', () => {
  const adult: Setting = { ageBand: 'adult', guardianConsent: 'not_required', leaderboardVisibility: 'cohort', globalOptIn: true, guardianEmail: null };
  const minor = (consent: string): Setting => ({ ageBand: 'minor', guardianConsent: consent, leaderboardVisibility: consent === 'granted' ? 'cohort' : 'private', globalOptIn: false, guardianEmail: 'parent@x.com' });

  it('AC-30: a merge never loosens a minor\'s protections', () => {
    // a minor merged with an adult account stays a minor; consent that was not granted stays not granted
    const r = protectiveSettings([adult, minor('pending')], true);
    expect(r).toMatchObject({ ageBand: 'minor', guardianConsent: 'pending', leaderboardVisibility: 'private', globalOptIn: false, guardianEmail: 'parent@x.com' });
    // consent granted on the minor account is kept only if every minor record has it
    expect(protectiveSettings([minor('granted'), minor('pending')], true).guardianConsent).toBe('pending');
    expect(protectiveSettings([minor('granted')], true)).toMatchObject({ guardianConsent: 'granted', leaderboardVisibility: 'cohort' });
    expect(protectiveSettings([minor('granted'), minor('revoked')], true).guardianConsent).toBe('revoked');
    // a minor elsewhere but only an adult record in this institution: no consent has been recorded here
    expect(protectiveSettings([adult], true)).toMatchObject({ ageBand: 'minor', guardianConsent: 'pending', leaderboardVisibility: 'private', globalOptIn: false });
    // two adults: private if either is private, global opt-in only if both agreed
    expect(protectiveSettings([adult, { ...adult, leaderboardVisibility: 'private' }], false)).toMatchObject({ ageBand: 'adult', guardianConsent: 'not_required', leaderboardVisibility: 'private', guardianEmail: null });
    expect(protectiveSettings([adult, { ...adult, globalOptIn: false }], false).globalOptIn).toBe(false);
  });

  it('AC-31: the automatic run leaves a group with a minor to a person', () => {
    const g: DuplicateGroup = { memberIds: ['a', 'b'], primaryId: 'a', confidence: 'certain', reasons: [] };
    const plan = autoMergePlan([g], new Set(), new Set(['b']));
    expect(plan.merge).toEqual([]);
    expect(plan.escalate).toEqual([{ group: g, reason: 'minor_account' }]);
  });
});
