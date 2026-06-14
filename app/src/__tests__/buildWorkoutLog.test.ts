import { describe, it, expect } from 'vitest';
import { buildWorkoutLog, type LogFormInputs, type WorkoutContext } from '../services/buildWorkoutLog.js';

const context: WorkoutContext = {
  date: '2026-06-15',
  blockId: 'block-1',
  plannedDayType: 'kb',
  actualDayType: 'kb',
  templateId: 'dkbs',
  templateName: 'Double KB Strength',
  category: 'kettlebell',
};

const inputs: LogFormInputs = {
  status: 'completed',
  roundsCompleted: 4,
  difficulty: 'normal',
  note: 'Felt solid today',
};

describe('buildWorkoutLog', () => {
  it('sets date from context', () => {
    const log = buildWorkoutLog(inputs, context);
    expect(log.date).toBe('2026-06-15');
  });

  it('sets blockId from context', () => {
    const log = buildWorkoutLog(inputs, context);
    expect(log.blockId).toBe('block-1');
  });

  it('sets plannedDayType and actualDayType from context', () => {
    const log = buildWorkoutLog(inputs, context);
    expect(log.plannedDayType).toBe('kb');
    expect(log.actualDayType).toBe('kb');
  });

  it('generates a non-empty id', () => {
    const log = buildWorkoutLog(inputs, context);
    expect(log.id).toBeTruthy();
    expect(typeof log.id).toBe('string');
    expect(log.id.length).toBeGreaterThan(0);
  });

  it('generates unique ids on each call', () => {
    const log1 = buildWorkoutLog(inputs, context);
    const log2 = buildWorkoutLog(inputs, context);
    expect(log1.id).not.toBe(log2.id);
  });

  it('sets source to planned', () => {
    const log = buildWorkoutLog(inputs, context);
    expect(log.source).toBe('planned');
  });

  it('sets signals to all-false defaults', () => {
    const log = buildWorkoutLog(inputs, context);
    expect(log.signals).toEqual({
      pressGrindy: false,
      breathless: false,
      gripCooked: false,
      legsSore: false,
    });
  });

  it('sets difficulty from inputs', () => {
    const log = buildWorkoutLog(inputs, context);
    expect(log.difficulty).toBe('normal');
  });

  it('sets status from inputs', () => {
    const log = buildWorkoutLog(inputs, context);
    expect(log.status).toBe('completed');
  });

  it('sets originalNote from inputs', () => {
    const log = buildWorkoutLog(inputs, context);
    expect(log.originalNote).toBe('Felt solid today');
  });

  it('stores roundsCompleted in structuredNotes', () => {
    const log = buildWorkoutLog(inputs, context);
    expect(log.structuredNotes['roundsCompleted']).toBe(4);
  });

  it('sets category from context', () => {
    const log = buildWorkoutLog(inputs, context);
    expect(log.category).toBe('kettlebell');
  });

  it('sets plannedWorkout templateId from context', () => {
    const log = buildWorkoutLog(inputs, context);
    expect((log.plannedWorkout as any).templateId).toBe('dkbs');
  });

  it('sets actualWorkout name from context', () => {
    const log = buildWorkoutLog(inputs, context);
    expect((log.actualWorkout as any).name).toBe('Double KB Strength');
  });
});
