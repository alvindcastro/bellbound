import type { DayType, Difficulty, Signals, WorkoutLog } from '@bellbound/engine';

export interface LogFormInputs {
  status: 'completed' | 'skipped' | 'modified';
  roundsCompleted: number;
  difficulty: Difficulty;
  note: string;
  signals?: Signals;
}

export interface WorkoutContext {
  date: string;
  blockId: string;
  plannedDayType: DayType;
  actualDayType: DayType;
  templateId: string;
  templateName: string;
  category: string;
}

export function buildWorkoutLog(inputs: LogFormInputs, context: WorkoutContext): WorkoutLog {
  return {
    id: crypto.randomUUID(),
    date: context.date,
    blockId: context.blockId,
    plannedDayType: context.plannedDayType,
    actualDayType: context.actualDayType,
    source: 'planned',
    category: context.category,
    plannedWorkout: { templateId: context.templateId, name: context.templateName },
    actualWorkout: { templateId: context.templateId, name: context.templateName },
    status: inputs.status,
    difficulty: inputs.difficulty,
    signals: inputs.signals ?? { pressGrindy: false, breathless: false, gripCooked: false, legsSore: false },
    originalNote: inputs.note,
    structuredNotes: { roundsCompleted: inputs.roundsCompleted },
  };
}
