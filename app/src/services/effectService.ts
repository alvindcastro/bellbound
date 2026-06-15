import { createStatusEffectsFromSignals, createPoorSleepGoblin, SLEEP_OK_HOURS } from '@bellbound/engine';
import type { WorkoutLog } from '@bellbound/engine';
import { statusEffectRepository } from '../data/repositories/statusEffectRepository.js';

// Creates effects from workout signals and persists them.
// Only uses log.signals and log.date — never bodyweight, foodNote.
export async function createAndPersistEffectsFromLog(log: WorkoutLog): Promise<void> {
  const effects = createStatusEffectsFromSignals(log.signals, log.date);
  for (const effect of effects) {
    await statusEffectRepository.add(effect);
  }
}

// Creates Poor Sleep Goblin if hoursSlept < SLEEP_OK_HOURS.
// bodyweight and foodNote are NOT parameters here by design.
export async function createAndPersistPoorSleepGoblinIfNeeded(
  date: string,
  hoursSlept: number,
): Promise<void> {
  if (hoursSlept < SLEEP_OK_HOURS) {
    const goblin = createPoorSleepGoblin(date);
    await statusEffectRepository.add(goblin);
  }
}
