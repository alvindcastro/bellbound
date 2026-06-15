import { describe, it, expect } from 'vitest';
import { resolveWorkoutAtTier } from '../progression/resolveWorkoutAtTier.js';
import type { WorkoutTemplate } from '../entities/index.js';

// Section A — Double KB Strength (DKBS)
const dkbs: WorkoutTemplate = {
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
    { name: 'Farmer Carry', duration: 30, load: 20 },
  ],
};

describe('resolveWorkoutAtTier — DKBS', () => {
  it('tier 1 returns rounds: 4 and 3 movements each with rounds: 4', () => {
    const result = resolveWorkoutAtTier(dkbs, 1);
    expect(result.rounds).toBe(4);
    expect(result.movements).toHaveLength(3);
    expect(result.movements.every(m => m.rounds === 4)).toBe(true);
  });

  it('tier 2 returns rounds: 5', () => {
    const result = resolveWorkoutAtTier(dkbs, 2);
    expect(result.rounds).toBe(5);
  });

  it('tier 3 returns rounds: 6', () => {
    const result = resolveWorkoutAtTier(dkbs, 3);
    expect(result.rounds).toBe(6);
  });

  it('tier 99 throws', () => {
    expect(() => resolveWorkoutAtTier(dkbs, 99)).toThrow(
      'Tier 99 not found in template dkbs',
    );
  });

  it('tier 1 has correct metadata', () => {
    const result = resolveWorkoutAtTier(dkbs, 1);
    expect(result.templateId).toBe('dkbs');
    expect(result.name).toBe('Double KB Strength');
    expect(result.defaultRest).toBe(90);
    expect(result.zoneName).toBe('Strength Zone');
    expect(result.category).toBe('kettlebell');
  });

  it('movement with reps retains reps', () => {
    const result = resolveWorkoutAtTier(dkbs, 1);
    const clean = result.movements.find(m => m.name === 'Double Clean');
    expect(clean?.reps).toBe(5);
  });

  it('movement with duration retains duration', () => {
    const result = resolveWorkoutAtTier(dkbs, 1);
    const carry = result.movements.find(m => m.name === 'Farmer Carry');
    expect(carry?.duration).toBe(30);
  });

  it('movement with load retains load', () => {
    const result = resolveWorkoutAtTier(dkbs, 1);
    const press = result.movements.find(m => m.name === 'Double Press');
    expect(press?.load).toBe(20);
  });
});

// Section B — Armor Building Complex (sets-based)
const abc: WorkoutTemplate = {
  id: 'abc',
  name: 'Armor Building Complex',
  zoneName: 'Strength-Conditioning Zone',
  category: 'kettlebell',
  defaultRest: 60,
  tierStep: '+2 sets per tier',
  tiers: { '1': { rounds: 10 }, '2': { rounds: 12 }, '3': { rounds: 15 }, '4': { rounds: 20 } },
  movements: [
    { name: 'Double Clean', reps: 1 },
    { name: 'Press', reps: 1 },
    { name: 'Front Squat', reps: 1 },
  ],
};

describe('resolveWorkoutAtTier — ABC', () => {
  it('tier 1 returns rounds: 10', () => {
    const result = resolveWorkoutAtTier(abc, 1);
    expect(result.rounds).toBe(10);
  });

  it('tier 2 returns rounds: 12', () => {
    const result = resolveWorkoutAtTier(abc, 2);
    expect(result.rounds).toBe(12);
  });

  it('tier 4 returns rounds: 20', () => {
    const result = resolveWorkoutAtTier(abc, 4);
    expect(result.rounds).toBe(20);
  });

  it('tier 5 throws', () => {
    expect(() => resolveWorkoutAtTier(abc, 5)).toThrow(
      'Tier 5 not found in template abc',
    );
  });
});

// Section B — Swing conditioning (volume-based)
const swing: WorkoutTemplate = {
  id: 'swing-conditioning',
  name: 'Swing / Push-up Conditioning',
  zoneName: 'Conditioning Zone',
  category: 'kettlebell',
  defaultRest: 30,
  tierStep: '+1 set per tier',
  tiers: { '1': { rounds: 5 }, '2': { rounds: 6 }, '3': { rounds: 7 }, '4': { rounds: 8 } },
  movements: [
    { name: 'Two-hand Swing', reps: 10, load: 24 },
    { name: 'Push-up', reps: 10 },
  ],
};

describe('resolveWorkoutAtTier — Swing Conditioning', () => {
  it('tier 1 returns rounds: 5', () => {
    const result = resolveWorkoutAtTier(swing, 1);
    expect(result.rounds).toBe(5);
  });

  it('tier 3 returns rounds: 7', () => {
    const result = resolveWorkoutAtTier(swing, 3);
    expect(result.rounds).toBe(7);
  });
});

// Section E — tier bump propagation
describe('resolveWorkoutAtTier — tier bump propagation', () => {
  it('resolving at tier 2 after tier 1 returns different rounds — propagation works', () => {
    const t1 = resolveWorkoutAtTier(dkbs, 1);
    const t2 = resolveWorkoutAtTier(dkbs, 2);
    expect(t1.rounds).toBe(4);
    expect(t2.rounds).toBe(5);
    // All movements updated — no per-day editing needed
    expect(t1.movements.every(m => m.rounds === 4)).toBe(true);
    expect(t2.movements.every(m => m.rounds === 5)).toBe(true);
  });

  it.todo('tier bump sets baselineTier on block and resets counter — implement in ascension phase');
});
