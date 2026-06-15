import { describe, it, expect } from 'vitest';
import { evaluateQuestProgress } from '../quests/questProgress.js';
import { shouldGrantReward } from '../quests/questUnlock.js';
import type { WorkoutLog } from '../entities/workoutLog.js';

function makeLog(overrides: Partial<WorkoutLog> = {}): WorkoutLog {
  return {
    id: 'log-1', date: '2026-06-15', blockId: 'b1',
    plannedDayType: 'kb', actualDayType: 'kb',
    source: 'planned', category: 'kettlebell',
    plannedWorkout: {}, actualWorkout: {},
    status: 'completed', difficulty: 'normal',
    signals: { pressGrindy: false, breathless: false, gripCooked: false, legsSore: false },
    originalNote: '', structuredNotes: {},
    ...overrides,
  };
}

describe('evaluateQuestProgress', () => {
  describe('survive_baseline', () => {
    it('returns 0 when logs are empty', () => {
      expect(evaluateQuestProgress('survive_baseline', [])).toBe(0);
    });

    it('counts planned kb completed logs', () => {
      const logs = [
        makeLog({ source: 'planned', actualDayType: 'kb', status: 'completed' }),
        makeLog({ id: 'log-2', source: 'planned', actualDayType: 'kb', status: 'completed' }),
      ];
      expect(evaluateQuestProgress('survive_baseline', logs)).toBe(2);
    });

    it('also counts status modified logs', () => {
      const logs = [
        makeLog({ source: 'planned', actualDayType: 'kb', status: 'completed' }),
        makeLog({ id: 'log-2', source: 'planned', actualDayType: 'kb', status: 'modified' }),
      ];
      expect(evaluateQuestProgress('survive_baseline', logs)).toBe(2);
    });

    it('ignores skipped logs', () => {
      const logs = [
        makeLog({ source: 'planned', actualDayType: 'kb', status: 'skipped' }),
      ];
      expect(evaluateQuestProgress('survive_baseline', logs)).toBe(0);
    });

    it('ignores off_block logs', () => {
      const logs = [
        makeLog({ source: 'off_block', actualDayType: 'kb', status: 'completed' }),
      ];
      expect(evaluateQuestProgress('survive_baseline', logs)).toBe(0);
    });
  });

  describe('wise_regression', () => {
    it('returns 0 when logs are empty', () => {
      expect(evaluateQuestProgress('wise_regression', [])).toBe(0);
    });

    it('counts kb easy completed logs', () => {
      const logs = [
        makeLog({ actualDayType: 'kb', difficulty: 'easy', status: 'completed' }),
      ];
      expect(evaluateQuestProgress('wise_regression', logs)).toBe(1);
    });

    it('does not count normal difficulty', () => {
      const logs = [
        makeLog({ actualDayType: 'kb', difficulty: 'normal', status: 'completed' }),
      ];
      expect(evaluateQuestProgress('wise_regression', logs)).toBe(0);
    });

    it('counts modified status with easy difficulty', () => {
      const logs = [
        makeLog({ actualDayType: 'kb', difficulty: 'easy', status: 'modified' }),
      ];
      expect(evaluateQuestProgress('wise_regression', logs)).toBe(1);
    });
  });

  describe('good_swap', () => {
    it('returns 0 when logs are empty', () => {
      expect(evaluateQuestProgress('good_swap', [])).toBe(0);
    });

    it('counts off_block completed logs', () => {
      const logs = [
        makeLog({ source: 'off_block', status: 'completed' }),
      ];
      expect(evaluateQuestProgress('good_swap', logs)).toBe(1);
    });

    it('does not count planned sessions', () => {
      const logs = [
        makeLog({ source: 'planned', status: 'completed' }),
      ];
      expect(evaluateQuestProgress('good_swap', logs)).toBe(0);
    });

    it('counts modified off_block logs', () => {
      const logs = [
        makeLog({ source: 'off_block', status: 'modified' }),
      ];
      expect(evaluateQuestProgress('good_swap', logs)).toBe(1);
    });
  });

  describe('unknown quest id', () => {
    it('returns 0 for unknown quest ids', () => {
      const logs = [makeLog()];
      expect(evaluateQuestProgress('unknown_quest_xyz', logs)).toBe(0);
    });
  });
});

describe('shouldGrantReward', () => {
  it('returns true when progress meets required and not already completed', () => {
    expect(shouldGrantReward(2, 2, false)).toBe(true);
  });

  it('returns true when progress exceeds required and not already completed', () => {
    expect(shouldGrantReward(5, 2, false)).toBe(true);
  });

  it('returns false when already completed (idempotent)', () => {
    expect(shouldGrantReward(2, 2, true)).toBe(false);
  });

  it('returns false when progress is below required', () => {
    expect(shouldGrantReward(1, 2, false)).toBe(false);
  });

  it('returns false when progress is 0 and required is 1', () => {
    expect(shouldGrantReward(0, 1, false)).toBe(false);
  });
});
