import type { StatusEffect } from '../entities/statusEffect.js';
import type { WorkoutLog } from '../entities/workoutLog.js';
import { SLEEP_OK_HOURS } from '../config.js';

export interface ExpiryContext {
  currentDate: string;
  logsAfterCreation: WorkoutLog[];
  hoursSleptAfterCreation: number[];
  restDaysPassedSinceCreation: boolean;
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + 'T00:00:00.000Z').getTime();
  const b = new Date(dateB + 'T00:00:00.000Z').getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export function isExpired(effect: StatusEffect, context: ExpiryContext): boolean {
  // Poor Sleep Goblin has special expiry logic that supersedes the type switch
  if (effect.source === 'poor_sleep') {
    return (
      context.restDaysPassedSinceCreation ||
      context.hoursSleptAfterCreation.some(h => h >= SLEEP_OK_HOURS)
    );
  }

  switch (effect.expiryType) {
    case 'after_next_session':
      return context.logsAfterCreation.some(
        log => log.status === 'completed' || log.status === 'modified',
      );

    case 'after_n_days':
      return daysBetween(effect.createdDate, context.currentDate) >= effect.expiryParam!;

    case 'after_next_rest_day':
      return context.restDaysPassedSinceCreation;

    case 'after_successful_light_session':
      return context.logsAfterCreation.some(log => log.difficulty === 'easy');

    case 'manual':
    default:
      return false;
  }
}
