import { isTestEligibleForAscension, computeBlockTransition } from '@bellbound/engine';
import type { Block, WorkoutLog, PermanentLesson } from '@bellbound/engine';
import { db } from '../data/db/bellboundDb.js';
import { blockRepository } from '../data/repositories/blockRepository.js';

export type AscensionOutcome =
  | { kind: 'guard_not_met'; sessionsCompleted: number; sessionsNeeded: number }
  | { kind: 'test_failed' }
  | { kind: 'ascended'; lesson: PermanentLesson; nextTier: number };

export async function evaluateAndApplyAscension(
  closingBlock: Block,
  testLog: WorkoutLog,
  today: string,
): Promise<AscensionOutcome> {
  // Guard check (pure engine)
  if (!isTestEligibleForAscension(closingBlock, testLog)) {
    if (testLog.status !== 'completed' && testLog.actualDayType === 'test') {
      return { kind: 'test_failed' };
    }
    return {
      kind: 'guard_not_met',
      sessionsCompleted: closingBlock.completedPlannedKbSessions,
      sessionsNeeded: closingBlock.testGuardMinSessions,
    };
  }

  // Idempotency: verify block is still active before transacting
  const currentActive = await blockRepository.getActiveBlock();
  if (!currentActive || currentActive.id !== closingBlock.id) {
    // Already ascended — return neutral decline so UI can react
    return {
      kind: 'guard_not_met',
      sessionsCompleted: closingBlock.completedPlannedKbSessions,
      sessionsNeeded: closingBlock.testGuardMinSessions,
    };
  }

  const newBlockId = crypto.randomUUID();
  const { nextBlock, lesson } = computeBlockTransition(closingBlock, testLog, newBlockId, today);

  // Atomic transaction: all-or-nothing
  await db.transaction('rw', db.blocks, db.characters, db.lessons, async () => {
    // 1. Close current block
    await db.blocks.update(closingBlock.id, { status: 'completed' });
    // 2. Reset character stats to baseline (the Phase 8 deferred reset)
    await db.characters.update('player-1', {
      stats: { strength: 0, conditioning: 0, control: 0, consistency: 0, recovery: 0, judgment: 0 },
    });
    // 3. Open next block (completedPlannedKbSessions starts at 0 by construction)
    await db.blocks.add({ ...nextBlock });
    // 4. Bank lesson (lessons are NEVER reset on ascension)
    await db.lessons.add({ ...lesson });
  });

  return { kind: 'ascended', lesson, nextTier: nextBlock.baselineTier };
}
