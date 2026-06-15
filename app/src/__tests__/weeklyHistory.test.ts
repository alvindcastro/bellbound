import { describe, it, expect } from 'vitest';
import type { WeekTemplate, WorkoutLog } from '@bellbound/engine';
import { buildWeekSummary } from '../services/weeklyHistoryService.js';

// Default template: Mon/Tue/Thu/Fri = kb, Wed = rest, Sat = free, Sun = rest
const defaultTemplate: WeekTemplate = {
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

// Week of Mon 2026-06-15 to Sun 2026-06-21
const weekDates = [
  '2026-06-15', // Mon → kb
  '2026-06-16', // Tue → kb
  '2026-06-17', // Wed → rest
  '2026-06-18', // Thu → kb
  '2026-06-19', // Fri → kb
  '2026-06-20', // Sat → free
  '2026-06-21', // Sun → rest
];

function makeLog(date: string, status: string = 'completed'): WorkoutLog {
  return {
    id: `log-${date}`,
    date,
    blockId: 'b1',
    plannedDayType: 'kb',
    actualDayType: 'kb',
    source: 'planned',
    category: 'strength',
    plannedWorkout: {},
    actualWorkout: {},
    status,
    difficulty: 'normal',
    signals: { pressGrindy: false, breathless: false, gripCooked: false, legsSore: false },
    originalNote: '',
    structuredNotes: {},
  };
}

function makeLogWithNote(date: string, note: string): WorkoutLog {
  return { ...makeLog(date), originalNote: note };
}

describe('buildWeekSummary', () => {
  it('all KB days trained, all rest days rested: 4 planned, 4 actual, 0 extras, 0 misses, 7 entries', () => {
    const logsByDate: Record<string, WorkoutLog | null> = {
      '2026-06-15': makeLog('2026-06-15'), // Mon kb → trained
      '2026-06-16': makeLog('2026-06-16'), // Tue kb → trained
      '2026-06-17': null,                  // Wed rest → rested
      '2026-06-18': makeLog('2026-06-18'), // Thu kb → trained
      '2026-06-19': makeLog('2026-06-19'), // Fri kb → trained
      '2026-06-20': null,                  // Sat free → free_day_no_activity
      '2026-06-21': null,                  // Sun rest → rested
    };

    const summary = buildWeekSummary(weekDates, defaultTemplate, logsByDate);

    expect(summary.days).toHaveLength(7);
    expect(summary.plannedSessions).toBe(4);
    expect(summary.actualSessions).toBe(4);
    expect(summary.extras).toBe(0);
    expect(summary.misses).toBe(0);
  });

  it('one KB day missed: Fri not logged → plannedSessions=4, actualSessions=3, misses=1', () => {
    const logsByDate: Record<string, WorkoutLog | null> = {
      '2026-06-15': makeLog('2026-06-15'),
      '2026-06-16': makeLog('2026-06-16'),
      '2026-06-17': null,
      '2026-06-18': makeLog('2026-06-18'),
      '2026-06-19': null, // missed Fri
      '2026-06-20': null,
      '2026-06-21': null,
    };

    const summary = buildWeekSummary(weekDates, defaultTemplate, logsByDate);

    expect(summary.plannedSessions).toBe(4);
    expect(summary.actualSessions).toBe(3);
    expect(summary.extras).toBe(0);
    expect(summary.misses).toBe(1);
  });

  it('trained on rest day (Wed): extras=1, misses=0 when all KB days trained', () => {
    const logsByDate: Record<string, WorkoutLog | null> = {
      '2026-06-15': makeLog('2026-06-15'),
      '2026-06-16': makeLog('2026-06-16'),
      '2026-06-17': makeLog('2026-06-17'), // rest day with log → extra
      '2026-06-18': makeLog('2026-06-18'),
      '2026-06-19': makeLog('2026-06-19'),
      '2026-06-20': null,
      '2026-06-21': null,
    };

    const summary = buildWeekSummary(weekDates, defaultTemplate, logsByDate);

    expect(summary.extras).toBe(1);
    expect(summary.misses).toBe(0);
    // actualSessions includes the extra session
    expect(summary.actualSessions).toBe(5);
  });

  it('empty week (no logs): plannedSessions=4, actualSessions=0, extras=0, misses=4', () => {
    const logsByDate: Record<string, WorkoutLog | null> = {
      '2026-06-15': null,
      '2026-06-16': null,
      '2026-06-17': null,
      '2026-06-18': null,
      '2026-06-19': null,
      '2026-06-20': null,
      '2026-06-21': null,
    };

    const summary = buildWeekSummary(weekDates, defaultTemplate, logsByDate);

    expect(summary.plannedSessions).toBe(4);
    expect(summary.actualSessions).toBe(0);
    expect(summary.extras).toBe(0);
    expect(summary.misses).toBe(4);
  });

  it('free day with activity: Sat has a log → free_day_with_activity; does not affect actualSessions or misses', () => {
    const logsByDate: Record<string, WorkoutLog | null> = {
      '2026-06-15': makeLog('2026-06-15'),
      '2026-06-16': makeLog('2026-06-16'),
      '2026-06-17': null,
      '2026-06-18': makeLog('2026-06-18'),
      '2026-06-19': makeLog('2026-06-19'),
      '2026-06-20': makeLog('2026-06-20'), // Sat free → free_day_with_activity
      '2026-06-21': null,
    };

    const summary = buildWeekSummary(weekDates, defaultTemplate, logsByDate);

    const satEntry = summary.days.find(d => d.date === '2026-06-20');
    expect(satEntry?.classification).toBe('free_day_with_activity');
    // free day activity does NOT count toward actualSessions
    expect(summary.actualSessions).toBe(4);
    expect(summary.misses).toBe(0);
  });

  it('DaySummary entries have correct date, planned, and classification fields', () => {
    const logsByDate: Record<string, WorkoutLog | null> = {
      '2026-06-15': makeLog('2026-06-15'),
      '2026-06-16': null, // missed
      '2026-06-17': null,
      '2026-06-18': makeLog('2026-06-18'),
      '2026-06-19': makeLog('2026-06-19'),
      '2026-06-20': null,
      '2026-06-21': null,
    };

    const summary = buildWeekSummary(weekDates, defaultTemplate, logsByDate);

    const mon = summary.days[0]!;
    expect(mon.date).toBe('2026-06-15');
    expect(mon.planned).toBe('kb');
    expect(mon.classification).toBe('trained_on_training_day');

    const tue = summary.days[1]!;
    expect(tue.date).toBe('2026-06-16');
    expect(tue.planned).toBe('kb');
    expect(tue.classification).toBe('missed_training_day');

    const wed = summary.days[2]!;
    expect(wed.date).toBe('2026-06-17');
    expect(wed.planned).toBe('rest');
    expect(wed.classification).toBe('rested_on_rest_day');

    const sat = summary.days[5]!;
    expect(sat.date).toBe('2026-06-20');
    expect(sat.planned).toBe('free');
    expect(sat.classification).toBe('free_day_no_activity');
  });

  it('restDaysTaken: when no logs on rest days (Wed and Sun), restDaysTaken = 2', () => {
    const logsByDate: Record<string, WorkoutLog | null> = {
      '2026-06-15': makeLog('2026-06-15'), // Mon kb → trained
      '2026-06-16': makeLog('2026-06-16'), // Tue kb → trained
      '2026-06-17': null,                  // Wed rest → rested_on_rest_day
      '2026-06-18': makeLog('2026-06-18'), // Thu kb → trained
      '2026-06-19': makeLog('2026-06-19'), // Fri kb → trained
      '2026-06-20': null,                  // Sat free → free_day_no_activity
      '2026-06-21': null,                  // Sun rest → rested_on_rest_day
    };

    const summary = buildWeekSummary(weekDates, defaultTemplate, logsByDate);

    expect(summary.restDaysTaken).toBe(2);
  });

  it('freeDayActivities: when Sat (free day) has a log, freeDayActivities = 1', () => {
    const logsByDate: Record<string, WorkoutLog | null> = {
      '2026-06-15': makeLog('2026-06-15'),
      '2026-06-16': makeLog('2026-06-16'),
      '2026-06-17': null,
      '2026-06-18': makeLog('2026-06-18'),
      '2026-06-19': makeLog('2026-06-19'),
      '2026-06-20': makeLog('2026-06-20'), // Sat free → free_day_with_activity
      '2026-06-21': null,
    };

    const summary = buildWeekSummary(weekDates, defaultTemplate, logsByDate);

    expect(summary.freeDayActivities).toBe(1);
  });

  it('notes: non-empty originalNote from a log is included in notes array', () => {
    const logsByDate: Record<string, WorkoutLog | null> = {
      '2026-06-15': makeLogWithNote('2026-06-15', 'felt strong today'),
      '2026-06-16': makeLog('2026-06-16'),
      '2026-06-17': null,
      '2026-06-18': makeLog('2026-06-18'),
      '2026-06-19': makeLog('2026-06-19'),
      '2026-06-20': null,
      '2026-06-21': null,
    };

    const summary = buildWeekSummary(weekDates, defaultTemplate, logsByDate);

    expect(summary.notes).toContain('felt strong today');
  });

  it('notes: empty originalNote is excluded from notes array', () => {
    const logsByDate: Record<string, WorkoutLog | null> = {
      '2026-06-15': makeLog('2026-06-15'), // originalNote: ''
      '2026-06-16': makeLog('2026-06-16'),
      '2026-06-17': null,
      '2026-06-18': makeLog('2026-06-18'),
      '2026-06-19': makeLog('2026-06-19'),
      '2026-06-20': null,
      '2026-06-21': null,
    };

    const summary = buildWeekSummary(weekDates, defaultTemplate, logsByDate);

    expect(summary.notes).toHaveLength(0);
  });

  it('notes: multiple logs with notes are collected in date order', () => {
    const logsByDate: Record<string, WorkoutLog | null> = {
      '2026-06-15': makeLogWithNote('2026-06-15', 'first note'),
      '2026-06-16': makeLog('2026-06-16'),
      '2026-06-17': null,
      '2026-06-18': makeLogWithNote('2026-06-18', 'second note'),
      '2026-06-19': makeLog('2026-06-19'),
      '2026-06-20': null,
      '2026-06-21': null,
    };

    const summary = buildWeekSummary(weekDates, defaultTemplate, logsByDate);

    expect(summary.notes).toEqual(['first note', 'second note']);
  });
});
