import { db } from '../db/bellboundDb.js';
import type { LoreRow } from '../db/bellboundDb.js';

export const loreRepository = {
  async put(entry: LoreRow): Promise<void> {
    await db.lore.put(entry);
  },
  async getForLog(logId: string): Promise<LoreRow | null> {
    return (await db.lore.where('logId').equals(logId).first()) ?? null;
  },
};
