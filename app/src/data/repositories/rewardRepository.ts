import { db } from '../db/bellboundDb.js';
import type { ItemRow, TitleRow } from '../db/bellboundDb.js';

export const rewardRepository = {
  async grantItem(item: Omit<ItemRow, 'unlockedAt'>, date: string): Promise<void> {
    const existing = await db.items.get(item.id);
    if (!existing) {
      await db.items.add({ ...item, unlockedAt: date });
    }
  },

  async grantTitle(title: Omit<TitleRow, 'unlockedAt'>, date: string): Promise<void> {
    const existing = await db.titles.get(title.id);
    if (!existing) {
      await db.titles.add({ ...title, unlockedAt: date });
    }
  },

  async listItems(): Promise<ItemRow[]> {
    return db.items.toArray();
  },

  async listTitles(): Promise<TitleRow[]> {
    return db.titles.toArray();
  },
};
