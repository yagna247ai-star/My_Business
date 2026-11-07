// Domain-rule tests for the v3 engine (no browser needed).
// Usage: node app-v3/tests/engine.test.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mem = new Map();
globalThis.window = globalThis;
window.addEventListener = () => {};
globalThis.localStorage = { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) };
for (const f of ['js/core/util.js', 'js/core/seed.js', 'js/core/engine.js']) vm.runInThisContext(readFileSync(join(root, f), 'utf8'), { filename: f });
const { E, D } = window.AH;
const S = () => window.AH.S;

let passed = 0;
const test = (name, fn) => { E.reset(); try { fn(); passed++; console.log('  ✓', name); } catch (e) { console.error('  ✗', name, '\n   ', e.message); process.exitCode = 1; } };
const GOOD_CODE = 'class Cookie:\n    oven_temp = 180\n    count = 0\n\n    def __init__(self, shape):\n        self.shape = shape\n        Cookie.count += 1\n\n    @classmethod\n    def total_baked(cls):\n        return cls.count\n\nstar = Cookie("star")\nheart = Cookie("heart")\n';
const REFL = 'At first I put oven_temp inside __init__ so each cookie had its own copy and changing the class attribute did nothing. Moving it to the class body made it shared by every object. Then self.count += 1 created a personal copy on each instance, so the total never changed. Writing Cookie.count fixed it. Shared state matters for agents too.';
function runToReview() {
  E.completeActivity(3);
  S().progress.tests = E.runTests(GOOD_CODE, E.BUILD_TESTS); S().progress.code = GOOD_CODE;
  E.completeActivity(4);
  E.runBoss(GOOD_CODE);
  return E.submitProof({ repo: 'https://github.com/x/y', deploy: '', reflection: REFL, checklist: [true, true, true] }).sub;
}

console.log('XP ledger');
test('seed ledger totals 23 XP and verifies', () => { assert.equal(E.xp(), 23); assert.equal(E.verifyChain().ok, true); });
test('idempotency key blocks a duplicate award', () => { assert.equal(E.award({ source: 'x', amount: 5, ref: 'r', idem: 'act:L01:A1' }), null); assert.equal(E.xp(), 23); });
test('tampering with a past entry breaks the chain', () => { S().ledger[0].amount = 500; const v = E.verifyChain(); assert.equal(v.ok, false); assert.equal(v.id, 'xp_00001'); });

console.log('Gating');
test('locked activity cannot be completed', () => { assert.equal(E.completeActivity(5).ok, false); });
test('completing A3 unlocks A4 and awards 10 XP once', () => { E.completeActivity(3); assert.equal(S().progress.acts[4], 'available'); E.completeActivity(3); assert.equal(E.xp(), 33); });

console.log('Build & boss checks');
test('starter fails, good code passes all build tests', () => { assert.equal(E.runTests(E.STARTER, E.BUILD_TESTS).some(t => t.pass), false); assert.ok(E.runTests(GOOD_CODE, E.BUILD_TESTS).every(t => t.pass)); });
test('self.count += 1 is rejected by the boss', () => { const bad = GOOD_CODE.replace('Cookie.count += 1', 'self.count += 1'); assert.equal(E.runTests(bad, E.BOSS_TESTS)[1].pass, false); });
test('boss attempts are capped at 3', () => { for (let i = 0; i < 3; i++) assert.ok(E.runBoss('x')); assert.equal(E.runBoss(GOOD_CODE), null); });

console.log('Review');
test('approval below the pass rule is blocked', () => { const s = runToReview(); assert.equal(E.decide(s.id, { correctness: 3, oop: 3, quality: 3, reflection: 3, boss: 1 }, 'approved', '').ok, false); });
test('approval completes L1, unlocks L2, awards XP and badges', () => {
  const s = runToReview(); const r = E.decide(s.id, { correctness: 4, oop: 4, quality: 3, reflection: 3, boss: 4 }, 'approved', 'Nice');
  assert.equal(r.ok, true); assert.equal(S().progress.levels[1], 'approved'); assert.equal(S().progress.levels[2], 'available');
  assert.ok(S().badges['first-proof'] && S().badges['oop-master']); assert.equal(E.xp(), 170); assert.equal(E.verifyChain().ok, true);
});
test('needs changes reopens Submit Proof and keeps XP', () => { const s = runToReview(); const before = E.xp(); E.decide(s.id, { correctness: 2, oop: 2, quality: 2, reflection: 2, boss: 2 }, 'needs_changes', 'Add tests please, thanks'); assert.equal(S().progress.acts[5], 'available'); assert.equal(E.xp(), before); });
test('weighted average matches the rubric weights', () => { assert.equal(D.weighted({ correctness: 4, oop: 3, quality: 3, reflection: 4, boss: 3 }), 3.45); });

console.log('Streak (non-punitive)');
test('missed days go freeze → grace → recovery, never zero', () => { E.simulateMissedDay(); assert.equal(S().streak.status, 'frozen'); E.simulateMissedDay(); assert.equal(S().streak.status, 'grace'); E.simulateMissedDay(); assert.equal(S().streak.status, 'recovery'); assert.equal(S().streak.current, 3); });
test('recovery restores the previous streak', () => { ['', '', ''].forEach(() => E.simulateMissedDay()); E.recoverStreak(); assert.equal(S().streak.status, 'active'); assert.equal(S().streak.current, 3); });
test('only one increment per day', () => { E.touchStreak(); const c = S().streak.current; E.touchStreak(); assert.equal(S().streak.current, c); });

console.log(`\n${passed} passed${process.exitCode ? ', some failed' : ''}`);
