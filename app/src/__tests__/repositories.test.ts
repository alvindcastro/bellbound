import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../data/db/bellboundDb.js';
import { blockRepository } from '../data/repositories/blockRepository.js';
import { workoutTemplateRepository } from '../data/repositories/workoutTemplateRepository.js';
import { weekTemplateRepository } from '../data/repositories/weekTemplateRepository.js';
import { workoutLogRepository } from '../data/repositories/workoutLogRepository.js';
import { characterRepository } from '../data/repositories/characterRepository.js';
import { buildWorkoutLog } from '../services/buildWorkoutLog.js';

beforeEach(async () => {
  await db.open();
});

afterEach(async () => {
  await db.delete();
});

describe('blockRepository', () => {
  it('getActiveBlock returns the active block mapped to an engine entity', async () => {
    await db.blocks.add({
      id: 'block-1',
      name: 'Phase 0 Block',
      baselineTier: 1,
      startDate: '2026-06-14',
      status: 'active',
      testGuardMinSessions: 6,
      completedPlannedKbSessions: 0,
    });
    const block = await blockRepository.getActiveBlock();
    expect(block).not.toBeNull();
    expect(block?.id).toBe('block-1');
    expect(block?.status).toBe('active');
    expect(block?.baselineTier).toBe(1);
    expect(block?.testGuardMinSessions).toBe(6);
    expect(block?.completedPlannedKbSessions).toBe(0);
  });

  it('getActiveBlock returns null when no active block exists', async () => {
    const block = await blockRepository.getActiveBlock();
    expect(block).toBeNull();
  });

  it('getActiveBlock skips non-active blocks', async () => {
    await db.blocks.add({
      id: 'block-archived',
      name: 'Old Block',
      baselineTier: 1,
      startDate: '2026-01-01',
      status: 'archived',
      testGuardMinSessions: 6,
      completedPlannedKbSessions: 6,
    });
    const block = await blockRepository.getActiveBlock();
    expect(block).toBeNull();
  });

  it('closeBlock sets status to completed', async () => {
    await db.blocks.add({
      id: 'block-1',
      name: 'Phase 0 Block',
      baselineTier: 1,
      startDate: '2026-06-01',
      status: 'active',
      testGuardMinSessions: 6,
      completedPlannedKbSessions: 6,
    });
    await blockRepository.closeBlock('block-1');
    const row = await db.blocks.get('block-1');
    expect(row?.status).toBe('completed');
    const active = await blockRepository.getActiveBlock();
    expect(active).toBeNull();
  });

  it('addBlock inserts a new block into the db', async () => {
    const newBlock = {
      id: 'block-2',
      name: 'Phase 1 Block',
      baselineTier: 2,
      startDate: '2026-09-01',
      status: 'active' as const,
      testGuardMinSessions: 6,
      completedPlannedKbSessions: 0,
    };
    await blockRepository.addBlock(newBlock);
    const row = await db.blocks.get('block-2');
    expect(row?.id).toBe('block-2');
    expect(row?.baselineTier).toBe(2);
    expect(row?.status).toBe('active');
    expect(row?.completedPlannedKbSessions).toBe(0);
  });
});

describe('workoutTemplateRepository', () => {
  const sampleTemplate = {
    id: 'wt-dkbs',
    name: 'Double KB Strength',
    zoneName: 'Strength',
    category: 'kettlebell',
    defaultRest: 90,
    tierStep: 'add 1 round per tier',
    tiers: { '1': { rounds: 4 }, '2': { rounds: 5 }, '3': { rounds: 6 } },
    movements: [
      { name: 'Double Clean', reps: 5 },
      { name: 'Double Press', reps: 3 },
    ],
  };

  it('getById returns the template mapped to an engine entity', async () => {
    await db.workoutTemplates.add(sampleTemplate);
    const template = await workoutTemplateRepository.getById('wt-dkbs');
    expect(template).not.toBeNull();
    expect(template?.id).toBe('wt-dkbs');
    expect(template?.name).toBe('Double KB Strength');
    expect(template?.tiers['1']?.rounds).toBe(4);
    expect(template?.tiers['3']?.rounds).toBe(6);
    expect(template?.movements[0]?.name).toBe('Double Clean');
    expect(template?.defaultRest).toBe(90);
  });

  it('getById returns null for an unknown id', async () => {
    const template = await workoutTemplateRepository.getById('no-such-id');
    expect(template).toBeNull();
  });
});

