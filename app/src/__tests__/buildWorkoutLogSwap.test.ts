import { describe, it, expect } from 'vitest';
import { buildWorkoutLog } from '../services/buildWorkoutLog.js';
import type { WorkoutContext, LogFormInputs } from '../services/buildWorkoutLog.js';

const baseInputs: LogFormInputs = {
  status: 'completed',
  roundsCompleted: 3,
  difficulty: 'normal',
  note: 'only had one bell today',
};

const baseContext: WorkoutContext = {
  date: '2026-06-15',
  blockId: 'block-1',
  plannedDayType: 'kb',
  actualDayType: 'kb',
  templateId: 'dkbs',
  templateName: 'Double KB Strength',
  category: 'kettlebell',
};

// ─── Section B: KB-for-KB swap log building ───────────────────────────────────

describe('buildWorkoutLog — KB-for-KB swap', () => {
  it('sets plannedWorkout to the prescribed workout and actualWorkout to the chosen swap', () => {
    const log = buildWorkoutLog(baseInputs, {
      ...baseContext,
      actualTemplateId: 'skbs',
      actualTemplateName: 'Single KB Strength',
    });
    expect(log.plannedWorkout).toEqual({ templateId: 'dkbs', name: 'Double KB Strength' });
    expect(log.actualWorkout).toEqual({ templateId: 'skbs', name: 'Single KB Strength' });
  });

  it('stores the swap reason in structuredNotes when provided', () => {
    const log = buildWorkoutLog(baseInputs, {
      ...baseContext,
      actualTemplateId: 'skbs',
      actualTemplateName: 'Single KB Strength',
      swapReason: 'only one bell available',
    });
    expect(log.structuredNotes['swapReason']).toBe('only one bell available');
  });

  it('does not set swapReason in structuredNotes when not provided', () => {
    const log = buildWorkoutLog(baseInputs, {
      ...baseContext,
      actualTemplateId: 'skbs',
      actualTemplateName: 'Single KB Strength',
    });
    expect(log.structuredNotes['swapReason']).toBeUndefined();
  });

  it('source stays planned for a KB-for-KB swap so the counter increments', () => {
    const log = buildWorkoutLog(baseInputs, {
      ...baseContext,
      actualTemplateId: 'skbs',
      actualTemplateName: 'Single KB Strength',
    });
    expect(log.source).toBe('planned');
    expect(log.plannedDayType).toBe('kb');
  });

  it('without swap fields, plannedWorkout and actualWorkout are identical (existing behaviour)', () => {
    const log = buildWorkoutLog(baseInputs, baseContext);
    expect(log.plannedWorkout).toEqual({ templateId: 'dkbs', name: 'Double KB Strength' });
    expect(log.actualWorkout).toEqual({ templateId: 'dkbs', name: 'Double KB Strength' });
  });
});

// ─── Section D: Off-block activity on a KB-planned day ───────────────────────

describe('buildWorkoutLog — off-block on training day', () => {
  it('logs with plannedDayType kb, source off_block when user does a run on a KB day', () => {
    const log = buildWorkoutLog(
      { status: 'completed', roundsCompleted: 0, difficulty: 'normal', note: '' },
      {
        date: '2026-06-15',
        blockId: 'block-1',
        plannedDayType: 'kb',
        actualDayType: 'free',
        templateId: 'run',
        templateName: 'Run',
        category: 'run',
        source: 'off_block',
      },
    );
    expect(log.plannedDayType).toBe('kb');
    expect(log.source).toBe('off_block');
    expect(log.actualWorkout).toEqual({ templateId: 'run', name: 'Run' });
  });

  it('off-block on KB day does NOT produce plannedWorkout === actualWorkout when differing context provided', () => {
    const log = buildWorkoutLog(
      { status: 'completed', roundsCompleted: 0, difficulty: 'hard', note: '' },
      {
        date: '2026-06-15',
        blockId: 'block-1',
        plannedDayType: 'kb',
        actualDayType: 'free',
        templateId: 'run',
        templateName: 'Run',
        category: 'run',
        source: 'off_block',
        plannedTemplateId: 'dkbs',
        plannedTemplateName: 'Double KB Strength',
      },
    );
    expect(log.plannedWorkout).toEqual({ templateId: 'dkbs', name: 'Double KB Strength' });
    expect(log.actualWorkout).toEqual({ templateId: 'run', name: 'Run' });
  });
});
