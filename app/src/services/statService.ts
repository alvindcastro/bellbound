import { computeStatDeltas } from '@bellbound/engine';
import type { WorkoutLog } from '@bellbound/engine';
import { characterRepository } from '../data/repositories/characterRepository.js';

export async function applyStatGainsFromLog(log: WorkoutLog): Promise<void> {
  const deltas = computeStatDeltas(log);
  const hasGains = Object.values(deltas).some(v => v > 0);
  if (!hasGains) return;
  await characterRepository.applyStatDeltas('player-1', deltas);
}
