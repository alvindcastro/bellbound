import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { WorkoutLog } from '@bellbound/engine';
import { db } from '../data/db/bellboundDb.js';
import { saveLogAndUpdateCounter } from '../services/sessionCounterService.js';

const block = {
  id: 'block-1',
  name: 'Test',
  baselineTier: 1,
  startDate: '2026-01-01',
  status: 'active',
  testGuardMinSessions: 6,
  completedPlannedKbSessions: 0,
};

const qualifiedLog: WorkoutLog = {
  id: 'log-1',
  date: '2026-06-14',
  blockId: 'block-1',
  plannedDayType: 'kb',
  actualDayType: 'kb',
  source: 'planned',
  category: 'strength',
  plannedWorkout: {},
  actualWorkout: {},
  status: 'completed',
  difficulty: 'normal',
  signals: { pressGrindy: false, breathless: false, gripCooked: false, legsSore: false },
  originalNote: '',
  structuredNotes: {},
};

beforeEach(async () => {
  await db.open();
  await db.blocks.add(block);
});

afterEach(async () => {
  await db.delete();
});

describe('saveLogAndUpdateCounter', () => {
  it('qualified log (completed) increments the counter', async () => {
    await saveLogAndUpdateCounter(qualifiedLog);
    const updated = await db.blocks.get('block-1');
    expect(updated?.completedPlannedKbSessions).toBe(1);
  });

  it('modified status also increments the counter', async () => {
    const modifiedLog: WorkoutLog = { ...qualifiedLog, id: 'log-2', status: 'modified' };
    await saveLogAndUpdateCounter(modifiedLog);
    const updated = await db.blocks.get('block-1');
    expect(updated?.completedPlannedKbSessions).toBe(1);
  });

  it('skipped status does NOT increment the counter', async () => {
    const skippedLog: WorkoutLog = { ...qualifiedLog, id: 'log-3', status: 'skipped' };
    await saveLogAndUpdateCounter(skippedLog);
    const updated = await db.blocks.get('block-1');
    expect(updated?.completedPlannedKbSessions).toBe(0);
  });

  it('rest day does NOT increment the counter', async () => {
    const restLog: WorkoutLog = { ...qualifiedLog, id: 'log-4', plannedDayType: 'rest' };
    await saveLogAndUpdateCounter(restLog);
    const updated = await db.blocks.get('block-1');
    expect(updated?.completedPlannedKbSessions).toBe(0);
  });

  it('off-block session does NOT increment the counter', async () => {
    const offBlockLog: WorkoutLog = { ...qualifiedLog, id: 'log-5', source: 'off_block' };
    await saveLogAndUpdateCounter(offBlockLog);
    const updated = await db.blocks.get('block-1');
    expect(updated?.completedPlannedKbSessions).toBe(0);
  });

  it('counter persists after save — reads back correctly from DB', async () => {
    await saveLogAndUpdateCounter(qualifiedLog);
    // Read directly from the DB (as if re-opened) to confirm persistence
    const row = await db.blocks.get('block-1');
    expect(row?.completedPlannedKbSessions).toBe(1);
  });

  it('double-count guard: calling twice with the same log id leaves counter at 1', async () => {
    await saveLogAndUpdateCounter(qualifiedLog);
    // Second call with same id — should be a no-op
    await saveLogAndUpdateCounter(qualifiedLog);
    const updated = await db.blocks.get('block-1');
    expect(updated?.completedPlannedKbSessions).toBe(1);
  });

  it('two different qualified logs increment the counter to 2', async () => {
    const log2: WorkoutLog = { ...qualifiedLog, id: 'log-6', date: '2026-06-15' };
    await saveLogAndUpdateCounter(qualifiedLog);
    await saveLogAndUpdateCounter(log2);
    const updated = await db.blocks.get('block-1');
    expect(updated?.completedPlannedKbSessions).toBe(2);
  });

  // PENDING (ascension phase): counter resets to 0 when a new block opens.
  // The reset belongs to the block-open flow — when openNewBlock() is implemented,
  // it must set completedPlannedKbSessions = 0 on the new block row.
  // Test to add there: save N qualified logs, open new block, assert new block counter = 0.
  it.todo('counter resets to 0 when a new block is opened (implement in ascension phase)');
});
