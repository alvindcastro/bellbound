import { describe, it, expect } from 'vitest';
import { shouldIncrementCounter } from '../counter/shouldIncrementCounter.js';
import type { WorkoutLog } from '../entities/workoutLog.js';
import type { DayType, WorkoutSource } from '../entities/enums.js';

function makeLog(
  plannedDayType: DayType,
  status: string,
  source: WorkoutSource,
): WorkoutLog {
  return {
    id: 'log-1',
    date: '2026-06-15',
    blockId: 'block-1',
    plannedDayType,
    actualDayType: plannedDayType,
    source,
    category: 'strength',
    plannedWorkout: {},
    actualWorkout: {},
    status,
    difficulty: 'normal',
    signals: {
      pressGrindy: false,
      breathless: false,
      gripCooked: false,
      legsSore: false,
    },
    originalNote: '',
    structuredNotes: {},
  };
}

describe('shouldIncrementCounter', () => {
  it('returns true for a completed planned KB session', () => {
    expect(shouldIncrementCounter(makeLog('kb', 'completed', 'planned'))).toBe(true);
  });

  it('returns true for a modified planned KB session — modified-but-done still counts as a baseline session', () => {
    // A modified session means the trainee adjusted load/reps but still trained.
    // It must count toward the block counter, otherwise partial completion would
    // artificially delay block progression.
    expect(shouldIncrementCounter(makeLog('kb', 'modified', 'planned'))).toBe(true);
  });

  it('returns false when status is skipped', () => {
    expect(shouldIncrementCounter(makeLog('kb', 'skipped', 'planned'))).toBe(false);
  });

  it('returns false when plannedDayType is rest (even if completed)', () => {
    expect(shouldIncrementCounter(makeLog('rest', 'completed', 'planned'))).toBe(false);
  });

  it('returns false when source is off_block (unplanned extra session)', () => {
    expect(shouldIncrementCounter(makeLog('kb', 'completed', 'off_block'))).toBe(false);
  });

  it('returns false when plannedDayType is free', () => {
    expect(shouldIncrementCounter(makeLog('free', 'completed', 'planned'))).toBe(false);
  });

  it('returns false when source is recovery_skill', () => {
    expect(shouldIncrementCounter(makeLog('kb', 'completed', 'recovery_skill'))).toBe(false);
  });

  it('returns false when plannedDayType is test', () => {
    expect(shouldIncrementCounter(makeLog('test', 'completed', 'planned'))).toBe(false);
  });

  it('returns false when plannedDayType is kb but actualDayType is test — test workouts do not inflate the session counter', () => {
    const testLog: WorkoutLog = {
      ...makeLog('kb', 'completed', 'planned'),
      actualDayType: 'test',
    };
    expect(shouldIncrementCounter(testLog)).toBe(false);
  });
});
