import { db } from '../db/bellboundDb.js';
import type { WorkoutLogRow } from '../db/bellboundDb.js';
import type { WorkoutLog, DayType, WorkoutSource, Difficulty, Signals } from '@bellbound/engine';

function fromRow(row: WorkoutLogRow): WorkoutLog {
  return {
    ...row,
    plannedDayType: row.plannedDayType as DayType,
    actualDayType: row.actualDayType as DayType,
    source: row.source as WorkoutSource,
    difficulty: row.difficulty as Difficulty,
    signals: row.signals as Signals,
  };
}

export const workoutLogRepository = {
  async add(log: WorkoutLog): Promise<void> {
    await db.workoutLogs.add({ ...log });
  },

  async listRecent(n: number): Promise<WorkoutLog[]> {
    const rows = await db.workoutLogs.orderBy('date').reverse().limit(n).toArray();
    return rows.map(fromRow);
  },

  async getById(id: string): Promise<WorkoutLog | null> {
    const row = await db.workoutLogs.get(id);
    return row ? fromRow(row) : null;
  },

  async getByDate(date: string): Promise<WorkoutLog | null> {
    const row = await db.workoutLogs.where('date').equals(date).first();
    return row ? fromRow(row) : null;
  },

  async listByDateRange(startDate: string, endDate: string): Promise<WorkoutLog[]> {
    const rows = await db.workoutLogs
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();
    return rows.map(fromRow);
  },
};
