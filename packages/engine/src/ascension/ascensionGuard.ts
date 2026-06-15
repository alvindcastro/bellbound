import type { Block } from '../entities/block.js';
import type { WorkoutLog } from '../entities/workoutLog.js';

export function isTestEligibleForAscension(block: Block, testLog: WorkoutLog): boolean {
  // Guard 1: enough planned KB sessions completed in this block
  if (block.completedPlannedKbSessions < block.testGuardMinSessions) return false;
  // Guard 2: test must be a completed test workout (not failed, not skipped)
  if (testLog.actualDayType !== 'test') return false;
  if (testLog.status !== 'completed') return false;
  return true;
}
