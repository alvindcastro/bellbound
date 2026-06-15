import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../data/db/bellboundDb.js';
import { seed } from '../data/seed.js';
import { getWeekday, resolveToday } from '../services/todayService.js';

beforeEach(async () => {
  await db.open();
});

afterEach(async () => {
  await db.delete();
});

// ── getWeekday ───────────────────────────────────────────────────────────────

describe('getWeekday', () => {
  it('returns monday for 2026-06-15', () => {
    expect(getWeekday('2026-06-15')).toBe('monday');
  });

  it('returns sunday for 2026-06-14', () => {
    expect(getWeekday('2026-06-14')).toBe('sunday');
  });

  it('returns wednesday for 2026-06-17', () => {
    expect(getWeekday('2026-06-17')).toBe('wednesday');
  });
});

// ── resolveToday ─────────────────────────────────────────────────────────────

describe('resolveToday', () => {
  it('returns kb workout on a kb day with seeded data', async () => {
    await seed('2026-06-14');
    const result = await resolveToday('2026-06-15'); // Monday = kb
    expect(result.dayType).toBe('kb');
    if (result.dayType === 'kb') {
      expect(result.workout.rounds).toBe(4);
      expect(result.workout.name).toBe('Double KB Strength');
    }
  });

  it('returns rest on a rest day with seeded data', async () => {
    await seed('2026-06-14');
    const result = await resolveToday('2026-06-17'); // Wednesday = rest
    expect(result.dayType).toBe('rest');
  });

  it('returns free on a free day with seeded data', async () => {
    await seed('2026-06-14');
    const result = await resolveToday('2026-06-20'); // Saturday = free
    expect(result.dayType).toBe('free');
  });
});
