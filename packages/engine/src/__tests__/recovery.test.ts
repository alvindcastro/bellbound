import { describe, it, expect } from 'vitest';
import { createStatusEffectsFromSignals, createPoorSleepGoblin } from '../recovery/statusEffects.js';
import { isExpired } from '../recovery/expiry.js';
import { resolveActiveEffects } from '../recovery/stacking.js';
import { SORENESS_EFFECT_DAYS, SLEEP_OK_HOURS } from '../config.js';
import type { StatusEffect } from '../entities/statusEffect.js';
import type { WorkoutLog } from '../entities/workoutLog.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeLog(
  overrides: Partial<WorkoutLog> = {},
): WorkoutLog {
  return {
    id: 'log-1',
    date: '2026-06-15',
    blockId: 'b1',
    plannedDayType: 'kb',
    actualDayType: 'kb',
    source: 'planned',
    category: 'kettlebell',
    plannedWorkout: {},
    actualWorkout: {},
    status: 'completed',
    difficulty: 'normal',
    signals: {
      pressGrindy: false,
      breathless: false,
      gripCooked: false,
      legsSore: false,
    },
    originalNote: '',
    structuredNotes: {},
    ...overrides,
  };
}

function makePoorSleepGoblin(createdDate = '2026-06-01'): StatusEffect {
  return createPoorSleepGoblin(createdDate);
}

