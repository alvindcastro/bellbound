import { describe, it, expect } from 'vitest';
import type {
  Character,
  Block,
  WeekTemplate,
  WorkoutTemplate,
  Signals,
  WorkoutLog,
  DailyContext,
  StatusEffect,
} from '../entities/index.js';

describe('engine entities — shape and construction', () => {
  it('Signals: all four flags present and false by default', () => {
    const s: Signals = {
      pressGrindy: false,
      breathless: false,
      gripCooked: false,
      legsSore: false,
    };
    expect(s.pressGrindy).toBe(false);
    expect(s.breathless).toBe(false);
    expect(s.gripCooked).toBe(false);
    expect(s.legsSore).toBe(false);
  });

  it('Character: userId, name, className, level, and exactly six stats', () => {
    const c: Character = {
      userId: 'user-1',
      characterName: 'Alvin',
      className: 'Kettlebell Knight',
      level: 1,
      stats: {
        strength: 1,
        conditioning: 1,
        control: 1,
        consistency: 1,
        recovery: 1,
        judgment: 1,
      },
    };
    expect(c.userId).toBe('user-1');
    expect(Object.keys(c.stats)).toHaveLength(6);
  });

  it('Block: active status and zero completedPlannedKbSessions on construction', () => {
    const b: Block = {
      id: 'block-1',
      name: 'Foundation',
      baselineTier: 1,
      startDate: '2026-06-14',
      status: 'active',
      testGuardMinSessions: 6,
      completedPlannedKbSessions: 0,
    };
    expect(b.status).toBe('active');
    expect(b.completedPlannedKbSessions).toBe(0);
    expect(b.testGuardMinSessions).toBe(6);
  });

  it('WeekTemplate: days map covers all seven weekdays', () => {
    const wt: WeekTemplate = {
      id: 'default',
      days: {
        monday: 'kb',
        tuesday: 'kb',
        wednesday: 'rest',
        thursday: 'kb',
        friday: 'kb',
        saturday: 'free',
        sunday: 'rest',
      },
    };
    expect(Object.keys(wt.days)).toHaveLength(7);
    expect(wt.days.monday).toBe('kb');
    expect(wt.days.wednesday).toBe('rest');
  });

  it('WorkoutTemplate: tiers record and movements array with optional fields', () => {
    const wt: WorkoutTemplate = {
      id: 'double-kb-strength',
      name: 'Double KB Strength',
      zoneName: 'Strength Zone',
      category: 'strength',
      defaultRest: 90,
      tierStep: 'Add one round per tier',
      tiers: { '1': { rounds: 4 }, '2': { rounds: 5 }, '3': { rounds: 6 } },
      movements: [
        { name: 'Double Clean', reps: 5, load: 20 },
        { name: 'Double Press', reps: 3, load: 20 },
        { name: 'Double Front Squat', reps: 5, load: 20 },
        { name: 'Push-ups', reps: 10 },
        { name: 'Farmer Carry', duration: 30 },
      ],
    };
    expect(wt.movements[0]?.name).toBe('Double Clean');
    expect(wt.tiers['1']?.rounds).toBe(4);
    expect(wt.movements).toHaveLength(5);
  });

  it('WorkoutLog: signals all false, difficulty and source typed', () => {
    const log: WorkoutLog = {
      id: 'log-1',
      date: '2026-06-14',
      blockId: 'block-1',
      plannedDayType: 'kb',
      actualDayType: 'kb',
      source: 'planned',
      category: 'strength',
      plannedWorkout: {},
      actualWorkout: {},
      status: 'completed',
      difficulty: 'normal',
      signals: { pressGrindy: false, breathless: false, gripCooked: false, legsSore: false },
      originalNote: '',
      structuredNotes: {},
    };
    expect(log.signals.pressGrindy).toBe(false);
    expect(log.difficulty).toBe('normal');
    expect(log.source).toBe('planned');
  });

  it('DailyContext: bodyweight and foodNote are nullable (never fed to engine)', () => {
    const dc: DailyContext = {
      date: '2026-06-14',
      hoursSlept: 8,
      bodyweight: null,
      foodNote: null,
    };
    expect(dc.hoursSlept).toBe(8);
    expect(dc.bodyweight).toBeNull();
    expect(dc.foodNote).toBeNull();
  });

  it('StatusEffect: expiryType and nullable expiryParam', () => {
    const se: StatusEffect = {
      id: 'effect-1',
      name: 'Breathless Fog',
      source: 'signals',
      recommendationEffect: 'reduce intensity',
      expiryType: 'after_n_days',
      expiryParam: 2,
    };
    expect(se.expiryType).toBe('after_n_days');
    expect(se.expiryParam).toBe(2);
  });
});
