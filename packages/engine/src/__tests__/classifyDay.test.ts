import { describe, it, expect } from 'vitest';
import { classifyDay } from '../schedule/classifyDay.js';
import type { WorkoutLog } from '../entities/workoutLog.js';
import type { DayType } from '../entities/enums.js';

// Minimal fixture — classifyDay only inspects log.status
function makeLog(status: string): WorkoutLog {
  return {
    id: 'log-1',
    date: '2026-06-15',
    blockId: 'block-1',
    plannedDayType: 'kb',
    actualDayType: 'kb',
    source: 'planned',
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

describe('classifyDay', () => {
  describe('kb planned day', () => {
    it('returns trained_on_training_day when status is completed', () => {
      expect(classifyDay('kb', makeLog('completed'))).toBe('trained_on_training_day');
    });

    it('returns trained_on_training_day when status is modified (modified-but-done still counts)', () => {
      expect(classifyDay('kb', makeLog('modified'))).toBe('trained_on_training_day');
    });

    it('returns missed_training_day when status is skipped', () => {
      expect(classifyDay('kb', makeLog('skipped'))).toBe('missed_training_day');
    });

    it('returns missed_training_day when log is null', () => {
      expect(classifyDay('kb', null)).toBe('missed_training_day');
    });
  });

  describe('rest planned day', () => {
    it('returns rested_on_rest_day when log is null', () => {
      expect(classifyDay('rest', null)).toBe('rested_on_rest_day');
    });

    it('returns trained_on_rest_day when log exists (any status)', () => {
      expect(classifyDay('rest', makeLog('completed'))).toBe('trained_on_rest_day');
    });

    it('returns trained_on_rest_day when log exists with skipped status', () => {
      expect(classifyDay('rest', makeLog('skipped'))).toBe('trained_on_rest_day');
    });
  });

  describe('free planned day', () => {
    it('returns free_day_with_activity when log exists', () => {
      expect(classifyDay('free', makeLog('completed'))).toBe('free_day_with_activity');
    });

    it('returns free_day_no_activity when log is null', () => {
      expect(classifyDay('free', null)).toBe('free_day_no_activity');
    });
  });

  describe('test planned day', () => {
    it('returns test_day when log is null', () => {
      expect(classifyDay('test', null)).toBe('test_day');
    });

    it('returns test_day when log exists (full test handling is a later phase)', () => {
      expect(classifyDay('test', makeLog('completed'))).toBe('test_day');
    });

    it('returns test_day regardless of log status', () => {
      expect(classifyDay('test', makeLog('skipped'))).toBe('test_day');
    });
  });
});
