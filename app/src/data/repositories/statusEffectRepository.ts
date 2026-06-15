import { db } from '../db/bellboundDb.js';
import type { StatusEffectRow } from '../db/bellboundDb.js';
import type { StatusEffect, ExpiryType } from '@bellbound/engine';

function fromRow(row: StatusEffectRow): StatusEffect {
  return {
    ...row,
    expiryType: row.expiryType as ExpiryType,
  };
}

export const statusEffectRepository = {
  async add(effect: StatusEffect): Promise<void> {
    await db.statusEffects.add({ ...effect });
  },

  async listAll(): Promise<StatusEffect[]> {
    const rows = await db.statusEffects.toArray();
    return rows.map(fromRow);
  },

  async deleteById(id: string): Promise<void> {
    await db.statusEffects.delete(id);
  },
};
