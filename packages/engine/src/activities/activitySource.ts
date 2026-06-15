import type { WorkoutSource } from '../entities/enums.js';

export type ActivityType = 'run' | 'pickleball' | 'barbell' | 'hike' | 'yoga' | 'walk' | 'reading' | 'cube';

const OFF_BLOCK_ACTIVITIES: ReadonlySet<string> = new Set(['run', 'pickleball', 'barbell']);

export function defaultSourceForActivity(activityType: string): WorkoutSource {
  if (OFF_BLOCK_ACTIVITIES.has(activityType)) {
    return 'off_block';
  }
  return 'recovery_skill';
}