describe('weekTemplateRepository', () => {
  const defaultDays = {
    monday: 'kb',
    tuesday: 'kb',
    wednesday: 'rest',
    thursday: 'kb',
    friday: 'kb',
    saturday: 'free',
    sunday: 'rest',
  };

  it('getDefault returns the first week template as an engine entity', async () => {
    await db.weekTemplates.add({ id: 'default', days: defaultDays });
    const wt = await weekTemplateRepository.getDefault();
    expect(wt).not.toBeNull();
    expect(wt?.id).toBe('default');
    expect(wt?.days.monday).toBe('kb');
    expect(wt?.days.wednesday).toBe('rest');
    expect(wt?.days.saturday).toBe('free');
    expect(wt?.days.sunday).toBe('rest');
  });

  it('getDefault returns null when no template exists', async () => {
    const wt = await weekTemplateRepository.getDefault();
    expect(wt).toBeNull();
  });
});

describe('workoutLogRepository', () => {
  const makeLog = (id: string, date: string) => ({
    id,
    date,
    blockId: 'block-1',
    plannedDayType: 'kb' as const,
    actualDayType: 'kb' as const,
    source: 'planned' as const,
    category: 'kettlebell',
    plannedWorkout: {} as Record<string, unknown>,
    actualWorkout: {} as Record<string, unknown>,
    status: 'done',
    difficulty: 'normal' as const,
    signals: { pressGrindy: false, breathless: false, gripCooked: false, legsSore: false },
    originalNote: '',
    structuredNotes: {} as Record<string, unknown>,
  });

  it('add writes a log and it can be read back from the db', async () => {
    await workoutLogRepository.add(makeLog('log-1', '2026-06-14'));
    const row = await db.workoutLogs.get('log-1');
    expect(row?.id).toBe('log-1');
    expect(row?.date).toBe('2026-06-14');
    expect(row?.blockId).toBe('block-1');
    expect(row?.difficulty).toBe('normal');
  });

  it('listRecent returns logs sorted newest-first, limited to n', async () => {
    await workoutLogRepository.add(makeLog('log-1', '2026-06-12'));
    await workoutLogRepository.add(makeLog('log-2', '2026-06-14'));
    await workoutLogRepository.add(makeLog('log-3', '2026-06-13'));
    const recent = await workoutLogRepository.listRecent(2);
    expect(recent).toHaveLength(2);
    expect(recent[0]?.id).toBe('log-2');
    expect(recent[1]?.id).toBe('log-3');
  });

  it('listRecent returns all logs when n exceeds total count', async () => {
    await workoutLogRepository.add(makeLog('log-a', '2026-06-10'));
    await workoutLogRepository.add(makeLog('log-b', '2026-06-11'));
    const recent = await workoutLogRepository.listRecent(10);
    expect(recent).toHaveLength(2);
  });

  it('add writes mapped entity fields correctly', async () => {
    const log = makeLog('log-x', '2026-06-01');
    await workoutLogRepository.add(log);
    const rows = await workoutLogRepository.listRecent(1);
    expect(rows[0]?.source).toBe('planned');
    expect(rows[0]?.plannedDayType).toBe('kb');
    expect(rows[0]?.signals.pressGrindy).toBe(false);
  });
});

