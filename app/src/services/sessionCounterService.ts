import { shouldIncrementCounter } from '@bellbound/engine';
import type { WorkoutLog } from '@bellbound/engine';
import { workoutLogRepository } from '../data/repositories/workoutLogRepository.js';
import { blockRepository } from '../data/repositories/blockRepository.js';

export async function saveLogAndUpdateCounter(log: WorkoutLog): Promise<void> {
  // Double-count guard: if the log already exists, skip both the add and the increment.
  const existing = await workoutLogRepository.getById(log.id);
  if (existing !== null) {
    return;
  }

  await workoutLogRepository.add(log);

  if (shouldIncrementCounter(log)) {
    await blockRepository.incrementCompletedPlannedKbSessions(log.blockId);
  }
}
