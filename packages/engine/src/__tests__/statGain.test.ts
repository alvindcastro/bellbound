import { describe, it, expect } from 'vitest';
import { computeStatDeltas } from '../stats/statGain.js';
import { isProgressionEligible } from '../council/eligibility.js';
import type { WorkoutLog } from '../entities/workoutLog.js';

// NOTE: Stats accumulate without reset until the ascension phase is built.
// This is expected for the Phase 8–ascension window, not an inflation bug.
// Stat reset belongs to the ascension flow — do NOT add it here.

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

describe('computeStatDeltas', () => {
  it('grants strength, conditioning, and consistency for a completed KB session', () => {
    const log = makeLog({ status: 'completed', actualDayType: 'kb', source: 'planned' });
    const deltas = computeStatDeltas(log);
    expect(deltas.strength).toBe(1);
    expect(deltas.conditioning).toBe(1);
    expect(deltas.consistency).toBe(1);
  });

  it('grants control when KB session is not grindy', () => {
    const log = makeLog({ status: 'completed', actualDayType: 'kb', signals: { pressGrindy: false, breathless: false, gripCooked: false, legsSore: false } });
    const deltas = computeStatDeltas(log);
    expect(deltas.control).toBe(1);
  });

  it('does NOT grant control when KB session is grindy', () => {
    const log = makeLog({ status: 'completed', actualDayType: 'kb', signals: { pressGrindy: true, breathless: false, gripCooked: false, legsSore: false } });
    const deltas = computeStatDeltas(log);
    expect(deltas.control).toBeUndefined();
  });

  it('grants strength and consistency for a completed test day (not conditioning)', () => {
    const log = makeLog({ status: 'completed', actualDayType: 'test', source: 'planned' });
    const deltas = computeStatDeltas(log);
    expect(deltas.strength).toBe(1);
    expect(deltas.consistency).toBe(1);
    expect(deltas.conditioning).toBeUndefined();
  });

  it('grants recovery only for a completed planned rest day', () => {
    const log = makeLog({ status: 'completed', actualDayType: 'rest', source: 'planned' });
    const deltas = computeStatDeltas(log);
    expect(deltas.recovery).toBe(1);
    expect(deltas.strength).toBeUndefined();
    expect(deltas.conditioning).toBeUndefined();
    expect(deltas.control).toBeUndefined();
    expect(deltas.consistency).toBeUndefined();
    expect(deltas.judgment).toBeUndefined();
  });

  it('grants nothing for a skipped session', () => {
    const log = makeLog({ status: 'skipped' });
    const deltas = computeStatDeltas(log);
    expect(Object.keys(deltas)).toHaveLength(0);
  });

  it('grants strength, conditioning, control, consistency, and judgment for an easy KB session', () => {
    const log = makeLog({ status: 'completed', actualDayType: 'kb', source: 'planned', difficulty: 'easy', signals: { pressGrindy: false, breathless: false, gripCooked: false, legsSore: false } });
    const deltas = computeStatDeltas(log);
    expect(deltas.strength).toBe(1);
    expect(deltas.conditioning).toBe(1);
    expect(deltas.control).toBe(1);
    expect(deltas.consistency).toBe(1);
    expect(deltas.judgment).toBe(1);
  });

  it('does not grant judgment for a failed-difficulty completed session', () => {
    const log = makeLog({ status: 'completed', actualDayType: 'kb', source: 'planned', difficulty: 'failed' });
    const deltas = computeStatDeltas(log);
    expect(deltas.strength).toBe(1);
    expect(deltas.conditioning).toBe(1);
    expect(deltas.consistency).toBe(1);
    expect(deltas.judgment).toBeUndefined();
  });

  it('does not include zero-value stats in the returned object', () => {
    const log = makeLog({ status: 'skipped' });
    const deltas = computeStatDeltas(log);
    for (const val of Object.values(deltas)) {
      expect(val).not.toBe(0);
    }
  });

  it('stat gain and progression eligibility are structurally independent', () => {
    const grindyLog = makeLog({ status: 'completed', difficulty: 'normal', signals: { pressGrindy: true, breathless: false, gripCooked: false, legsSore: false } });
    const deltas = computeStatDeltas(grindyLog);
    expect(deltas.strength).toBe(1);
    expect(deltas.control).toBeUndefined();
    expect(isProgressionEligible([grindyLog, grindyLog])).toBe(false);
  });
});
