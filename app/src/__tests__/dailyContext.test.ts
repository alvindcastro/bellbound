import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../data/db/bellboundDb.js';
import { dailyContextRepository } from '../data/repositories/dailyContextRepository.js';
import type { DailyContext } from '@bellbound/engine';

beforeEach(async () => {
  await db.open();
});

afterEach(async () => {
  await db.delete();
});

describe('dailyContextRepository', () => {
  const makeContext = (date: string, hoursSlept: number | null = 8): DailyContext => ({
    date,
    hoursSlept,
    bodyweight: null,
    foodNote: null,
  });

  it('upsert writes an entry and getByDate reads it back', async () => {
    await dailyContextRepository.upsert(makeContext('2026-06-14', 7.5));
    const result = await dailyContextRepository.getByDate('2026-06-14');
    expect(result).not.toBeNull();
    expect(result?.date).toBe('2026-06-14');
    expect(result?.hoursSlept).toBe(7.5);
  });

  it('upsert on the same date replaces the entry (idempotent)', async () => {
    await dailyContextRepository.upsert(makeContext('2026-06-14', 6));
    await dailyContextRepository.upsert(makeContext('2026-06-14', 8));
    const all = await dailyContextRepository.listAll();
    expect(all).toHaveLength(1);
    expect(all[0]?.hoursSlept).toBe(8);
  });

  it('getByDate returns null for unknown date', async () => {
    const result = await dailyContextRepository.getByDate('2099-01-01');
    expect(result).toBeNull();
  });

  it('listAfterDate returns only entries with date strictly after the cutoff', async () => {
    await dailyContextRepository.upsert(makeContext('2026-06-09'));
    await dailyContextRepository.upsert(makeContext('2026-06-10'));
    await dailyContextRepository.upsert(makeContext('2026-06-11'));
    await dailyContextRepository.upsert(makeContext('2026-06-12'));
    const result = await dailyContextRepository.listAfterDate('2026-06-10');
    expect(result).toHaveLength(2);
    expect(result[0]?.date).toBe('2026-06-11');
    expect(result[1]?.date).toBe('2026-06-12');
  });

  it('listAll returns all entries ordered ascending by date', async () => {
    await dailyContextRepository.upsert(makeContext('2026-06-14'));
    await dailyContextRepository.upsert(makeContext('2026-06-12'));
    await dailyContextRepository.upsert(makeContext('2026-06-13'));
    const all = await dailyContextRepository.listAll();
    expect(all).toHaveLength(3);
    expect(all[0]?.date).toBe('2026-06-12');
    expect(all[1]?.date).toBe('2026-06-13');
    expect(all[2]?.date).toBe('2026-06-14');
  });

  it('bodyweight and foodNote round-trip correctly', async () => {
    // bodyweight/foodNote are stored only; they are never passed to engine functions (enforced in effectService)
    const ctx: DailyContext = {
      date: '2026-06-15',
      hoursSlept: 7,
      bodyweight: 75,
      foodNote: 'salad',
    };
    await dailyContextRepository.upsert(ctx);
    const result = await dailyContextRepository.getByDate('2026-06-15');
    expect(result?.bodyweight).toBe(75);
    expect(result?.foodNote).toBe('salad');
  });
});
