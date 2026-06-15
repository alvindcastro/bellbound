import { describe, it, expect } from 'vitest';
import { shouldIncrementCounter } from '../counter/shouldIncrementCounter.js';
import { evaluateQuestProgress } from '../quests/questProgress.js';
import { computeStatDeltas } from '../stats/statGain.js';
import type { WorkoutLog } from '../entities/workoutLog.js';

function makeSwapLog(overrides: Partial<WorkoutLog> = {}): WorkoutLog {
  return {
    id: 'log-swap-1',
    date: '2026-06-15',
    blockId: 'block-1',
    plannedDayType: 'kb',
    actualDayType: 'kb',
    source: 'planned',
    category: 'kettlebell',
    plannedWorkout: { templateId: 'dkbs', name: 'Double KB Strength' },
    actualWorkout: { templateId: 'skbs', name: 'Single KB Strength' },
    status: 'completed',
    difficulty: 'normal',
    signals: { pressGrindy: false, breathless: false, gripCooked: false, legsSore: false },
    originalNote: '',
    structuredNotes: {},
    ...overrides,
  };
}

// ─── Section C: Guard counter ─────────────────────────────────────────────────

describe('shouldIncrementCounter — swap sessions', () => {
  it('returns true for a completed KB-for-KB swap (actualWorkout differs from plannedWorkout)', () => {
    const log = makeSwapLog();
    expect(shouldIncrementCounter(log)).toBe(true);
  });

  it('returns true for a modified KB-for-KB swap', () => {
    const log = makeSwapLog({ status: 'modified' });
    expect(shouldIncrementCounter(log)).toBe(true);
  });

  it('returns false for an off-block activity on a KB-planned day (a run instead of KB)', () => {
    const log = makeSwapLog({
      source: 'off_block',
      actualDayType: 'free',
      category: 'run',
      plannedWorkout: { templateId: 'dkbs', name: 'Double KB Strength' },
      actualWorkout: { templateId: 'run', name: 'Run' },
    });
    expect(shouldIncrementCounter(log)).toBe(false);
  });
});

// ─── Section E: Judgment reward ──────────────────────────────────────────────

describe('evaluateQuestProgress — good_swap counts KB-for-KB swaps with reason', () => {
  it('counts a KB-for-KB swap with a reason toward good_swap', () => {
    const swapLog = makeSwapLog({
      structuredNotes: { swapReason: 'only one bell available' },
    });
    expect(evaluateQuestProgress('good_swap', [swapLog])).toBe(1);
  });

  it('does not count a KB-for-KB swap without a reason toward good_swap', () => {
    const swapLog = makeSwapLog({ structuredNotes: {} });
    expect(evaluateQuestProgress('good_swap', [swapLog])).toBe(0);
  });

  it('still counts off_block sessions toward good_swap (existing behaviour preserved)', () => {
    const offBlockLog = makeSwapLog({ source: 'off_block' });
    expect(evaluateQuestProgress('good_swap', [offBlockLog])).toBe(1);
  });

  it('does not count a swap when status is skipped', () => {
    const skipped = makeSwapLog({ status: 'skipped', structuredNotes: { swapReason: 'lazy' } });
    expect(evaluateQuestProgress('good_swap', [skipped])).toBe(0);
  });
});

describe('computeStatDeltas — judgment for KB-for-KB swap with reason', () => {
  it('awards +1 judgment for a KB-for-KB swap that has a swap reason', () => {
    const log = makeSwapLog({ structuredNotes: { swapReason: 'fatigue' } });
    const deltas = computeStatDeltas(log);
    expect(deltas.judgment).toBeGreaterThanOrEqual(1);
  });

  it('does not award judgment for a KB-for-KB swap without a reason', () => {
    const log = makeSwapLog({ structuredNotes: {} });
    const deltas = computeStatDeltas(log);
    // judgment is only awarded for easy difficulty or swap-with-reason
    expect(deltas.judgment ?? 0).toBe(0);
  });

  it('still awards judgment for easy difficulty regardless of swap', () => {
    const log = makeSwapLog({ difficulty: 'easy', structuredNotes: {} });
    const deltas = computeStatDeltas(log);
    expect(deltas.judgment).toBeGreaterThanOrEqual(1);
  });
});
