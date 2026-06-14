import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../data/db/bellboundDb.js';
import { seed } from '../data/seed.js';
import type { WorkoutTemplate } from '@bellbound/engine';
import { getWeekday, resolveTierWorkout, resolveToday } from '../services/todayService.js';

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

// ── resolveTierWorkout ───────────────────────────────────────────────────────

const template: WorkoutTemplate = {
  id: 'dkbs',
  name: 'Double KB Strength',
  zoneName: 'Strength Zone',
  category: 'kettlebell',
  defaultRest: 90,
  tierStep: '+1 round per tier',
  tiers: { '1': { rounds: 4 }, '2': { rounds: 5 }, '3': { rounds: 6 } },
  movements: [
    { name: 'Double Clean', reps: 5, load: 20 },
    { name: 'Double Press', reps: 3, load: 20 },
    { name: 'Double Front Squat', reps: 5, load: 20 },
    { name: 'Push-ups', reps: 10 },
    { name: 'Farmer Carry', duration: 30, load: 20 },
  ],
};

describe('resolveTierWorkout', () => {
  it('tier 1 resolves to rounds: 4 with 5 movements', () => {
    const result = resolveTierWorkout(template, 1);
    expect(result.rounds).toBe(4);
    expect(result.movements).toHaveLength(5);
    expect(result.movements[0]?.rounds).toBe(4);
  });

  it('tier 2 resolves to rounds: 5', () => {
    const result = resolveTierWorkout(template, 2);
    expect(result.rounds).toBe(5);
    expect(result.movements[0]?.rounds).toBe(5);
  });

  it('tier 99 throws', () => {
    expect(() => resolveTierWorkout(template, 99)).toThrow();
  });

  it('returned workout has correct metadata fields', () => {
    const result = resolveTierWorkout(template, 1);
    expect(result.templateId).toBe('dkbs');
    expect(result.name).toBe('Double KB Strength');
    expect(result.zoneName).toBe('Strength Zone');
    expect(result.defaultRest).toBe(90);
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
