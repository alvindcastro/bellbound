import type { WorkoutLog } from '../entities/workoutLog.js';
import type { StatDeltas } from '../stats/statGain.js';

const MENTAL_RECOVERY_ACTIVITIES: ReadonlySet<string> = new Set(['reading', 'cube']);

export function computeActivityStatDeltas(log: WorkoutLog): StatDeltas {
  const active = log.status === 'completed' || log.status === 'modified';

  if (!active) {
    return {};
  }

  const deltas: StatDeltas = {};

  if (log.source === 'off_block') {
    if (log.category === 'barbell') {
      deltas.strength = 1;
    } else {
      // run, pickleball, and any other off_block activity
      deltas.conditioning = 1;
    }
    deltas.consistency = 1;
  } else if (log.source === 'recovery_skill') {
    if (MENTAL_RECOVERY_ACTIVITIES.has(log.category)) {
      deltas.judgment = 1;
    } else {
      // yoga, walk, hike, and any other recovery_skill activity
      deltas.recovery = 1;
    }
  }

  return deltas;
}
