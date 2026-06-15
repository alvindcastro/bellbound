import { describe, it, expect } from 'vitest';
import { createEffectsFromDemand } from '../recovery/statusEffects.js';

const dkbsSnap = {
  templateId: 'dkbs',
  rounds: 4,
  movements: [{ load: 20, reps: 5 }, { load: 20, reps: 3 }],
};

const harderSnap = {
  templateId: 'custom',
  rounds: 6,
  movements: [{ load: 28, reps: 5 }, { load: 28, reps: 3 }],
};

const easierSnap = {
  templateId: 'skbs',
  rounds: 3,
  movements: [{ load: 16, reps: 5 }, { load: 16, reps: 3 }],
};

describe('createEffectsFromDemand', () => {
  it('returns a "Overreached" repeat effect when actual demand is harder than prescribed', () => {
    const effects = createEffectsFromDemand(harderSnap, dkbsSnap, '2026-06-15');
    expect(effects).toHaveLength(1);
    expect(effects[0]).toMatchObject({
      name: 'Overreached',
      source: 'demand_harder',
      recommendationEffect: 'repeat',
      expiryType: 'after_next_session',
    });
  });

  it('returns no effects when demand is equivalent', () => {
    const effects = createEffectsFromDemand(dkbsSnap, dkbsSnap, '2026-06-15');
    expect(effects).toHaveLength(0);
  });

  it('returns no effects when demand is easier (easier is not punished)', () => {
    const effects = createEffectsFromDemand(easierSnap, dkbsSnap, '2026-06-15');
    expect(effects).toHaveLength(0);
  });

  it('returns no effects when demand is uncertain', () => {
    const effects = createEffectsFromDemand({}, {}, '2026-06-15');
    expect(effects).toHaveLength(0);
  });

  it('the Overreached effect has a valid UUID id', () => {
    const effects = createEffectsFromDemand(harderSnap, dkbsSnap, '2026-06-15');
    expect(effects[0]?.id).toMatch(/^[0-9a-f-]{36}$/);
  });
});
