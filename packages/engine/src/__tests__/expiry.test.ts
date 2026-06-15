import { describe, it, expect } from 'vitest';
import { isExpired } from '../recovery/expiry.js';
import { createPoorSleepGoblin } from '../recovery/statusEffects.js';
import { SLEEP_OK_HOURS } from '../config.js';
import type { StatusEffect } from '../entities/statusEffect.js';
import type { WorkoutLog } from '../entities/workoutLog.js';

function makeLog(overrides: Partial<WorkoutLog> = {}): WorkoutLog {
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
    signals: { pressGrindy: false, breathless: false, gripCooked: false, legsSore: false },
    originalNote: '',
    structuredNotes: {},
    ...overrides,
  };
}

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
      logsAfterCreation: [makeLog({ status: 'completed' })],
      hoursSleptAfterCreation: [],
      restDaysPassedSinceCreation: false,
    })).toBe(true);
  });

  it('IS expired when there is a modified log after creation', () => {
    expect(isExpired(effect, {
      currentDate: '2026-06-11',
      logsAfterCreation: [makeLog({ status: 'modified' })],
      hoursSleptAfterCreation: [],
      restDaysPassedSinceCreation: false,
    })).toBe(true);
  });

  it('is NOT expired when only a skipped log exists after creation', () => {
    expect(isExpired(effect, {
      currentDate: '2026-06-11',
      logsAfterCreation: [makeLog({ status: 'skipped' })],
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
    expect(isExpired(effect, { currentDate: '2026-06-10', logsAfterCreation: [], hoursSleptAfterCreation: [], restDaysPassedSinceCreation: false })).toBe(false);
  });

  it('is NOT expired 1 day later (1 < 2)', () => {
    expect(isExpired(effect, { currentDate: '2026-06-11', logsAfterCreation: [], hoursSleptAfterCreation: [], restDaysPassedSinceCreation: false })).toBe(false);
  });

  it('IS expired 2 days later (2 >= 2)', () => {
    expect(isExpired(effect, { currentDate: '2026-06-12', logsAfterCreation: [], hoursSleptAfterCreation: [], restDaysPassedSinceCreation: false })).toBe(true);
  });

  it('IS expired 3 days later (3 >= 2)', () => {
    expect(isExpired(effect, { currentDate: '2026-06-13', logsAfterCreation: [], hoursSleptAfterCreation: [], restDaysPassedSinceCreation: false })).toBe(true);
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
    expect(isExpired(effect, { currentDate: '2026-06-11', logsAfterCreation: [], hoursSleptAfterCreation: [], restDaysPassedSinceCreation: false })).toBe(false);
  });

  it('IS expired when restDaysPassedSinceCreation is true', () => {
    expect(isExpired(effect, { currentDate: '2026-06-11', logsAfterCreation: [], hoursSleptAfterCreation: [], restDaysPassedSinceCreation: true })).toBe(true);
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
      logsAfterCreation: [makeLog({ difficulty: 'normal' })],
      hoursSleptAfterCreation: [],
      restDaysPassedSinceCreation: false,
    })).toBe(false);
  });

  it('IS expired when a log with difficulty=easy exists after creation', () => {
    expect(isExpired(effect, {
      currentDate: '2026-06-11',
      logsAfterCreation: [makeLog({ difficulty: 'easy' })],
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

  it('is never expired for manual non-poor-sleep effects', () => {
    expect(isExpired(effect, {
      currentDate: '2026-06-20',
      logsAfterCreation: [makeLog({ status: 'completed' })],
      hoursSleptAfterCreation: [9, 8],
      restDaysPassedSinceCreation: true,
    })).toBe(false);
  });
});

describe('isExpired — Poor Sleep Goblin (source=poor_sleep)', () => {
  it('persists when no rest day and no good sleep', () => {
    const effect = createPoorSleepGoblin('2026-06-01');
    expect(isExpired(effect, { currentDate: '2026-06-03', logsAfterCreation: [], hoursSleptAfterCreation: [], restDaysPassedSinceCreation: false })).toBe(false);
  });

  it('clears when restDaysPassedSinceCreation=true', () => {
    const effect = createPoorSleepGoblin('2026-06-01');
    expect(isExpired(effect, { currentDate: '2026-06-03', logsAfterCreation: [], hoursSleptAfterCreation: [], restDaysPassedSinceCreation: true })).toBe(true);
  });

  it('clears when hoursSleptAfterCreation includes a value >= SLEEP_OK_HOURS', () => {
    const effect = createPoorSleepGoblin('2026-06-01');
    expect(isExpired(effect, { currentDate: '2026-06-03', logsAfterCreation: [], hoursSleptAfterCreation: [SLEEP_OK_HOURS], restDaysPassedSinceCreation: false })).toBe(true);
  });

  it('persists when all sleep hours < SLEEP_OK_HOURS and no rest day', () => {
    const effect = createPoorSleepGoblin('2026-06-01');
    expect(isExpired(effect, { currentDate: '2026-06-03', logsAfterCreation: [], hoursSleptAfterCreation: [SLEEP_OK_HOURS - 1, SLEEP_OK_HOURS - 2], restDaysPassedSinceCreation: false })).toBe(false);
  });

  it('clears on good sleep without a rest day', () => {
    const effect = createPoorSleepGoblin('2026-06-01');
    expect(isExpired(effect, { currentDate: '2026-06-03', logsAfterCreation: [], hoursSleptAfterCreation: [SLEEP_OK_HOURS + 1], restDaysPassedSinceCreation: false })).toBe(true);
  });

  it('clears on rest day without good sleep', () => {
    const effect = createPoorSleepGoblin('2026-06-01');
    expect(isExpired(effect, { currentDate: '2026-06-03', logsAfterCreation: [], hoursSleptAfterCreation: [5], restDaysPassedSinceCreation: true })).toBe(true);
  });
});

describe('daysBetween (via isExpired after_n_days)', () => {
  function makeNDaysEffect(createdDate: string, param: number): StatusEffect {
    return { id: 'dx', name: 'Test', source: 'test', recommendationEffect: 'hold_squat', expiryType: 'after_n_days', expiryParam: param, createdDate };
  }

  const ctx = { logsAfterCreation: [] as WorkoutLog[], hoursSleptAfterCreation: [] as number[], restDaysPassedSinceCreation: false };

  it('same date = 0 days (not expired for param=1)', () => {
    expect(isExpired(makeNDaysEffect('2026-06-14', 1), { currentDate: '2026-06-14', ...ctx })).toBe(false);
  });

  it('next day = 1 day (expired for param=1)', () => {
    expect(isExpired(makeNDaysEffect('2026-06-14', 1), { currentDate: '2026-06-15', ...ctx })).toBe(true);
  });

  it('cross-month: Jan 31 -> Feb 1 = 1 day', () => {
    expect(isExpired(makeNDaysEffect('2026-01-31', 1), { currentDate: '2026-02-01', ...ctx })).toBe(true);
  });

  it('cross-year: Dec 31 2025 -> Jan 1 2026 = 1 day', () => {
    expect(isExpired(makeNDaysEffect('2025-12-31', 1), { currentDate: '2026-01-01', ...ctx })).toBe(true);
  });
});
