import type { DayType } from '../entities/enums.js';
import type { WorkoutLog } from '../entities/workoutLog.js';

export type DayClassification =
  | 'trained_on_training_day'
  | 'rested_on_rest_day'
  | 'trained_on_rest_day'
  | 'missed_training_day'
  | 'free_day_with_activity'
  | 'free_day_no_activity'
  | 'test_day';

export function classifyDay(planned: DayType, log: WorkoutLog | null): DayClassification {
  if (planned === 'test') {
    return 'test_day';
  }

  if (planned === 'kb') {
    if (log !== null && (log.status === 'completed' || log.status === 'modified')) {
      return 'trained_on_training_day';
    }
    return 'missed_training_day';
  }

  if (planned === 'rest') {
    if (log === null) {
      return 'rested_on_rest_day';
    }
    return 'trained_on_rest_day';
  }

  // planned === 'free'
  if (log !== null) {
    return 'free_day_with_activity';
  }
  return 'free_day_no_activity';
}
