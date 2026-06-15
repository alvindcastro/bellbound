import type { WorkoutLog } from '../entities/workoutLog.js';
import type { Recommendation } from '../entities/recommendation.js';
import type { StatusEffect } from '../entities/statusEffect.js';
import { isProgressionEligible } from './eligibility.js';
import { resolveActiveEffects } from '../recovery/stacking.js';

export function getCouncilRecommendation(
  recentLogs: WorkoutLog[],
  activeEffects: StatusEffect[] = [],
): Recommendation {
  if (recentLogs.length === 0) {
    return { kind: 'maintain', explanation: 'No sessions logged yet. Keep training.' };
  }

  const mostRecent = recentLogs[0]!;

  // PRIORITY 1: Failed or skipped session
  if (mostRecent.difficulty === 'failed' || mostRecent.status === 'skipped') {
    const reason =
      mostRecent.difficulty === 'failed'
        ? 'Last session was failed; reduce load or volume.'
        : 'Last session was skipped; repeat the baseline.';
    return { kind: 'reduce', explanation: reason };
  }

  // PRIORITY 2: Active recovery blocker (status effects)
  if (activeEffects.length > 0) {
    return resolveActiveEffects(activeEffects);
  }

  // PRIORITY 3: Movement-specific blocking signal (from most recent session)
  const { signals } = mostRecent;
  if (signals.breathless) {
    return {
      kind: 'hold_conditioning',
      explanation: 'Conditioning felt too hard; repeating baseline.',
    };
  }
  if (signals.pressGrindy) {
    return {
      kind: 'hold_pressing',
      explanation: 'Presses felt grindy; holding pressing progression.',
    };
  }
  if (signals.gripCooked) {
    return {
      kind: 'hold_carry',
      explanation: 'Grip was cooked; reducing carry finisher.',
    };
  }
  if (signals.legsSore) {
    return {
      kind: 'hold_squat',
      explanation: 'Legs sore; keeping squat volume conservative.',
    };
  }

  // PRIORITY 4: Hard difficulty
  if (mostRecent.difficulty === 'hard') {
    return { kind: 'repeat', explanation: 'Last session was hard; repeat the baseline.' };
  }

  // PRIORITY 5 & 6: Progression eligibility (2x normal/easy, no blocking signals in last 2)
  if (isProgressionEligible(recentLogs)) {
    return {
      kind: 'progress',
      explanation:
        'Two normal sessions logged with no blocking signals; progression eligible.',
    };
  }

  // PRIORITY 7: Maintain
  return { kind: 'maintain', explanation: 'Keep training at this baseline.' };
}
