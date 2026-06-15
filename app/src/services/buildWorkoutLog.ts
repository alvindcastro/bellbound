import type { DayType, Difficulty, Signals, WorkoutLog, WorkoutSource } from '@bellbound/engine';

export interface LogFormInputs {
  status: 'completed' | 'skipped' | 'modified';
  roundsCompleted: number;
  difficulty: Difficulty;
  note: string;
  signals?: Signals;
}

export interface MovementSnapshot {
  load?: number;
  loadFallback?: number;
  reps?: number;
  duration?: number;
}

export interface WorkoutContext {
  date: string;
  blockId: string;
  plannedDayType: DayType;
  actualDayType: DayType;
  templateId: string;
  templateName: string;
  category: string;
  source?: WorkoutSource;
  // Swap support: when the user chooses a different KB workout on a planned KB day
  actualTemplateId?: string;
  actualTemplateName?: string;
  swapReason?: string;
  // Off-block-on-training-day: explicit planned workout when source is off_block
  plannedTemplateId?: string;
  plannedTemplateName?: string;
  // Movement snapshots for demand comparison (Phase 15)
  prescribedRounds?: number;
  prescribedMovements?: MovementSnapshot[];
  actualRounds?: number;
  actualMovements?: MovementSnapshot[];
}

export function buildWorkoutLog(inputs: LogFormInputs, context: WorkoutContext): WorkoutLog {
  const plannedTemplateId = context.plannedTemplateId ?? context.templateId;
  const plannedTemplateName = context.plannedTemplateName ?? context.templateName;
  const actualTemplateId = context.actualTemplateId ?? context.templateId;
  const actualTemplateName = context.actualTemplateName ?? context.templateName;

  const structuredNotes: Record<string, unknown> = { roundsCompleted: inputs.roundsCompleted };
  if (context.swapReason !== undefined) {
    structuredNotes['swapReason'] = context.swapReason;
  }

  const plannedWorkout: Record<string, unknown> = { templateId: plannedTemplateId, name: plannedTemplateName };
  if (context.prescribedRounds !== undefined) plannedWorkout['rounds'] = context.prescribedRounds;
  if (context.prescribedMovements) plannedWorkout['movements'] = context.prescribedMovements;

  const actualWorkout: Record<string, unknown> = { templateId: actualTemplateId, name: actualTemplateName };
  if (context.actualRounds !== undefined) actualWorkout['rounds'] = context.actualRounds;
  if (context.actualMovements) actualWorkout['movements'] = context.actualMovements;

  return {
    id: crypto.randomUUID(),
    date: context.date,
    blockId: context.blockId,
    plannedDayType: context.plannedDayType,
    actualDayType: context.actualDayType,
    source: context.source ?? 'planned',
    category: context.category,
    plannedWorkout,
    actualWorkout,
    status: inputs.status,
    difficulty: inputs.difficulty,
    signals: inputs.signals ?? { pressGrindy: false, breathless: false, gripCooked: false, legsSore: false },
    originalNote: inputs.note,
    structuredNotes,
  };
}
