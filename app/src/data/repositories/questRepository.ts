import { db } from '../db/bellboundDb.js';
import type { QuestRow } from '../db/bellboundDb.js';

export const questRepository = {
  async upsertProgress(id: string, progress: number, completed: boolean): Promise<void> {
    await db.quests.put({ id, progress, completed });
  },

  async getAll(): Promise<QuestRow[]> {
    return db.quests.toArray();
  },

  async getById(id: string): Promise<QuestRow | null> {
    return (await db.quests.get(id)) ?? null;
  },
};