describe('workoutLogRepository.listByTemplateId', () => {
  const context = {
    date: '2026-06-15',
    blockId: 'block-1',
    plannedDayType: 'kb' as const,
    actualDayType: 'kb' as const,
    templateId: 'dkbs',
    templateName: 'Double KB Strength',
    category: 'kettlebell',
  };

  const inputs = {
    status: 'completed' as const,
    roundsCompleted: 4,
    difficulty: 'normal' as const,
    note: '',
  };

  it('returns empty array when no logs exist', async () => {
    const logs = await workoutLogRepository.listByTemplateId('dkbs', 5);
    expect(logs).toHaveLength(0);
  });

  it('returns only logs for the given templateId', async () => {
    const dkbsLog = buildWorkoutLog(inputs, { ...context, templateId: 'dkbs', date: '2026-06-15' });
    const abcLog = buildWorkoutLog(inputs, { ...context, templateId: 'abc', templateName: 'ABC', date: '2026-06-16' });
    await workoutLogRepository.add(dkbsLog);
    await workoutLogRepository.add(abcLog);
    const logs = await workoutLogRepository.listByTemplateId('dkbs', 10);
    expect(logs).toHaveLength(1);
    expect((logs[0]!.plannedWorkout as Record<string, unknown>)['templateId']).toBe('dkbs');
  });

  it('returns logs most-recent-first', async () => {
    const older = buildWorkoutLog(inputs, { ...context, date: '2026-06-10' });
    const newer = buildWorkoutLog(inputs, { ...context, date: '2026-06-15' });
    await workoutLogRepository.add(older);
    await workoutLogRepository.add(newer);
    const logs = await workoutLogRepository.listByTemplateId('dkbs', 10);
    expect(logs).toHaveLength(2);
    expect(logs[0]!.date).toBe('2026-06-15');
    expect(logs[1]!.date).toBe('2026-06-10');
  });

  it('respects the limit parameter', async () => {
    for (let i = 1; i <= 4; i++) {
      const log = buildWorkoutLog(inputs, { ...context, date: `2026-06-1${i}` });
      await workoutLogRepository.add(log);
    }
    const logs = await workoutLogRepository.listByTemplateId('dkbs', 2);
    expect(logs).toHaveLength(2);
  });
});

describe('characterRepository', () => {
  const sampleCharacterRow = {
    userId: 'player-1',
    className: 'bellbarian',
    level: 1,
    characterName: 'Adventurer',
    stats: { strength: 0, conditioning: 0, control: 0, consistency: 0, recovery: 0, judgment: 0 },
  };

  it('getPlayer returns null when no character exists', async () => {
    const character = await characterRepository.getPlayer();
    expect(character).toBeNull();
  });

  it('getPlayer returns the character mapped correctly when a character row exists', async () => {
    await db.characters.add(sampleCharacterRow);
    const character = await characterRepository.getPlayer();
    expect(character).not.toBeNull();
    expect(character?.userId).toBe('player-1');
    expect(character?.className).toBe('bellbarian');
    expect(character?.level).toBe(1);
    expect(character?.characterName).toBe('Adventurer');
    expect(character?.stats.strength).toBe(0);
    expect(character?.stats.judgment).toBe(0);
  });

  it('updateClass changes the className field', async () => {
    await db.characters.add(sampleCharacterRow);
    await characterRepository.updateClass('player-1', 'pressomancer');
    const character = await characterRepository.getPlayer();
    expect(character?.className).toBe('pressomancer');
  });

  it('applyStatDeltas adds deltas to existing stats', async () => {
    await db.characters.add(sampleCharacterRow);
    await characterRepository.applyStatDeltas('player-1', { strength: 2, consistency: 1 });
    const after = await characterRepository.getPlayer();
    expect(after?.stats.strength).toBe(2);
    expect(after?.stats.consistency).toBe(1);
    expect(after?.stats.conditioning).toBe(0); // unchanged
    expect(after?.stats.judgment).toBe(0);     // unchanged
  });

  it('applyStatDeltas is additive across multiple calls', async () => {
    await db.characters.add(sampleCharacterRow);
    await characterRepository.applyStatDeltas('player-1', { strength: 1 });
    await characterRepository.applyStatDeltas('player-1', { strength: 1, recovery: 3 });
    const after = await characterRepository.getPlayer();
    expect(after?.stats.strength).toBe(2);
    expect(after?.stats.recovery).toBe(3);
  });

  it('applyStatDeltas does nothing when userId not found', async () => {
    // no character in DB
    await expect(characterRepository.applyStatDeltas('nobody', { strength: 1 })).resolves.not.toThrow();
  });

  it('resetStats sets all stats to zero', async () => {
    const charWithStats = {
      ...sampleCharacterRow,
      stats: { strength: 10, conditioning: 8, control: 5, consistency: 12, recovery: 3, judgment: 4 },
    };
    await db.characters.add(charWithStats);
    await characterRepository.resetStats('player-1');
    const after = await characterRepository.getPlayer();
    expect(after?.stats.strength).toBe(0);
    expect(after?.stats.conditioning).toBe(0);
    expect(after?.stats.control).toBe(0);
    expect(after?.stats.consistency).toBe(0);
    expect(after?.stats.recovery).toBe(0);
    expect(after?.stats.judgment).toBe(0);
  });
});
