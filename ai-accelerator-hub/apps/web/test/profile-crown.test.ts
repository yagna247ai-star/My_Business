// The crown on the profile photo is the live area crown from Ranks: it goes when the learner drops out of the top 3.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { areaBoard, myAreaCrown } from '@/lib/domain/standingsCore';

const e = (userId: string, points: number, me = false) => ({ userId, name: userId, area: 'Warangal', points, me, private: false }) as never;

describe('crown on the profile photo', () => {
  it('shows while the learner is in the area top 3', () => {
    expect(myAreaCrown(areaBoard([e('a', 50), e('me', 40, true), e('c', 30)]).areas)).toEqual({ tier: 2, area: 'Warangal' });
  });
  it('is gone once three others overtake them', () => {
    expect(myAreaCrown(areaBoard([e('a', 50), e('b', 45), e('c', 42), e('me', 40, true)]).areas)).toBeNull();
    expect(myAreaCrown(null)).toBeNull();
  });
  it('the header takes the crown from the live area standings, not from approved levels', () => {
    const layout = readFileSync(join(__dirname, '../app/(app)/layout.tsx'), 'utf8');
    expect(layout).toMatch(/myAreaCrown\(/);
    expect(layout).not.toMatch(/crown: earned && earned\.levelIdx/);
  });
});
