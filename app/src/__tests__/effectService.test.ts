import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../data/db/bellboundDb.js';
import { statusEffectRepository } from '../data/repositories/statusEffectRepository.js';
import { createAndPersistEffectsFromLog, createAndPersistPoorSleepGoblinIfNeeded } from '../services/effectService.js';
import type { WorkoutLog } from '@bellbound/engine';

beforeEach(async () => {
  await db.open();
});

afterEach(async () => {
  await db.delete();
});

const makeLog = (overrides: Partial<WorkoutLog['signals']> = {}): WorkoutLog => ({
  id: 'log-1',
  date: '2026-06-14',
  blockId: 'block-1',
  plannedDayType: 'kb',
  actualDayType: 'kb',
  source: 'planned',
  category: 'kettlebell',
  plannedWorkout: {},
  actualWorkout: {},
  status: 'completed',
  difficulty: 'normal',
  signals: {
    pressGrindy: false,
    breathless: false,
    gripCooked: false,
    legsSore: false,
    ...overrides,
  },
  originalNote: '',
  structuredNotes: {},
});

describe('createAndPersistEffectsFromLog', () => {
  it('creates Press Gremlin when pressGrindy is true', async () => {
    const log = makeLog({ pressGrindy: true });
    await createAndPersistEffectsFromLog(log);
    const effects = await statusEffectRepository.listAll();
    expect(effects).toHaveLength(1);
    expect(effects[0]?.name).toBe('Press Gremlin');
    expect(effects[0]?.createdDate).toBe('2026-06-14');
  });

  it('persists no effects when all signals are false', async () => {
    const log = makeLog();
    await createAndPersistEffectsFromLog(log);
    const effects = await statusEffectRepository.listAll();
    expect(effects).toHaveLength(0);
  });
});

describe('createAndPersistPoorSleepGoblinIfNeeded', () => {
  it('adds Poor Sleep Goblin when hoursSlept < SLEEP_OK_HOURS (7)', async () => {
    await createAndPersistPoorSleepGoblinIfNeeded('2026-06-14', 5);
    const effects = await statusEffectRepository.listAll();
    expect(effects).toHaveLength(1);
    expect(effects[0]?.name).toBe('Poor Sleep Goblin');
    expect(effects[0]?.createdDate).toBe('2026-06-14');
  });

  it('adds no effect when hoursSlept >= SLEEP_OK_HOURS (7)', async () => {
    await createAndPersistPoorSleepGoblinIfNeeded('2026-06-14', 8);
    const effects = await statusEffectRepository.listAll();
    expect(effects).toHaveLength(0);
  });

  it('adds no effect when hoursSlept exactly equals SLEEP_OK_HOURS (7)', async () => {
    await createAndPersistPoorSleepGoblinIfNeeded('2026-06-14', 7);
    const effects = await statusEffectRepository.listAll();
    expect(effects).toHaveLength(0);
  });
});
