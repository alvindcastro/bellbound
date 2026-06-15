import { db } from '../db/bellboundDb.js';
import type { DailyContext } from '@bellbound/engine';

export const dailyContextRepository = {
  async upsert(context: DailyContext): Promise<void> {
    await db.dailyContext.put({ ...context });
  },

  async getByDate(date: string): Promise<DailyContext | null> {
    const row = await db.dailyContext.get(date);
    return row ?? null;
  },

  async listAfterDate(afterDate: string): Promise<DailyContext[]> {
    return db.dailyContext.where('date').above(afterDate).sortBy('date');
  },

  async listAll(): Promise<DailyContext[]> {
    return db.dailyContext.orderBy('date').toArray();
  },
};
