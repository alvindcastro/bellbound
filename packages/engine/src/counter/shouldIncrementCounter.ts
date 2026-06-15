import type { WorkoutLog } from '../entities/workoutLog.js';

export function shouldIncrementCounter(log: WorkoutLog): boolean {
  // Only planned KB sessions that were actually completed count toward the block
  // counter. Modified sessions still count — the trainee trained, they just adjusted
  // load or reps. Off-block and recovery-skill sessions are extras and must not
  // inflate the counter.
  return (
    log.plannedDayType === 'kb' &&
    log.actualDayType !== 'test' &&
    (log.status === 'completed' || log.status === 'modified') &&
    log.source === 'planned'
  );
}