// ---------------------------------------------------------------------------
// createStatusEffectsFromSignals
// ---------------------------------------------------------------------------

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

  it('returns [Breathless Fog] when only breathless is true, with expiryParam === SORENESS_EFFECT_DAYS.breathlessFog', () => {
    const signals = { pressGrindy: false, breathless: true, gripCooked: false, legsSore: false };
    const effects = createStatusEffectsFromSignals(signals, '2026-06-14');
    expect(effects).toHaveLength(1);
    const e = effects[0]!;
    expect(e.name).toBe('Breathless Fog');
    expect(e.source).toBe('breathless');
    expect(e.recommendationEffect).toBe('hold_conditioning');
    expect(e.expiryType).toBe('after_n_days');
    expect(e.expiryParam).toBe(SORENESS_EFFECT_DAYS.breathlessFog);
    expect(e.createdDate).toBe('2026-06-14');
  });

  it('returns [Grip Curse] when only gripCooked is true, with expiryParam === SORENESS_EFFECT_DAYS.gripCurse', () => {
    const signals = { pressGrindy: false, breathless: false, gripCooked: true, legsSore: false };
    const effects = createStatusEffectsFromSignals(signals, '2026-06-14');
    expect(effects).toHaveLength(1);
    const e = effects[0]!;
    expect(e.name).toBe('Grip Curse');
    expect(e.source).toBe('gripCooked');
    expect(e.recommendationEffect).toBe('hold_carry');
    expect(e.expiryType).toBe('after_n_days');
    expect(e.expiryParam).toBe(SORENESS_EFFECT_DAYS.gripCurse);
    expect(e.createdDate).toBe('2026-06-14');
  });

  it('returns [Squat Tax] when only legsSore is true, with expiryParam === SORENESS_EFFECT_DAYS.squatTax', () => {
    const signals = { pressGrindy: false, breathless: false, gripCooked: false, legsSore: true };
    const effects = createStatusEffectsFromSignals(signals, '2026-06-14');
    expect(effects).toHaveLength(1);
    const e = effects[0]!;
    expect(e.name).toBe('Squat Tax');
    expect(e.source).toBe('legsSore');
    expect(e.recommendationEffect).toBe('hold_squat');
    expect(e.expiryType).toBe('after_n_days');
    expect(e.expiryParam).toBe(SORENESS_EFFECT_DAYS.squatTax);
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
    // This is a type-level check: the function takes exactly (signals, date)
    const signals = { pressGrindy: true, breathless: false, gripCooked: false, legsSore: false };
    // If this compiles and runs without error, the function is source-agnostic
    expect(() => createStatusEffectsFromSignals(signals, '2026-06-14')).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// createPoorSleepGoblin
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// isExpired
// ---------------------------------------------------------------------------

describe('isExpired — after_next_session', () => {
  const effect: StatusEffect = {
    id: 'e1',
    name: 'Press Gremlin',
    source: 'pressGrindy',
    recommendationEffect: 'hold_pressing',
    expiryType: 'after_next_session',
    expiryParam: null,
    createdDate: '2026-06-10',
  };

  it('is NOT expired when logsAfterCreation is empty', () => {
    expect(isExpired(effect, {
      currentDate: '2026-06-11',
      logsAfterCreation: [],
      hoursSleptAfterCreation: [],
      restDaysPassedSinceCreation: false,
    })).toBe(false);
  });

  it('IS expired when there is a completed log after creation', () => {
    expect(isExpired(effect, {
      currentDate: '2026-06-11',
      logsAfterCreation: [makeLog({ date: '2026-06-11', status: 'completed' })],
      hoursSleptAfterCreation: [],
      restDaysPassedSinceCreation: false,
    })).toBe(true);
  });

  it('IS expired when there is a modified log after creation', () => {
    expect(isExpired(effect, {
      currentDate: '2026-06-11',
      logsAfterCreation: [makeLog({ date: '2026-06-11', status: 'modified' })],
      hoursSleptAfterCreation: [],
      restDaysPassedSinceCreation: false,
    })).toBe(true);
  });

  it('is NOT expired when only a skipped log exists after creation', () => {
    expect(isExpired(effect, {
      currentDate: '2026-06-11',
      logsAfterCreation: [makeLog({ date: '2026-06-11', status: 'skipped' })],
      hoursSleptAfterCreation: [],
      restDaysPassedSinceCreation: false,
    })).toBe(false);
  });
});

describe('isExpired — after_n_days (param=2)', () => {
  const effect: StatusEffect = {
    id: 'e2',
    name: 'Grip Curse',
    source: 'gripCooked',
    recommendationEffect: 'hold_carry',
    expiryType: 'after_n_days',
    expiryParam: 2,
    createdDate: '2026-06-10',
  };

  it('is NOT expired on the same day (0 days elapsed)', () => {
    expect(isExpired(effect, {
      currentDate: '2026-06-10',
      logsAfterCreation: [],
      hoursSleptAfterCreation: [],
      restDaysPassedSinceCreation: false,
    })).toBe(false);
  });

  it('is NOT expired 1 day later (1 < 2)', () => {
    expect(isExpired(effect, {
      currentDate: '2026-06-11',
      logsAfterCreation: [],
      hoursSleptAfterCreation: [],
      restDaysPassedSinceCreation: false,
    })).toBe(false);
  });

  it('IS expired 2 days later (2 >= 2)', () => {
    expect(isExpired(effect, {
      currentDate: '2026-06-12',
      logsAfterCreation: [],
      hoursSleptAfterCreation: [],
      restDaysPassedSinceCreation: false,
    })).toBe(true);
  });

  it('IS expired 3 days later (3 >= 2)', () => {
    expect(isExpired(effect, {
      currentDate: '2026-06-13',
      logsAfterCreation: [],
      hoursSleptAfterCreation: [],
      restDaysPassedSinceCreation: false,
    })).toBe(true);
  });
});

describe('isExpired — after_next_rest_day', () => {
  const effect: StatusEffect = {
    id: 'e3',
    name: 'Recovery',
    source: 'legsSore',
    recommendationEffect: 'hold_squat',
    expiryType: 'after_next_rest_day',
    expiryParam: null,
    createdDate: '2026-06-10',
  };

  it('is NOT expired when restDaysPassedSinceCreation is false', () => {
    expect(isExpired(effect, {
      currentDate: '2026-06-11',
      logsAfterCreation: [],
      hoursSleptAfterCreation: [],
      restDaysPassedSinceCreation: false,
    })).toBe(false);
  });

  it('IS expired when restDaysPassedSinceCreation is true', () => {
    expect(isExpired(effect, {
      currentDate: '2026-06-11',
      logsAfterCreation: [],
      hoursSleptAfterCreation: [],
      restDaysPassedSinceCreation: true,
    })).toBe(true);
  });
});

describe('isExpired — after_successful_light_session', () => {
  const effect: StatusEffect = {
    id: 'e4',
    name: 'Light Session Required',
    source: 'pressGrindy',
    recommendationEffect: 'hold_pressing',
    expiryType: 'after_successful_light_session',
    expiryParam: null,
    createdDate: '2026-06-10',
  };

  it('is NOT expired when last log is normal difficulty', () => {
    expect(isExpired(effect, {
      currentDate: '2026-06-11',
      logsAfterCreation: [makeLog({ date: '2026-06-11', difficulty: 'normal' })],
      hoursSleptAfterCreation: [],
      restDaysPassedSinceCreation: false,
    })).toBe(false);
  });

  it('IS expired when a log with difficulty=easy exists after creation', () => {
    expect(isExpired(effect, {
      currentDate: '2026-06-11',
      logsAfterCreation: [makeLog({ date: '2026-06-11', difficulty: 'easy' })],
      hoursSleptAfterCreation: [],
      restDaysPassedSinceCreation: false,
    })).toBe(true);
  });
});

describe('isExpired — manual (non-poor-sleep)', () => {
  const effect: StatusEffect = {
    id: 'e5',
    name: 'Custom Effect',
    source: 'custom',
    recommendationEffect: 'repeat',
    expiryType: 'manual',
    expiryParam: null,
    createdDate: '2026-06-10',
  };

  it('is never expired (returns false) for manual non-poor-sleep effects', () => {
    expect(isExpired(effect, {
      currentDate: '2026-06-20',
      logsAfterCreation: [makeLog({ date: '2026-06-20', status: 'completed' })],
      hoursSleptAfterCreation: [9, 8],
      restDaysPassedSinceCreation: true,
    })).toBe(false);
  });
});

describe('isExpired — Poor Sleep Goblin (source=poor_sleep)', () => {
  it('persists when no rest day and no good sleep (empty arrays, restDays=false)', () => {
    const effect = makePoorSleepGoblin('2026-06-01');
    expect(isExpired(effect, {
      currentDate: '2026-06-03',
      logsAfterCreation: [],
      hoursSleptAfterCreation: [],
      restDaysPassedSinceCreation: false,
    })).toBe(false);
  });

  it('clears when restDaysPassedSinceCreation=true (even with no sleep data)', () => {
    const effect = makePoorSleepGoblin('2026-06-01');
    expect(isExpired(effect, {
      currentDate: '2026-06-03',
      logsAfterCreation: [],
      hoursSleptAfterCreation: [],
      restDaysPassedSinceCreation: true,
    })).toBe(true);
  });

  it('clears when hoursSleptAfterCreation includes a value >= SLEEP_OK_HOURS (even with restDays=false)', () => {
    const effect = makePoorSleepGoblin('2026-06-01');
    expect(isExpired(effect, {
      currentDate: '2026-06-03',
      logsAfterCreation: [],
      hoursSleptAfterCreation: [SLEEP_OK_HOURS],
      restDaysPassedSinceCreation: false,
    })).toBe(true);
  });

  it('persists when all sleep hours < SLEEP_OK_HOURS and no rest day', () => {
    const effect = makePoorSleepGoblin('2026-06-01');
    expect(isExpired(effect, {
      currentDate: '2026-06-03',
      logsAfterCreation: [],
      hoursSleptAfterCreation: [SLEEP_OK_HOURS - 1, SLEEP_OK_HOURS - 2],
      restDaysPassedSinceCreation: false,
    })).toBe(false);
  });

  it('clears on good sleep without a rest day', () => {
    const effect = makePoorSleepGoblin('2026-06-01');
    expect(isExpired(effect, {
      currentDate: '2026-06-03',
      logsAfterCreation: [],
      hoursSleptAfterCreation: [SLEEP_OK_HOURS + 1],
      restDaysPassedSinceCreation: false,
    })).toBe(true);
  });

  it('clears on rest day without good sleep', () => {
    const effect = makePoorSleepGoblin('2026-06-01');
    expect(isExpired(effect, {
      currentDate: '2026-06-03',
      logsAfterCreation: [],
      hoursSleptAfterCreation: [5],
      restDaysPassedSinceCreation: true,
    })).toBe(true);
  });
});

describe('daysBetween (via isExpired after_n_days)', () => {
  // We test daysBetween indirectly through isExpired with after_n_days effects

  function makeNDaysEffect(createdDate: string, param: number): StatusEffect {
    return {
      id: 'dx',
      name: 'Test',
      source: 'test',
      recommendationEffect: 'hold_squat',
      expiryType: 'after_n_days',
      expiryParam: param,
      createdDate,
    };
  }

  it('same date = 0 days (not expired for param=1)', () => {
    const e = makeNDaysEffect('2026-06-14', 1);
    expect(isExpired(e, { currentDate: '2026-06-14', logsAfterCreation: [], hoursSleptAfterCreation: [], restDaysPassedSinceCreation: false })).toBe(false);
  });

  it('next day = 1 day (expired for param=1)', () => {
    const e = makeNDaysEffect('2026-06-14', 1);
    expect(isExpired(e, { currentDate: '2026-06-15', logsAfterCreation: [], hoursSleptAfterCreation: [], restDaysPassedSinceCreation: false })).toBe(true);
  });

  it('cross-month: Jan 31 -> Feb 1 = 1 day', () => {
    const e = makeNDaysEffect('2026-01-31', 1);
    expect(isExpired(e, { currentDate: '2026-02-01', logsAfterCreation: [], hoursSleptAfterCreation: [], restDaysPassedSinceCreation: false })).toBe(true);
  });

  it('cross-year: Dec 31 2025 -> Jan 1 2026 = 1 day', () => {
    const e = makeNDaysEffect('2025-12-31', 1);
    expect(isExpired(e, { currentDate: '2026-01-01', logsAfterCreation: [], hoursSleptAfterCreation: [], restDaysPassedSinceCreation: false })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// resolveActiveEffects
// ---------------------------------------------------------------------------

describe('resolveActiveEffects', () => {
  function makePoorSleep(): StatusEffect {
    return createPoorSleepGoblin('2026-06-01');
  }

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

  it('single Poor Sleep Goblin → kind=repeat, explanation mentions "Poor Sleep Goblin"', () => {
    const result = resolveActiveEffects([makePoorSleep()]);
    expect(result.kind).toBe('repeat');
    expect(result.explanation).toContain('Poor Sleep Goblin');
  });

  it('single Breathless Fog → kind=hold_conditioning', () => {
    const e = makeEffect('Breathless Fog', 'hold_conditioning');
    expect(resolveActiveEffects([e]).kind).toBe('hold_conditioning');
  });

  it('Poor Sleep Goblin + Press Gremlin → kind=repeat (most conservative wins)', () => {
    const effects = [
      makePoorSleep(),
      makeEffect('Press Gremlin', 'hold_pressing'),
    ];
    expect(resolveActiveEffects(effects).kind).toBe('repeat');
  });

  it('Press Gremlin + Grip Curse → kind=hold_pressing (higher priority)', () => {
    const effects = [
      makeEffect('Press Gremlin', 'hold_pressing'),
      makeEffect('Grip Curse', 'hold_carry'),
    ];
    expect(resolveActiveEffects(effects).kind).toBe('hold_pressing');
  });

  it('Squat Tax alone → kind=hold_squat', () => {
    const e = makeEffect('Squat Tax', 'hold_squat');
    expect(resolveActiveEffects([e]).kind).toBe('hold_squat');
  });

  it('canonical: Poor Sleep Goblin + Squat Tax + Press Gremlin → kind=repeat', () => {
    const effects = [
      makePoorSleep(),
      makeEffect('Squat Tax', 'hold_squat'),
      makeEffect('Press Gremlin', 'hold_pressing'),
    ];
    expect(resolveActiveEffects(effects).kind).toBe('repeat');
  });

  it('explanation includes all effect names for multi-effect case', () => {
    const effects = [
      makeEffect('Press Gremlin', 'hold_pressing'),
      makeEffect('Grip Curse', 'hold_carry'),
    ];
    const result = resolveActiveEffects(effects);
    expect(result.explanation).toContain('Press Gremlin');
    expect(result.explanation).toContain('Grip Curse');
  });

  it('empty array → kind=maintain with no-effects explanation', () => {
    const result = resolveActiveEffects([]);
    expect(result.kind).toBe('maintain');
    expect(result.explanation.toLowerCase()).toContain('no active status effects');
  });
});
