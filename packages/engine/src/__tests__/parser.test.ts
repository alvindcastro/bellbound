import { describe, it, expect } from 'vitest';
import { parseWorkoutText } from '../parser/parseWorkoutText.js';

// ─── Movements ────────────────────────────────────────────────────────────────

describe('parseWorkoutText — single load', () => {
  it('parses "Single-arm clean 24 kg 3x5 each side"', () => {
    const r = parseWorkoutText('Single-arm clean 24 kg 3x5 each side');
    expect(r.movements).toHaveLength(1);
    expect(r.movements[0]).toMatchObject({
      name: 'Single-arm clean',
      load: 24,
      sets: 3,
      reps: 5,
      eachSide: true,
    });
    expect(r.movements[0]?.loadFallback).toBeUndefined();
    expect(r.unparsedLines).toHaveLength(0);
  });

  it('parses "Goblet squat 24 kg 3x8"', () => {
    const r = parseWorkoutText('Goblet squat 24 kg 3x8');
    expect(r.movements[0]).toMatchObject({ name: 'Goblet squat', load: 24, sets: 3, reps: 8, eachSide: false });
  });

  it('accepts "kgs" as well as "kg"', () => {
    const r = parseWorkoutText('Press 24 kgs 3x5');
    expect(r.movements[0]).toMatchObject({ load: 24 });
  });

  it('parses bodyweight movement (no load) "Push-ups 3x8-10"', () => {
    const r = parseWorkoutText('Push-ups 3x8-10');
    expect(r.movements[0]).toMatchObject({ name: 'Push-ups', sets: 3, reps: 8, repMax: 10, eachSide: false });
    expect(r.movements[0]?.load).toBeUndefined();
  });

  it('parses bodyweight movement with single rep count "Push-ups 3x10"', () => {
    const r = parseWorkoutText('Push-ups 3x10');
    expect(r.movements[0]).toMatchObject({ name: 'Push-ups', sets: 3, reps: 10 });
    expect(r.movements[0]?.repMax).toBeUndefined();
  });
});

describe('parseWorkoutText — primary-or-fallback loads', () => {
  it('parses "Single-arm press 24 or 16 kg 3x3 each side"', () => {
    const r = parseWorkoutText('Single-arm press 24 or 16 kg 3x3 each side');
    expect(r.movements[0]).toMatchObject({ name: 'Single-arm press', load: 24, loadFallback: 16, sets: 3, reps: 3, eachSide: true });
  });

  it('parses "Goblet squat 16 or 24 kg 3x8"', () => {
    const r = parseWorkoutText('Goblet squat 16 or 24 kg 3x8');
    expect(r.movements[0]).toMatchObject({ name: 'Goblet squat', load: 16, loadFallback: 24, sets: 3, reps: 8 });
  });

  it('preserves the primary-or-fallback order exactly — first number is primary', () => {
    const r = parseWorkoutText('Press 32 or 24 kg 3x5');
    expect(r.movements[0]?.load).toBe(32);
    expect(r.movements[0]?.loadFallback).toBe(24);
  });
});

describe('parseWorkoutText — time-based movements', () => {
  it('parses "Suitcase carry 24 kg 3x30 sec each side"', () => {
    const r = parseWorkoutText('Suitcase carry 24 kg 3x30 sec each side');
    expect(r.movements[0]).toMatchObject({ name: 'Suitcase carry', load: 24, sets: 3, duration: 30, eachSide: true });
    expect(r.movements[0]?.reps).toBeUndefined();
  });

  it('parses "Farmer carry 24 kg 3x60 sec"', () => {
    const r = parseWorkoutText('Farmer carry 24 kg 3x60 sec');
    expect(r.movements[0]).toMatchObject({ name: 'Farmer carry', load: 24, sets: 3, duration: 60, eachSide: false });
  });
});

