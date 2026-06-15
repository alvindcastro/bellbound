import { db } from '../db/bellboundDb.js';
import type { BlockRow } from '../db/bellboundDb.js';
import type { Block, BlockStatus, ChallengePath } from '@bellbound/engine';

function fromRow(row: BlockRow): Block {
  return {
    ...row,
    status: row.status as BlockStatus,
    challengePath: (row.challengePath as ChallengePath) ?? null,
  };
}

export const blockRepository = {
  async getActiveBlock(): Promise<Block | null> {
    const row = await db.blocks.filter((b) => b.status === 'active').first();
    return row ? fromRow(row) : null;
  },

  async incrementCompletedPlannedKbSessions(blockId: string): Promise<void> {
    await db.blocks
      .where('id')
      .equals(blockId)
      .modify((row) => {
        row.completedPlannedKbSessions += 1;
      });
  },

  async closeBlock(blockId: string): Promise<void> {
    await db.blocks.update(blockId, { status: 'completed' });
  },

  async addBlock(block: Block): Promise<void> {
    await db.blocks.add({ ...block });
  },

  async setChallengePath(blockId: string, path: ChallengePath | null): Promise<void> {
    await db.blocks.update(blockId, { challengePath: path });
  },
};
