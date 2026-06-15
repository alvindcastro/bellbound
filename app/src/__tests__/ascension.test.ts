import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../data/db/bellboundDb.js';
import { evaluateAndApplyAscension } from '../services/ascensionService.js';
import { blockRepository } from '../data/repositories/blockRepository.js';
import { lessonRepository } from '../data/repositories/lessonRepository.js';
import type { Block, WorkoutLog } from '@bellbound/engine';

// Helper: build a test log (actualDayType: 'test', status: 'completed')
function makeTestLog(blockId: string): WorkoutLog {
  return {
    id: 'test-log-1',
    date: '2026-06-15',
    blockId,
    plannedDayType: 'kb',
    actualDayType: 'test',
    source: 'planned',
    category: 'kettlebell',
    plannedWorkout: {},
    actualWorkout: {},
    status: 'completed',
    difficulty: 'hard',
    signals: { pressGrindy: false, breathless: false, gripCooked: false, legsSore: false },
    originalNote: '',
    structuredNotes: {},
  };
}

// Helper: build a Block with guard met
function makeBlock(overrides: Partial<Block> = {}): Block {
  return {
    id: 'block-1',
    name: 'Block 1',
    baselineTier: 1,
    startDate: '2026-05-01',
    status: 'active',
    testGuardMinSessions: 6,
    completedPlannedKbSessions: 6, // guard met
    ...overrides,
  };
}

async function seedDb(block: Block) {
  await db.blocks.add({ ...block });
  await db.characters.add({
    userId: 'player-1',
    characterName: 'Adventurer',
    className: 'Wanderer',
    level: 1,
    stats: { strength: 10, conditioning: 8, control: 5, consistency: 12, recovery: 3, judgment: 4 },
  });
}

beforeEach(async () => {
  await db.open();
});

afterEach(async () => {
  await db.delete();
});

describe('evaluateAndApplyAscension — guard enforcement', () => {
  it('returns guard_not_met when sessions < testGuardMinSessions', async () => {
    const block = makeBlock({ completedPlannedKbSessions: 5 });
    await seedDb(block);
    const result = await evaluateAndApplyAscension(block, makeTestLog(block.id), '2026-06-15');
    expect(result.kind).toBe('guard_not_met');
    // Block must still be active — nothing changed
    const active = await blockRepository.getActiveBlock();
    expect(active?.id).toBe(block.id);
  });

  it('returns test_failed when test status is not completed', async () => {
    const block = makeBlock();
    await seedDb(block);
    const result = await evaluateAndApplyAscension(
      block,
      { ...makeTestLog(block.id), status: 'failed' } as WorkoutLog,
      '2026-06-15',
    );
    expect(result.kind).toBe('test_failed');
    const active = await blockRepository.getActiveBlock();
    expect(active?.id).toBe(block.id);
  });
});

describe('evaluateAndApplyAscension — successful ascension', () => {
  it('closes the current block and opens a new one at tier+1 on success', async () => {
    const block = makeBlock();
    await seedDb(block);
    const result = await evaluateAndApplyAscension(block, makeTestLog(block.id), '2026-06-15');
    expect(result.kind).toBe('ascended');
    if (result.kind !== 'ascended') throw new Error('expected ascended');
    expect(result.nextTier).toBe(2);
    const active = await blockRepository.getActiveBlock();
    expect(active?.baselineTier).toBe(2);
    expect(active?.completedPlannedKbSessions).toBe(0);
  });

  it('resets stats to zero on ascension', async () => {
    const block = makeBlock();
    await seedDb(block);
    await evaluateAndApplyAscension(block, makeTestLog(block.id), '2026-06-15');
    const char = await db.characters.get('player-1');
    expect(char?.stats.strength).toBe(0);
    expect(char?.stats.conditioning).toBe(0);
    expect(char?.stats.consistency).toBe(0);
    expect(char?.stats.judgment).toBe(0);
  });

  it('banks a permanent lesson on ascension', async () => {
    const block = makeBlock();
    await seedDb(block);
    const result = await evaluateAndApplyAscension(block, makeTestLog(block.id), '2026-06-15');
    expect(result.kind).toBe('ascended');
    const lessons = await lessonRepository.listAll();
    expect(lessons).toHaveLength(1);
    expect(lessons[0]!.blockId).toBe(block.id);
    expect(lessons[0]!.title).toBeTruthy();
  });

  it('lessons persist after ascension — never reset', async () => {
    const block = makeBlock();
    await seedDb(block);
    await evaluateAndApplyAscension(block, makeTestLog(block.id), '2026-06-15');
    const lessonsAfterFirst = await lessonRepository.listAll();
    expect(lessonsAfterFirst).toHaveLength(1);
    // Simulate a second ascension from the new block
    const newBlock = (await blockRepository.getActiveBlock())!;
    // Give the new block enough sessions
    await db.blocks.update(newBlock.id, { completedPlannedKbSessions: 6 });
    const updatedBlock = (await blockRepository.getActiveBlock())!;
    await evaluateAndApplyAscension(updatedBlock, makeTestLog(updatedBlock.id), '2026-09-01');
    const lessonsAfterSecond = await lessonRepository.listAll();
    // Both lessons must survive — lessons never reset
    expect(lessonsAfterSecond).toHaveLength(2);
  });
});

describe('evaluateAndApplyAscension — idempotency', () => {
  it('does not ascend twice from the same block', async () => {
    const block = makeBlock();
    await seedDb(block);
    const result1 = await evaluateAndApplyAscension(block, makeTestLog(block.id), '2026-06-15');
    expect(result1.kind).toBe('ascended');
    // Call again with the same (now-closed) block
    const result2 = await evaluateAndApplyAscension(block, makeTestLog(block.id), '2026-06-15');
    expect(result2.kind).not.toBe('ascended');
    // Only one block opened (the new one)
    const allBlocks = await db.blocks.toArray();
    const openBlocks = allBlocks.filter((b) => b.status === 'active');
    expect(openBlocks).toHaveLength(1);
  });
});

describe('evaluateAndApplyAscension — lessons survive stat reset', () => {
  it('stat reset touches stats but never the lessons table', async () => {
    const block = makeBlock();
    await seedDb(block);
    // Add a pre-existing lesson to confirm it survives
    await db.lessons.add({
      id: 'old-lesson',
      title: 'Old Lesson',
      description: 'From before',
      earnedDate: '2026-01-01',
      blockId: 'old-block',
    });
    await evaluateAndApplyAscension(block, makeTestLog(block.id), '2026-06-15');
    const lessons = await lessonRepository.listAll();
    // Old lesson + new lesson = 2
    expect(lessons).toHaveLength(2);
    expect(lessons.find((l) => l.id === 'old-lesson')).toBeTruthy();
  });
});
