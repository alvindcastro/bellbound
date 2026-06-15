import { describe, it, expect } from 'vitest';
import { getCouncilRecommendation } from '../council/council.js';
import { isProgressionEligible } from '../council/eligibility.js';
import type { WorkoutLog } from '../entities/workoutLog.js';

// Prescribed workout snapshot (Double KB Strength)
const dkbsSnapshot = {
  templateId: 'dkbs',
  name: 'Double KB Strength',
  rounds: 4,
  movements: [{ load: 20, reps: 5 }, { load: 20, reps: 3 }, { load: 20, reps: 5 }],
};

// Actual workout snapshot (Single KB Strength — easier)
const skbsSnapshot = {
  templateId: 'skbs',
  name: 'Single KB Strength',
  rounds: 3,
  movements: [{ load: 16, reps: 5 }, { load: 16, reps: 3 }, { load: 16, reps: 5 }],
};

function makeLog(
  difficulty: 'easy' | 'normal' | 'hard',
  actualWorkout: Record<string, unknown> = {},
  plannedWorkout: Record<string, unknown> = {},
): WorkoutLog {
  return {
    id: `log-${Math.random()}`,
    date: '2026-06-15',
    blockId: 'block-1',
    plannedDayType: 'kb',
    actualDayType: 'kb',
    source: 'planned',
    category: 'kettlebell',
    plannedWorkout,
    actualWorkout,
    status: 'completed',
    difficulty,
    signals: { pressGrindy: false, breathless: false, gripCooked: false, legsSore: false },
    originalNote: '',
    structuredNotes: {},
  };
}

// ─── isProgressionEligible with demand gating ─────────────────────────────────

describe('isProgressionEligible — demand gating', () => {
  it('returns false for two normal logs when actual demand is easier than prescribed', () => {
    const log1 = makeLog('normal', skbsSnapshot, dkbsSnapshot);
    const log2 = makeLog('normal', skbsSnapshot, dkbsSnapshot);
    expect(isProgressionEligible([log1, log2])).toBe(false);
  });

  it('returns true for two normal equivalent logs (no swap — same template)', () => {
    const log1 = makeLog('normal', dkbsSnapshot, dkbsSnapshot);
    const log2 = makeLog('normal', dkbsSnapshot, dkbsSnapshot);
    expect(isProgressionEligible([log1, log2])).toBe(true);
  });

  it('returns false for two normal uncertain logs (different templateIds, no movement snapshots)', () => {
    // Different templateIds but no movement data → uncertain demand → conservative, not advancing
    const log1 = makeLog('normal', { templateId: 'skbs' }, { templateId: 'dkbs' });
    const log2 = makeLog('normal', { templateId: 'skbs' }, { templateId: 'dkbs' });
    expect(isProgressionEligible([log1, log2])).toBe(false);
  });

  it('returns false when only one log is easier, other is equivalent', () => {
    const easyLog = makeLog('normal', skbsSnapshot, dkbsSnapshot);
    const equivLog = makeLog('normal', dkbsSnapshot, dkbsSnapshot);
    expect(isProgressionEligible([easyLog, equivLog])).toBe(false);
  });

  it('easier-than-prescribed logged as normal twice still does NOT progress the baseline', () => {
    const log1 = makeLog('normal', skbsSnapshot, dkbsSnapshot);
    const log2 = makeLog('normal', skbsSnapshot, dkbsSnapshot);
    expect(isProgressionEligible([log1, log2])).toBe(false);
  });
});

// ─── Council recommendation with demand ───────────────────────────────────────

describe('getCouncilRecommendation — demand gating', () => {
  it('returns "maintain" (not "progress") when two normal sessions were easier-than-prescribed', () => {
    const log1 = makeLog('normal', skbsSnapshot, dkbsSnapshot);
    const log2 = makeLog('normal', skbsSnapshot, dkbsSnapshot);
    const rec = getCouncilRecommendation([log1, log2]);
    expect(rec.kind).not.toBe('progress');
    expect(rec.kind).toBe('maintain');
  });

  it('returns "progress" for two normal equivalent sessions (existing behavior unchanged)', () => {
    const log1 = makeLog('normal', dkbsSnapshot, dkbsSnapshot);
    const log2 = makeLog('normal', dkbsSnapshot, dkbsSnapshot);
    const rec = getCouncilRecommendation([log1, log2]);
    expect(rec.kind).toBe('progress');
  });

  it('easier session still earns Consistency (does not reduce/skip)', () => {
    const log = makeLog('normal', skbsSnapshot, dkbsSnapshot);
    const rec = getCouncilRecommendation([log]);
    expect(rec.kind).not.toBe('reduce');
    expect(rec.kind).not.toBe('hold_pressing');
  });
});
