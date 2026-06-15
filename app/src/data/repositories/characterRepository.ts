import { db } from '../db/bellboundDb.js';
import type { CharacterRow } from '../db/bellboundDb.js';
import type { Character, CharacterStats } from '@bellbound/engine';

function fromRow(row: CharacterRow): Character {
  return { ...row };
}

export const characterRepository = {
  async getPlayer(): Promise<Character | null> {
    const row = await db.characters.get('player-1');
    return row ? fromRow(row) : null;
  },

  async updateClass(userId: string, className: string): Promise<void> {
    await db.characters.update(userId, { className });
  },

  async applyStatDeltas(userId: string, deltas: Partial<CharacterStats>): Promise<void> {
    const row = await db.characters.get(userId);
    if (!row) return;
    const updatedStats = {
      strength: row.stats.strength + (deltas.strength ?? 0),
      conditioning: row.stats.conditioning + (deltas.conditioning ?? 0),
      control: row.stats.control + (deltas.control ?? 0),
      consistency: row.stats.consistency + (deltas.consistency ?? 0),
      recovery: row.stats.recovery + (deltas.recovery ?? 0),
      judgment: row.stats.judgment + (deltas.judgment ?? 0),
    };
    await db.characters.update(userId, { stats: updatedStats });
  },
};
