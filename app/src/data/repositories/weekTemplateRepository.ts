import { db } from '../db/bellboundDb.js';
import type { WeekTemplateRow } from '../db/bellboundDb.js';
import type { WeekTemplate, Weekday, DayType } from '@bellbound/engine';

function fromRow(row: WeekTemplateRow): WeekTemplate {
  return {
    id: row.id,
    days: row.days as Record<Weekday, DayType>,
  };
}

export const weekTemplateRepository = {
  async getDefault(): Promise<WeekTemplate | null> {
    const row = await db.weekTemplates.toCollection().first();
    return row ? fromRow(row) : null;
  },
};
