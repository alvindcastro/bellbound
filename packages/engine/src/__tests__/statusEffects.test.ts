import { describe, it, expect } from 'vitest';
import { createStatusEffectsFromSignals, createPoorSleepGoblin } from '../recovery/statusEffects.js';

describe('createStatusEffectsFromSignals', () => {
  it('returns empty array when all signals are false', () => {
    const signals = { pressGrindy: false, breathless: false, gripCooked: false, legsSore: false };
    expect(createStatusEffectsFromSignals(signals, '2026-06-14')).toHaveLength(0);
  });

  it('returns [Press Gremlin] when only pressGrindy is true', () => {
    const signals = { pressGrindy: true, breathless: false, gripCooked: false, legsSore: false };
    const effects = createStatusEffectsFromSignals(signals, '2026-06-14');
    expect(effects).toHaveLength(1);
    const e = effects[0]!;
    expect(e.name).toBe('Press Gremlin');
    expect(e.source).toBe('pressGrindy');
    expect(e.recommendationEffect).toBe('hold_pressing');
    expect(e.expiryType).toBe('after_next_session');
    expect(e.expiryParam).toBeNull();
    expect(e.createdDate).toBe('2026-06-14');
    expect(typeof e.id).toBe('string');
    expect(e.id.length).toBeGreaterThan(0);
  });

  it('returns [Breathless Fog] when only breathless is true, with expiryParam 3', () => {
    const signals = { pressGrindy: false, breathless: true, gripCooked: false, legsSore: false };
    const effects = createStatusEffectsFromSignals(signals, '2026-06-14');
    expect(effects).toHaveLength(1);
    const e = effects[0]!;
    expect(e.name).toBe('Breathless Fog');
    expect(e.source).toBe('breathless');
    expect(e.recommendationEffect).toBe('hold_conditioning');
    expect(e.expiryType).toBe('after_n_days');
    expect(e.expiryParam).toBe(3);
    expect(e.createdDate).toBe('2026-06-14');
  });

  it('returns [Grip Curse] when only gripCooked is true, with expiryParam 2', () => {
    const signals = { pressGrindy: false, breathless: false, gripCooked: true, legsSore: false };
    const effects = createStatusEffectsFromSignals(signals, '2026-06-14');
    expect(effects).toHaveLength(1);
    const e = effects[0]!;
    expect(e.name).toBe('Grip Curse');
    expect(e.source).toBe('gripCooked');
    expect(e.recommendationEffect).toBe('hold_carry');
    expect(e.expiryType).toBe('after_n_days');
    expect(e.expiryParam).toBe(2);
    expect(e.createdDate).toBe('2026-06-14');
  });

  it('returns [Squat Tax] when only legsSore is true, with expiryParam 3', () => {
    const signals = { pressGrindy: false, breathless: false, gripCooked: false, legsSore: true };
    const effects = createStatusEffectsFromSignals(signals, '2026-06-14');
    expect(effects).toHaveLength(1);
    const e = effects[0]!;
    expect(e.name).toBe('Squat Tax');
    expect(e.source).toBe('legsSore');
    expect(e.recommendationEffect).toBe('hold_squat');
    expect(e.expiryType).toBe('after_n_days');
    expect(e.expiryParam).toBe(3);
    expect(e.createdDate).toBe('2026-06-14');
  });

  it('returns multiple effects when multiple signals are true', () => {
    const signals = { pressGrindy: true, breathless: true, gripCooked: true, legsSore: true };
    const effects = createStatusEffectsFromSignals(signals, '2026-06-14');
    expect(effects).toHaveLength(4);
    const names = effects.map(e => e.name);
    expect(names).toContain('Press Gremlin');
    expect(names).toContain('Breathless Fog');
    expect(names).toContain('Grip Curse');
    expect(names).toContain('Squat Tax');
  });

  it('propagates createdDate to all effects', () => {
    const signals = { pressGrindy: true, breathless: true, gripCooked: false, legsSore: false };
    const effects = createStatusEffectsFromSignals(signals, '2026-06-20');
    for (const e of effects) {
      expect(e.createdDate).toBe('2026-06-20');
    }
  });

  it('function signature accepts only signals and date — no source param', () => {
    const signals = { pressGrindy: true, breathless: false, gripCooked: false, legsSore: false };
    expect(() => createStatusEffectsFromSignals(signals, '2026-06-14')).not.toThrow();
  });
});

describe('createPoorSleepGoblin', () => {
  it('returns a Poor Sleep Goblin effect with correct fields', () => {
    const effect = createPoorSleepGoblin('2026-06-14');
    expect(effect.name).toBe('Poor Sleep Goblin');
    expect(effect.source).toBe('poor_sleep');
    expect(effect.recommendationEffect).toBe('repeat');
    expect(effect.expiryType).toBe('manual');
    expect(effect.expiryParam).toBeNull();
    expect(effect.createdDate).toBe('2026-06-14');
    expect(typeof effect.id).toBe('string');
    expect(effect.id.length).toBeGreaterThan(0);
  });
});
