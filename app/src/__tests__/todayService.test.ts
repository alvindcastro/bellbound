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

  // Challenge path tests
  // Note: shouldIncrementCounter already handles day type at the engine level —
  // a log from a KB day (Monday under Minimalist) has plannedDayType: 'kb' and increments;
  // Tuesday is now rest so no KB log is expected and the counter is unaffected.

  it('returns rest on Tuesday under Minimalist path', async () => {
    await seed('2026-06-14');
    // Manually set the challenge path on the seeded block
    await db.blocks.update('block-1', { challengePath: 'minimalist' });
    const result = await resolveToday('2026-06-16'); // Tuesday = normally KB
    expect(result.dayType).toBe('rest'); // Minimalist makes Tuesday rest
  });

  it('still returns kb on Monday under Minimalist path', async () => {
    await seed('2026-06-14');
    await db.blocks.update('block-1', { challengePath: 'minimalist' });
    const result = await resolveToday('2026-06-15'); // Monday = still KB under Minimalist
    expect(result.dayType).toBe('kb');
  });

  it('returns kb on Tuesday with no challenge path', async () => {
    await seed('2026-06-14');
    // No challenge path set — default behavior
    const result = await resolveToday('2026-06-16'); // Tuesday = KB (default)
    expect(result.dayType).toBe('kb');
  });
});
