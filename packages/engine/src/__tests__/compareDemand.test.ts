import { describe, it, expect } from 'vitest';
import { compareDemand } from '../council/compareDemand.js';

type Snapshot = { rounds?: number; movements?: Array<{ load?: number; reps?: number; duration?: number }> };

function snap(rounds: number, movements: Array<{ load?: number; reps?: number; duration?: number }>): Snapshot {
  return { rounds, movements };
}

// Prescribed: Double KB Strength at tier 1 (4 rounds, avg load ~20)
const dkbs = snap(4, [
  { load: 20, reps: 5 },
  { load: 20, reps: 3 },
  { load: 20, reps: 5 },
  { reps: 10 },         // bodyweight push-up
  { load: 20, duration: 30 },
]);

// Single KB Strength at tier 1 (3 rounds, avg load ~16)
const skbs = snap(3, [
  { load: 16, reps: 5 },
  { load: 16, reps: 3 },
  { load: 16, reps: 5 },
  { reps: 10 },
]);

// Same workout
const dkbsEquiv = snap(4, [
  { load: 20, reps: 5 },
  { load: 20, reps: 3 },
  { load: 20, reps: 5 },
  { reps: 10 },
  { load: 20, duration: 30 },
]);

// Heavier / more volume
const harder = snap(5, [
  { load: 24, reps: 5 },
  { load: 24, reps: 3 },
  { load: 24, reps: 5 },
  { reps: 10 },
  { load: 24, duration: 30 },
]);

// ─── Core cases ───────────────────────────────────────────────────────────────

describe('compareDemand', () => {
  it('returns "easier" when actual has fewer rounds AND lower avg load', () => {
    expect(compareDemand(skbs, dkbs)).toBe('easier');
  });

  it('returns "equivalent" when rounds and load both match', () => {
    expect(compareDemand(dkbsEquiv, dkbs)).toBe('equivalent');
  });

  it('returns "harder" when actual has more rounds AND higher avg load', () => {
    expect(compareDemand(harder, dkbs)).toBe('harder');
  });

  it('returns "uncertain" when rounds and load signals conflict (fewer rounds, heavier load)', () => {
    const conflicting = snap(3, [{ load: 32, reps: 5 }, { load: 32, reps: 3 }]);
    expect(compareDemand(conflicting, dkbs)).toBe('uncertain');
  });

  it('returns "uncertain" when actual has no movement data', () => {
    expect(compareDemand({}, dkbs)).toBe('uncertain');
  });

  it('returns "uncertain" when prescribed has no movement data', () => {
    expect(compareDemand(skbs, {})).toBe('uncertain');
  });

  it('returns "equivalent" when both have no movement data (legacy logs, no swap info)', () => {
    // Legacy logs pre-Phase 15 store {} in both fields; preserve existing progression behavior.
    expect(compareDemand({}, {})).toBe('equivalent');
  });

  it('returns "easier" when rounds match but avg load is lower', () => {
    const lighterSameRounds = snap(4, [{ load: 16, reps: 5 }, { load: 16, reps: 3 }]);
    expect(compareDemand(lighterSameRounds, dkbs)).toBe('easier');
  });

  it('returns "harder" when rounds match but avg load is higher', () => {
    const heavierSameRounds = snap(4, [{ load: 32, reps: 5 }, { load: 32, reps: 3 }]);
    expect(compareDemand(heavierSameRounds, dkbs)).toBe('harder');
  });

  it('returns "easier" when fewer rounds, loads all match', () => {
    const fewerRoundsSameLoad = snap(3, [{ load: 20, reps: 5 }, { load: 20, reps: 3 }]);
    expect(compareDemand(fewerRoundsSameLoad, dkbs)).toBe('easier');
  });

  it('returns "equivalent" when only bodyweight movements (no load to compare), rounds match', () => {
    const bwActual = snap(4, [{ reps: 10 }, { reps: 10 }]);
    const bwPrescribed = snap(4, [{ reps: 10 }, { reps: 10 }]);
    expect(compareDemand(bwActual, bwPrescribed)).toBe('equivalent');
  });
});

// ─── Conservative safeguard ───────────────────────────────────────────────────

describe('compareDemand — conservative: uncertain never advances progression', () => {
  it('uncertain result is NOT equivalent or harder', () => {
    const result = compareDemand({}, dkbs);
    expect(result).toBe('uncertain');
    expect(result).not.toBe('equivalent');
    expect(result).not.toBe('harder');
  });
});
