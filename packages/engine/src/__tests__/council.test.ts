import { describe, it, expect } from 'vitest';
import { isProgressionEligible, isMovementProgressionEligible } from '../council/eligibility.js';
import { getCouncilRecommendation } from '../council/council.js';
import { createPoorSleepGoblin, createStatusEffectsFromSignals } from '../recovery/statusEffects.js';
import type { WorkoutLog } from '../entities/workoutLog.js';
import type { StatusEffect } from '../entities/statusEffect.js';
import type { Difficulty } from '../entities/enums.js';

function makeLog(
  difficulty: Difficulty,
  signals: Partial<{ pressGrindy: boolean; breathless: boolean; gripCooked: boolean; legsSore: boolean }> = {},
  status = 'completed',
): WorkoutLog {
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
    status,
    difficulty,
    signals: {
      pressGrindy: false,
      breathless: false,
      gripCooked: false,
      legsSore: false,
      ...signals,
    },
    originalNote: '',
    structuredNotes: {},
  };
}

// ---------------------------------------------------------------------------
// isProgressionEligible
// ---------------------------------------------------------------------------
describe('isProgressionEligible', () => {
  it('returns false for empty array', () => {
    expect(isProgressionEligible([])).toBe(false);
  });

  it('returns false for a single normal log (need 2)', () => {
    expect(isProgressionEligible([makeLog('normal')])).toBe(false);
  });

  it('returns true for two normal logs with no signals', () => {
    expect(isProgressionEligible([makeLog('normal'), makeLog('normal')])).toBe(true);
  });

  it('returns true for two easy logs with no signals', () => {
    expect(isProgressionEligible([makeLog('easy'), makeLog('easy')])).toBe(true);
  });

  it('returns true for one normal and one easy log with no signals', () => {
    expect(isProgressionEligible([makeLog('normal'), makeLog('easy')])).toBe(true);
  });

  it('returns false when most recent log (index 0) has pressGrindy', () => {
    expect(isProgressionEligible([makeLog('normal', { pressGrindy: true }), makeLog('normal')])).toBe(false);
  });

  it('returns false when second log (index 1) has pressGrindy', () => {
    expect(isProgressionEligible([makeLog('normal'), makeLog('normal', { pressGrindy: true })])).toBe(false);
  });

  it('returns false when one log is hard', () => {
    expect(isProgressionEligible([makeLog('normal'), makeLog('hard')])).toBe(false);
  });

  it('returns false for two hard logs', () => {
    expect(isProgressionEligible([makeLog('hard'), makeLog('hard')])).toBe(false);
  });

  it('returns false for two failed logs', () => {
    expect(isProgressionEligible([makeLog('failed'), makeLog('failed')])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isMovementProgressionEligible
// ---------------------------------------------------------------------------
describe('isMovementProgressionEligible', () => {
  it('returns false when most recent log has pressGrindy and checking pressGrindy', () => {
    const logs = [makeLog('normal', { pressGrindy: true }), makeLog('normal')];
    expect(isMovementProgressionEligible(logs, 'pressGrindy')).toBe(false);
  });

  it('returns true when most recent log has pressGrindy but checking legsSore (pressing blocked, squats clear)', () => {
    const logs = [makeLog('normal', { pressGrindy: true }), makeLog('normal')];
    expect(isMovementProgressionEligible(logs, 'legsSore')).toBe(true);
  });

  it('returns true when most recent log has legsSore but checking pressGrindy (squats blocked, pressing clear)', () => {
    const logs = [makeLog('normal', { legsSore: true }), makeLog('normal')];
    expect(isMovementProgressionEligible(logs, 'pressGrindy')).toBe(true);
  });

  it('returns false when most recent log has legsSore and checking legsSore', () => {
    const logs = [makeLog('normal', { legsSore: true }), makeLog('normal')];
    expect(isMovementProgressionEligible(logs, 'legsSore')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getCouncilRecommendation
// ---------------------------------------------------------------------------
describe('getCouncilRecommendation', () => {
  // Priority 1: Failed / skipped
  it('returns maintain for empty logs', () => {
    expect(getCouncilRecommendation([])).toMatchObject({ kind: 'maintain' });
  });

  it('returns reduce for a single failed log', () => {
    expect(getCouncilRecommendation([makeLog('failed')])).toMatchObject({ kind: 'reduce' });
  });

  it('returns reduce for a skipped session (any difficulty)', () => {
    expect(getCouncilRecommendation([makeLog('normal', {}, 'skipped')])).toMatchObject({ kind: 'reduce' });
  });

  // Priority 3: Blocking signals
  it('returns hold_pressing for normal log with pressGrindy', () => {
    expect(getCouncilRecommendation([makeLog('normal', { pressGrindy: true })])).toMatchObject({ kind: 'hold_pressing' });
  });

  it('returns hold_conditioning for normal log with breathless', () => {
    expect(getCouncilRecommendation([makeLog('normal', { breathless: true })])).toMatchObject({ kind: 'hold_conditioning' });
  });

  it('returns hold_carry for normal log with gripCooked', () => {
    expect(getCouncilRecommendation([makeLog('normal', { gripCooked: true })])).toMatchObject({ kind: 'hold_carry' });
  });

  it('returns hold_squat for normal log with legsSore', () => {
    expect(getCouncilRecommendation([makeLog('normal', { legsSore: true })])).toMatchObject({ kind: 'hold_squat' });
  });

  // Priority 4: Hard difficulty (no blocking signals)
  it('returns repeat for a single hard log with no signals', () => {
    expect(getCouncilRecommendation([makeLog('hard')])).toMatchObject({ kind: 'repeat' });
  });

  // Priority 1 beats priority 3: failed + signal → reduce wins
  it('returns reduce (not hold_pressing) for a failed log with pressGrindy', () => {
    expect(getCouncilRecommendation([makeLog('failed', { pressGrindy: true })])).toMatchObject({ kind: 'reduce' });
  });

  // Priority 3 beats priority 4: signal + hard → signal wins
  it('returns hold_pressing (not repeat) for a hard log with pressGrindy', () => {
    expect(getCouncilRecommendation([makeLog('hard', { pressGrindy: true })])).toMatchObject({ kind: 'hold_pressing' });
  });

  // Priority 5/6: Progression
  it('returns progress for two normal logs with no signals', () => {
    expect(getCouncilRecommendation([makeLog('normal'), makeLog('normal')])).toMatchObject({ kind: 'progress' });
  });

  it('returns progress for two easy logs with no signals', () => {
    expect(getCouncilRecommendation([makeLog('easy'), makeLog('easy')])).toMatchObject({ kind: 'progress' });
  });

  it('returns maintain for a single normal log (not enough history)', () => {
    expect(getCouncilRecommendation([makeLog('normal')])).toMatchObject({ kind: 'maintain' });
  });

  // Good signal cannot cancel a bad one in older log
  it('returns maintain when most recent is clean but previous has pressGrindy', () => {
    // index 0 = most recent (no signals), index 1 = older (has pressGrindy)
    // isProgressionEligible checks both; this should not progress
    expect(
      getCouncilRecommendation([makeLog('normal'), makeLog('normal', { pressGrindy: true })]),
    ).toMatchObject({ kind: 'maintain' });
  });

  // Priority 3 beats priority 6: blocking signal on most recent beats progression eligibility
  it('returns hold_pressing (not progress) when most recent has pressGrindy but older session was clean', () => {
    // index 0 = most recent (pressGrindy), index 1 = older (clean)
    expect(
      getCouncilRecommendation([makeLog('normal', { pressGrindy: true }), makeLog('normal')]),
    ).toMatchObject({ kind: 'hold_pressing' });
  });

  // Explainability
  it('explanation for failed contains "failed"', () => {
    const result = getCouncilRecommendation([makeLog('failed')]);
    expect(result.explanation.toLowerCase()).toContain('failed');
  });

  it('explanation for pressGrindy contains "grindy"', () => {
    const result = getCouncilRecommendation([makeLog('normal', { pressGrindy: true })]);
    expect(result.explanation.toLowerCase()).toContain('grindy');
  });

  it('explanation for progress contains "Two normal" or "two normal"', () => {
    const result = getCouncilRecommendation([makeLog('normal'), makeLog('normal')]);
    expect(result.explanation.toLowerCase()).toContain('two normal');
  });
});

// ---------------------------------------------------------------------------
// challenge path has no effect on conservative-wins rule
// ---------------------------------------------------------------------------
describe('challenge path has no effect on conservative-wins rule', () => {
  it('recovery blocker wins even when a challenge path is conceptually active — the council does not read the path', () => {
    // The Council function signature does not accept a challengePath.
    // This test proves by construction that the path cannot influence the outcome.
    const logsWithGoodHistory = [makeLog('normal'), makeLog('easy')];
    const activeEffects: StatusEffect[] = [
      {
        id: 'e1',
        name: 'Breathless Fog',
        source: 'breathless',
        recommendationEffect: 'hold_conditioning',
        expiryType: 'after_n_days',
        expiryParam: 3,
        createdDate: '2026-06-15',
      },
    ];
    const result = getCouncilRecommendation(logsWithGoodHistory, activeEffects);
    expect(result.kind).toBe('hold_conditioning');
    // Path is irrelevant — the council function doesn't receive it and cannot see it.
  });
});

// ---------------------------------------------------------------------------
// getCouncilRecommendation — Priority 2: active status effects (slot 2)
// ---------------------------------------------------------------------------
describe('getCouncilRecommendation — slot 2 active effects', () => {
  it('Active Poor Sleep Goblin → returns repeat even with 2 normal/easy logs (slot 2 beats slot 5/6)', () => {
    const effects = [createPoorSleepGoblin('2026-06-01')];
    const logs = [makeLog('normal'), makeLog('easy')];
    expect(getCouncilRecommendation(logs, effects)).toMatchObject({ kind: 'repeat' });
  });

  it('Active Press Gremlin → returns hold_pressing (slot 2 beats slot 3 signal check)', () => {
    const effects = createStatusEffectsFromSignals(
      { pressGrindy: true, breathless: false, gripCooked: false, legsSore: false },
      '2026-06-01',
    );
    const logs = [makeLog('normal')];
    expect(getCouncilRecommendation(logs, effects)).toMatchObject({ kind: 'hold_pressing' });
  });

  it('Multiple effects (Poor Sleep Goblin + Press Gremlin) → returns repeat', () => {
    const effects: StatusEffect[] = [
      createPoorSleepGoblin('2026-06-01'),
      ...createStatusEffectsFromSignals(
        { pressGrindy: true, breathless: false, gripCooked: false, legsSore: false },
        '2026-06-01',
      ),
    ];
    const logs = [makeLog('normal')];
    expect(getCouncilRecommendation(logs, effects)).toMatchObject({ kind: 'repeat' });
  });

  it('Active effect beats hard difficulty (slot 2 > slot 4): Breathless Fog + hard last session → hold_conditioning', () => {
    const effects = createStatusEffectsFromSignals(
      { pressGrindy: false, breathless: true, gripCooked: false, legsSore: false },
      '2026-06-01',
    );
    const logs = [makeLog('hard')];
    expect(getCouncilRecommendation(logs, effects)).toMatchObject({ kind: 'hold_conditioning' });
  });

  it('No active effects (default []) → existing behavior unchanged', () => {
    // Two normal logs with no signals → progress (slot 5/6)
    expect(getCouncilRecommendation([makeLog('normal'), makeLog('normal')])).toMatchObject({ kind: 'progress' });
  });
});
