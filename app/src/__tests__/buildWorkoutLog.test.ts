import { describe, it, expect } from 'vitest';
import { buildWorkoutLog, type LogFormInputs, type WorkoutContext } from '../services/buildWorkoutLog.js';
import type { Signals } from '@bellbound/engine';

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

  it('uses provided signals when given', () => {
    const withSignals = {
      ...inputs,
      signals: { pressGrindy: true, breathless: false, gripCooked: false, legsSore: false } as Signals,
    };
    const log = buildWorkoutLog(withSignals, context);
    expect(log.signals.pressGrindy).toBe(true);
    expect(log.signals.breathless).toBe(false);
  });

  it('defaults all signals to false when signals not provided', () => {
    const log = buildWorkoutLog(inputs, context); // inputs has no signals field
    expect(log.signals).toEqual({ pressGrindy: false, breathless: false, gripCooked: false, legsSore: false });
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

  it('defaults source to planned when not provided', () => {
    const log = buildWorkoutLog(inputs, context); // existing context has no source
    expect(log.source).toBe('planned');
  });

  it('uses provided source off_block when set', () => {
    const activityContext = { ...context, source: 'off_block' as const };
    const log = buildWorkoutLog(inputs, activityContext);
    expect(log.source).toBe('off_block');
  });

  it('uses provided source recovery_skill when set', () => {
    const activityContext = { ...context, source: 'recovery_skill' as const };
    const log = buildWorkoutLog(inputs, activityContext);
    expect(log.source).toBe('recovery_skill');
  });

  it('sets actualDayType to test when provided', () => {
    const testContext = { ...context, actualDayType: 'test' as const, plannedDayType: 'kb' as const };
    const log = buildWorkoutLog(inputs, testContext);
    expect(log.actualDayType).toBe('test');
    expect(log.plannedDayType).toBe('kb');
  });

  it('test log carries status and difficulty like any other log', () => {
    const testContext = { ...context, actualDayType: 'test' as const };
    const log = buildWorkoutLog({ ...inputs, status: 'completed', difficulty: 'hard' }, testContext);
    expect(log.status).toBe('completed');
    expect(log.difficulty).toBe('hard');
  });
});
