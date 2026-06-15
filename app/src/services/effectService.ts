import { createStatusEffectsFromSignals, createPoorSleepGoblin, createEffectsFromDemand, SLEEP_OK_HOURS } from '@bellbound/engine';
import type { WorkoutLog } from '@bellbound/engine';
import { statusEffectRepository } from '../data/repositories/statusEffectRepository.js';

export async function createAndPersistEffectsFromLog(log: WorkoutLog): Promise<void> {
  const signalEffects = createStatusEffectsFromSignals(log.signals, log.date);
  const demandEffects = createEffectsFromDemand(log.actualWorkout, log.plannedWorkout, log.date);
  for (const effect of [...signalEffects, ...demandEffects]) {
    await statusEffectRepository.add(effect);
  }
}

// bodyweight and foodNote are never accepted here — stored-only fields that must not feed engine logic.
export async function createAndPersistPoorSleepGoblinIfNeeded(
  date: string,
  hoursSlept: number,
): Promise<void> {
  if (hoursSlept < SLEEP_OK_HOURS) {
    const goblin = createPoorSleepGoblin(date);
    await statusEffectRepository.add(goblin);
  }
}
