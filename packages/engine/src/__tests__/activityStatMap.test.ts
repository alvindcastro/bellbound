import { describe, it, expect } from 'vitest';
import { computeActivityStatDeltas } from '../activities/activityStatMap.js';
import { createStatusEffectsFromSignals } from '../recovery/statusEffects.js';
import type { WorkoutLog } from '../entities/workoutLog.js';

function makeLog(overrides: Partial<WorkoutLog> = {}): WorkoutLog {
  return {
    id: 'log-1',
    date: '2026-06-15',
    blockId: 'b1',
    plannedDayType: 'free',
    actualDayType: 'free',
    source: 'off_block',
    category: 'run',
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

describe('computeActivityStatDeltas', () => {
  it('off_block run completed → Conditioning=1, Consistency=1 (no Strength)', () => {
    const log = makeLog({ source: 'off_block', category: 'run', status: 'completed' });
    const deltas = computeActivityStatDeltas(log);
    expect(deltas.conditioning).toBe(1);
    expect(deltas.consistency).toBe(1);
    expect(deltas.strength).toBeUndefined();
  });

  it('off_block pickleball completed → Conditioning=1, Consistency=1', () => {
    const log = makeLog({ source: 'off_block', category: 'pickleball', status: 'completed' });
    const deltas = computeActivityStatDeltas(log);
    expect(deltas.conditioning).toBe(1);
    expect(deltas.consistency).toBe(1);
  });

  it('off_block barbell completed → Strength=1, Consistency=1 (no Conditioning)', () => {
    const log = makeLog({ source: 'off_block', category: 'barbell', status: 'completed' });
    const deltas = computeActivityStatDeltas(log);
    expect(deltas.strength).toBe(1);
    expect(deltas.consistency).toBe(1);
    expect(deltas.conditioning).toBeUndefined();
  });

  it('recovery_skill yoga completed → Recovery=1 (no others)', () => {
    const log = makeLog({ source: 'recovery_skill', category: 'yoga', status: 'completed' });
    const deltas = computeActivityStatDeltas(log);
    expect(deltas.recovery).toBe(1);
    expect(deltas.strength).toBeUndefined();
    expect(deltas.conditioning).toBeUndefined();
    expect(deltas.consistency).toBeUndefined();
    expect(deltas.control).toBeUndefined();
    expect(deltas.judgment).toBeUndefined();
  });

  it('recovery_skill walk completed → Recovery=1', () => {
    const log = makeLog({ source: 'recovery_skill', category: 'walk', status: 'completed' });
    const deltas = computeActivityStatDeltas(log);
    expect(deltas.recovery).toBe(1);
  });

  it('recovery_skill hike completed → Recovery=1', () => {
    const log = makeLog({ source: 'recovery_skill', category: 'hike', status: 'completed' });
    const deltas = computeActivityStatDeltas(log);
    expect(deltas.recovery).toBe(1);
  });

  it('recovery_skill reading completed → Judgment=1 (no Recovery)', () => {
    const log = makeLog({ source: 'recovery_skill', category: 'reading', status: 'completed' });
    const deltas = computeActivityStatDeltas(log);
    expect(deltas.judgment).toBe(1);
    expect(deltas.recovery).toBeUndefined();
  });

  it('recovery_skill cube completed → Judgment=1', () => {
    const log = makeLog({ source: 'recovery_skill', category: 'cube', status: 'completed' });
    const deltas = computeActivityStatDeltas(log);
    expect(deltas.judgment).toBe(1);
  });

  it('skipped status → empty deltas (regardless of source/category)', () => {
    const offBlock = makeLog({ source: 'off_block', category: 'run', status: 'skipped' });
    const recovery = makeLog({ source: 'recovery_skill', category: 'yoga', status: 'skipped' });
    expect(Object.keys(computeActivityStatDeltas(offBlock))).toHaveLength(0);
    expect(Object.keys(computeActivityStatDeltas(recovery))).toHaveLength(0);
  });

  it('determinism: calling twice with same log returns equal results', () => {
    const log = makeLog({ source: 'off_block', category: 'run', status: 'completed' });
    const first = computeActivityStatDeltas(log);
    const second = computeActivityStatDeltas(log);
    expect(first).toEqual(second);
  });

  it('off_block breathless run: signals produce status effects via createStatusEffectsFromSignals', () => {
    const log = makeLog({
      source: 'off_block',
      category: 'run',
      status: 'completed',
      signals: { pressGrindy: false, breathless: true, gripCooked: false, legsSore: false },
    });
    const effects = createStatusEffectsFromSignals(log.signals, '2026-06-15');
    expect(effects).toHaveLength(1);
    expect(effects[0]!.source).toBe('breathless');
  });
});
