import { db } from '../db/bellboundDb.js';
import type { CharacterRow } from '../db/bellboundDb.js';
import type { Character } from '@bellbound/engine';

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
};
