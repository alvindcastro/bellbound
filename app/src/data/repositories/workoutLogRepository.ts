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
};
