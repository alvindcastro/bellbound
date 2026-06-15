import type { WorkoutLog } from '../entities/workoutLog.js';
import type { Signals } from '../entities/signals.js';

// Returns true when: the last 2 logs are both normal/easy difficulty,
// AND neither log has any blocking signal set.
export function isProgressionEligible(recentLogs: WorkoutLog[]): boolean {
  if (recentLogs.length < 2) return false;
  const last2 = recentLogs.slice(0, 2);
  return (
    last2.every(l => l.difficulty === 'normal' || l.difficulty === 'easy') &&
    last2.every(l =>
      !l.signals.pressGrindy &&
      !l.signals.breathless &&
      !l.signals.gripCooked &&
      !l.signals.legsSore,
    )
  );
}

// Per-movement eligibility: same difficulty check but only blocks on the given signal.
// Proves that pressing can be held while squats remain eligible (and vice versa).
export function isMovementProgressionEligible(
  recentLogs: WorkoutLog[],
  signal: keyof Signals,
): boolean {
  if (recentLogs.length < 2) return false;
  const last2 = recentLogs.slice(0, 2);
  return (
    last2.every(l => l.difficulty === 'normal' || l.difficulty === 'easy') &&
    last2.every(l => !l.signals[signal])
  );
}
