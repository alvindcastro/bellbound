import { computeStatDeltas, computeActivityStatDeltas } from '@bellbound/engine';
import type { WorkoutLog } from '@bellbound/engine';
import { characterRepository } from '../data/repositories/characterRepository.js';

export async function applyStatGainsFromLog(log: WorkoutLog): Promise<void> {
  const deltas =
    log.source === 'off_block' || log.source === 'recovery_skill'
      ? computeActivityStatDeltas(log)
      : computeStatDeltas(log);
  const hasGains = Object.values(deltas).some(v => v > 0);
  if (!hasGains) return;
  await characterRepository.applyStatDeltas('player-1', deltas);
}