describe('parseWorkoutText — grammar variants', () => {
  it('accepts "×" (unicode) as separator', () => {
    const r = parseWorkoutText('Press 24 kg 3×5');
    expect(r.movements[0]).toMatchObject({ sets: 3, reps: 5 });
  });

  it('accepts "e/s" as "each side"', () => {
    const r = parseWorkoutText('Clean 24 kg 3x5 e/s');
    expect(r.movements[0]?.eachSide).toBe(true);
  });

  it('accepts "per side" as "each side"', () => {
    const r = parseWorkoutText('Row 24 kg 3x8 per side');
    expect(r.movements[0]?.eachSide).toBe(true);
  });

  it('is case-insensitive for "each side"', () => {
    const r = parseWorkoutText('Clean 24 kg 3x5 Each Side');
    expect(r.movements[0]?.eachSide).toBe(true);
  });
});

// ─── Rest lines ───────────────────────────────────────────────────────────────

describe('parseWorkoutText — rest lines', () => {
  it('parses "Rest 60-90 sec after full round" as defaultRest (not a movement)', () => {
    const r = parseWorkoutText('Rest 60-90 sec after full round');
    expect(r.movements).toHaveLength(0);
    expect(r.defaultRest).toBe(60);
    expect(r.unparsedLines).toHaveLength(0);
  });

  it('parses "Rest 90 sec" as defaultRest', () => {
    const r = parseWorkoutText('Rest 90 sec');
    expect(r.movements).toHaveLength(0);
    expect(r.defaultRest).toBe(90);
  });
});

// ─── Multi-line input ─────────────────────────────────────────────────────────

describe('parseWorkoutText — multi-line', () => {
  it('parses the full Single KB Strength workout', () => {
    const text = [
      'Single-arm clean 24 kg 3x5 each side',
      'Single-arm press 24 or 16 kg 3x3 each side',
      'Goblet squat 16 or 24 kg 3x8',
      'One-arm row 24 kg 3x8-10 each side',
      'Push-ups 3x8-10',
      'Suitcase carry 24 kg 3x30 sec each side',
      'Rest 60-90 sec after full round',
    ].join('\n');

    const r = parseWorkoutText(text);
    expect(r.movements).toHaveLength(6);
    expect(r.defaultRest).toBe(60);
    expect(r.unparsedLines).toHaveLength(0);

    expect(r.movements[0]).toMatchObject({ name: 'Single-arm clean', load: 24, sets: 3, reps: 5, eachSide: true });
    expect(r.movements[1]).toMatchObject({ load: 24, loadFallback: 16, reps: 3, eachSide: true });
    expect(r.movements[2]).toMatchObject({ load: 16, loadFallback: 24, reps: 8, eachSide: false });
    expect(r.movements[4]).toMatchObject({ name: 'Push-ups', reps: 8, repMax: 10 });
    expect(r.movements[5]).toMatchObject({ duration: 30, eachSide: true });
  });

  it('skips blank lines silently', () => {
    const r = parseWorkoutText('Press 24 kg 3x5\n\nSquat 24 kg 3x8');
    expect(r.movements).toHaveLength(2);
  });

  it('flags non-parseable lines in unparsedLines', () => {
    const r = parseWorkoutText('Press 24 kg 3x5\nthis is definitely not a movement pattern at all');
    expect(r.movements).toHaveLength(1);
    expect(r.unparsedLines).toContain('this is definitely not a movement pattern at all');
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('parseWorkoutText — edge cases', () => {
  it('returns empty result for empty string', () => {
    const r = parseWorkoutText('');
    expect(r.movements).toHaveLength(0);
    expect(r.unparsedLines).toHaveLength(0);
  });

  it('parses movement with rep range and each side', () => {
    const r = parseWorkoutText('One-arm row 24 kg 3x8-10 each side');
    expect(r.movements[0]).toMatchObject({ name: 'One-arm row', load: 24, sets: 3, reps: 8, repMax: 10, eachSide: true });
  });
});
