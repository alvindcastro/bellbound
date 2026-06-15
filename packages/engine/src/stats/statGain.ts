import type { WorkoutLog } from '../entities/workoutLog.js';
import type { CharacterStats } from '../entities/character.js';

export type StatDeltas = Partial<CharacterStats>;

export function computeStatDeltas(log: WorkoutLog): StatDeltas {
  const active = log.status === 'completed' || log.status === 'modified';
  const deltas: StatDeltas = {};

  if (active && (log.actualDayType === 'kb' || log.actualDayType === 'test')) {
    deltas.strength = 1;
  }

  if (active && log.actualDayType === 'kb') {
    deltas.conditioning = 1;
  }

  if (active && (log.actualDayType === 'kb' || log.actualDayType === 'test') && !log.signals.pressGrindy) {
    deltas.control = 1;
  }

  if (active && log.source === 'planned' && log.actualDayType !== 'rest') {
    deltas.consistency = 1;
  }

  if (log.status === 'completed' && log.actualDayType === 'rest') {
    deltas.recovery = 1;
  }

  if (active && log.difficulty === 'easy') {
    deltas.judgment = 1;
  }

  return deltas;
}
