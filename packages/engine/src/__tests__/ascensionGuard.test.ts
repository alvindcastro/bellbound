import { describe, it, expect } from 'vitest';
import { isTestEligibleForAscension } from '../ascension/ascensionGuard.js';
import type { Block } from '../entities/block.js';
import type { WorkoutLog } from '../entities/workoutLog.js';

function makeBlock(overrides: Partial<Block> = {}): Block {
  return {
    id: 'block-1',
    name: 'Block 1',
    baselineTier: 1,
    startDate: '2026-01-01',
    status: 'active',
    testGuardMinSessions: 6,
    completedPlannedKbSessions: 6,
    ...overrides,
  };
}

function makeTestLog(overrides: Partial<WorkoutLog> = {}): WorkoutLog {
  return {
    id: 'log-test-1',
    date: '2026-06-15',
    blockId: 'block-1',
    plannedDayType: 'test',
    actualDayType: 'test',
    source: 'planned',
    category: 'strength',
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

describe('isTestEligibleForAscension', () => {
  it('returns true when guard met and test is completed', () => {
    expect(isTestEligibleForAscension(makeBlock(), makeTestLog())).toBe(true);
  });

  it('returns false when counter is below testGuardMinSessions', () => {
    expect(
      isTestEligibleForAscension(
        makeBlock({ completedPlannedKbSessions: 5 }),
        makeTestLog(),
      ),
    ).toBe(false);
  });

  it('returns false when test status is failed', () => {
    expect(
      isTestEligibleForAscension(makeBlock(), makeTestLog({ status: 'failed' })),
    ).toBe(false);
  });

  it('returns false when test status is skipped', () => {
    expect(
      isTestEligibleForAscension(makeBlock(), makeTestLog({ status: 'skipped' })),
    ).toBe(false);
  });

  it('returns false when status is modified — only completed ascends', () => {
    expect(
      isTestEligibleForAscension(makeBlock(), makeTestLog({ status: 'modified' })),
    ).toBe(false);
  });

  it('returns true when counter is exactly at minimum (=== testGuardMinSessions)', () => {
    expect(
      isTestEligibleForAscension(
        makeBlock({ completedPlannedKbSessions: 6, testGuardMinSessions: 6 }),
        makeTestLog(),
      ),
    ).toBe(true);
  });

  it('returns false when counter is one below minimum', () => {
    expect(
      isTestEligibleForAscension(
        makeBlock({ completedPlannedKbSessions: 5, testGuardMinSessions: 6 }),
        makeTestLog(),
      ),
    ).toBe(false);
  });

  it('returns false when actualDayType is not test — even if completed', () => {
    expect(
      isTestEligibleForAscension(
        makeBlock(),
        makeTestLog({ actualDayType: 'kb' }),
      ),
    ).toBe(false);
  });

  it('returns true with explicit testGuardMinSessions=6 and counter=6', () => {
    expect(
      isTestEligibleForAscension(
        makeBlock({ testGuardMinSessions: 6, completedPlannedKbSessions: 6 }),
        makeTestLog(),
      ),
    ).toBe(true);
  });

  it('returns false with testGuardMinSessions=6 and counter=5', () => {
    expect(
      isTestEligibleForAscension(
        makeBlock({ testGuardMinSessions: 6, completedPlannedKbSessions: 5 }),
        makeTestLog(),
      ),
    ).toBe(false);
  });
});
