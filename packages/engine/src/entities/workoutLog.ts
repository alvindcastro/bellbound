import type { DayType, Difficulty, WorkoutSource } from './enums.js';
import type { Signals } from './signals.js';

export interface WorkoutLog {
  id: string;
  date: string;
  blockId: string;
  plannedDayType: DayType;
  actualDayType: DayType;
  source: WorkoutSource;
  category: string;
  plannedWorkout: Record<string, unknown>;
  actualWorkout: Record<string, unknown>;
  status: string;
  difficulty: Difficulty;
  signals: Signals;
  originalNote: string;
  structuredNotes: Record<string, unknown>;
}
