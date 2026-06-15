import type { WorkoutLog } from '../entities/workoutLog.js';
import type { Signals } from '../entities/signals.js';
import { compareDemand } from './compareDemand.js';

function demandMet(log: WorkoutLog): boolean {
  const result = compareDemand(log.actualWorkout, log.plannedWorkout);
  // Only equivalent demand counts toward progression.
  // Easier, harder, and uncertain are all conservative non-advancing.
  return result === 'equivalent';
}

// Returns true when: the last 2 logs are both normal/easy difficulty,
// neither has any blocking signal, AND both had demand equivalent to prescribed.
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
    ) &&
    last2.every(demandMet)
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
