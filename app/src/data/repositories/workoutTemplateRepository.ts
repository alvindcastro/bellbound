import { db } from '../db/bellboundDb.js';
import type { WorkoutTemplateRow } from '../db/bellboundDb.js';
import type { WorkoutTemplate } from '@bellbound/engine';

function fromRow(row: WorkoutTemplateRow): WorkoutTemplate {
  return { ...row };
}

export const workoutTemplateRepository = {
  async getById(id: string): Promise<WorkoutTemplate | null> {
    const row = await db.workoutTemplates.get(id);
    return row ? fromRow(row) : null;
  },

  async listKettlebell(): Promise<WorkoutTemplate[]> {
    const rows = await db.workoutTemplates.toArray();
    return rows.filter(r => r.category === 'kettlebell').map(fromRow);
  },
};
