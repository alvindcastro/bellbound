import { describe, it, expect } from 'vitest';
import { computeBlockTransition } from '../ascension/blockTransition.js';
import { resolveWorkoutAtTier } from '../progression/resolveWorkoutAtTier.js';
import { TEST_GUARD_MIN_SESSIONS } from '../config.js';
import type { Block } from '../entities/block.js';
import type { WorkoutLog } from '../entities/workoutLog.js';
import type { WorkoutTemplate } from '../entities/workoutTemplate.js';

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

// A minimal template with several tiers for testing resolveWorkoutAtTier
const dummyTemplate: WorkoutTemplate = {
  id: 'tpl-1',
  name: 'Test Template',
  zoneName: 'Zone A',
  category: 'strength',
  defaultRest: 60,
  tierStep: 'rounds',
  tiers: {
    '1': { rounds: 3 },
    '2': { rounds: 4 },
    '3': { rounds: 5 },
    '4': { rounds: 6 },
  },
  movements: [{ name: 'Swing', reps: 10 }],
};

describe('computeBlockTransition', () => {
  it('next block has baselineTier = closingBlock.baselineTier + 1', () => {
    const { nextBlock } = computeBlockTransition(makeBlock({ baselineTier: 1 }), makeTestLog(), 'block-2', '2026-06-15');
    expect(nextBlock.baselineTier).toBe(2);
  });

  it('next block has completedPlannedKbSessions = 0', () => {
    const { nextBlock } = computeBlockTransition(makeBlock(), makeTestLog(), 'block-2', '2026-06-15');
    expect(nextBlock.completedPlannedKbSessions).toBe(0);
  });

  it('next block has status active', () => {
    const { nextBlock } = computeBlockTransition(makeBlock(), makeTestLog(), 'block-2', '2026-06-15');
    expect(nextBlock.status).toBe('active');
  });

  it('next block has testGuardMinSessions = TEST_GUARD_MIN_SESSIONS', () => {
    const { nextBlock } = computeBlockTransition(makeBlock(), makeTestLog(), 'block-2', '2026-06-15');
    expect(nextBlock.testGuardMinSessions).toBe(TEST_GUARD_MIN_SESSIONS);
  });

  it('next block uses the provided newBlockId', () => {
    const { nextBlock } = computeBlockTransition(makeBlock(), makeTestLog(), 'block-abc', '2026-06-15');
    expect(nextBlock.id).toBe('block-abc');
  });

  it('lesson has blockId = closingBlock.id', () => {
    const { lesson } = computeBlockTransition(makeBlock({ id: 'block-1' }), makeTestLog(), 'block-2', '2026-06-15');
    expect(lesson.blockId).toBe('block-1');
  });

  it('lesson has earnedDate = provided startDate', () => {
    const { lesson } = computeBlockTransition(makeBlock(), makeTestLog(), 'block-2', '2026-07-01');
    expect(lesson.earnedDate).toBe('2026-07-01');
  });

  it('lesson title is a non-empty string', () => {
    const { lesson } = computeBlockTransition(makeBlock(), makeTestLog(), 'block-2', '2026-06-15');
    expect(typeof lesson.title).toBe('string');
    expect(lesson.title.length).toBeGreaterThan(0);
  });

  it('lesson description is a non-empty string', () => {
    const { lesson } = computeBlockTransition(makeBlock(), makeTestLog(), 'block-2', '2026-06-15');
    expect(typeof lesson.description).toBe('string');
    expect(lesson.description.length).toBeGreaterThan(0);
  });

  it('tier 1 closing block uses lesson index 0 (Repeat Before Increase)', () => {
    const { lesson } = computeBlockTransition(makeBlock({ baselineTier: 1 }), makeTestLog(), 'block-2', '2026-06-15');
    expect(lesson.title).toBe('Repeat Before Increase');
  });

  it('tier 2 closing block uses lesson index 1 (Sleep Is Real Work)', () => {
    const { lesson } = computeBlockTransition(makeBlock({ baselineTier: 2 }), makeTestLog(), 'block-3', '2026-06-15');
    expect(lesson.title).toBe('Sleep Is Real Work');
  });

  it('tier 3 closing block uses lesson index 2 (Press Before Squat)', () => {
    const { lesson } = computeBlockTransition(makeBlock({ baselineTier: 3 }), makeTestLog(), 'block-4', '2026-06-15');
    expect(lesson.title).toBe('Press Before Squat');
  });

  it('tier 4 closing block wraps around to lesson index 0 (Repeat Before Increase)', () => {
    const { lesson } = computeBlockTransition(makeBlock({ baselineTier: 4 }), makeTestLog(), 'block-5', '2026-06-15');
    expect(lesson.title).toBe('Repeat Before Increase');
  });

  it('tier bump propagates: nextBlock.baselineTier is exactly closingBlock.baselineTier + 1', () => {
    const closingBlock = makeBlock({ baselineTier: 3 });
    const { nextBlock } = computeBlockTransition(closingBlock, makeTestLog(), 'block-4', '2026-06-15');
    // Verify via resolveWorkoutAtTier that the tier number is meaningful
    expect(nextBlock.baselineTier).toBe(closingBlock.baselineTier + 1);
    // Resolve a workout at the new tier to confirm the bump propagates through the progression
    const resolved = resolveWorkoutAtTier(dummyTemplate, nextBlock.baselineTier);
    expect(resolved.rounds).toBe(dummyTemplate.tiers[String(nextBlock.baselineTier)].rounds);
  });
});
