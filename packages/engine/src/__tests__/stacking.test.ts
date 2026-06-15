import { describe, it, expect } from 'vitest';
import { resolveActiveEffects } from '../recovery/stacking.js';
import { createPoorSleepGoblin } from '../recovery/statusEffects.js';
import type { StatusEffect } from '../entities/statusEffect.js';

function makeEffect(name: string, recommendationEffect: string): StatusEffect {
  return {
    id: crypto.randomUUID(),
    name,
    source: 'test',
    recommendationEffect,
    expiryType: 'manual',
    expiryParam: null,
    createdDate: '2026-06-01',
  };
}

describe('resolveActiveEffects', () => {
  it('single Poor Sleep Goblin → kind=repeat, explanation mentions effect name', () => {
    const result = resolveActiveEffects([createPoorSleepGoblin('2026-06-01')]);
    expect(result.kind).toBe('repeat');
    expect(result.explanation).toContain('Poor Sleep Goblin');
  });

  it('single Breathless Fog → kind=hold_conditioning', () => {
    expect(resolveActiveEffects([makeEffect('Breathless Fog', 'hold_conditioning')]).kind).toBe('hold_conditioning');
  });

  it('Squat Tax alone → kind=hold_squat', () => {
    expect(resolveActiveEffects([makeEffect('Squat Tax', 'hold_squat')]).kind).toBe('hold_squat');
  });

  it('Poor Sleep Goblin + Press Gremlin → kind=repeat (most conservative wins)', () => {
    const effects = [createPoorSleepGoblin('2026-06-01'), makeEffect('Press Gremlin', 'hold_pressing')];
    expect(resolveActiveEffects(effects).kind).toBe('repeat');
  });

  it('Press Gremlin + Grip Curse → kind=hold_pressing (higher priority)', () => {
    const effects = [makeEffect('Press Gremlin', 'hold_pressing'), makeEffect('Grip Curse', 'hold_carry')];
    expect(resolveActiveEffects(effects).kind).toBe('hold_pressing');
  });

  it('canonical: Poor Sleep Goblin + Squat Tax + Press Gremlin → kind=repeat', () => {
    const effects = [
      createPoorSleepGoblin('2026-06-01'),
      makeEffect('Squat Tax', 'hold_squat'),
      makeEffect('Press Gremlin', 'hold_pressing'),
    ];
    expect(resolveActiveEffects(effects).kind).toBe('repeat');
  });

  it('explanation includes all effect names for multi-effect case', () => {
    const effects = [makeEffect('Press Gremlin', 'hold_pressing'), makeEffect('Grip Curse', 'hold_carry')];
    const result = resolveActiveEffects(effects);
    expect(result.explanation).toContain('Press Gremlin');
    expect(result.explanation).toContain('Grip Curse');
  });

  it('empty array → kind=maintain', () => {
    const result = resolveActiveEffects([]);
    expect(result.kind).toBe('maintain');
    expect(result.explanation.toLowerCase()).toContain('no active status effects');
  });
});
