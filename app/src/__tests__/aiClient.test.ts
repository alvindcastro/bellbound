import { describe, it, expect, beforeEach } from 'vitest';
import { validateParsedNote, validateParsedMovements } from '../data/ai/parseValidator.js';
import { isAiEnabled, setAiEnabled, _resetAiSettings } from '../data/ai/aiSettings.js';
import { noOpAiClient } from '../data/ai/noOpAiClient.js';
import { getAiClient } from '../data/ai/index.js';

// ---------------------------------------------------------------------------
// parseValidator
// ---------------------------------------------------------------------------

describe('validateParsedNote', () => {
  it('returns ParsedNote for a valid full object', () => {
    const result = validateParsedNote({
      difficulty: 'normal',
      pressGrindy: false,
      breathless: true,
      gripCooked: false,
      legsSore: true,
    });
    expect(result).toEqual({
      difficulty: 'normal',
      pressGrindy: false,
      breathless: true,
      gripCooked: false,
      legsSore: true,
    });
  });

  it('returns null for a wrong difficulty value', () => {
    expect(
      validateParsedNote({
        difficulty: 'medium',
        pressGrindy: false,
        breathless: false,
        gripCooked: false,
        legsSore: false,
      }),
    ).toBeNull();
  });

  it('returns null when a signal field is missing', () => {
    expect(
      validateParsedNote({
        difficulty: 'easy',
        pressGrindy: true,
        breathless: false,
        gripCooked: false,
        // legsSore missing
      }),
    ).toBeNull();
  });

  it('returns null when a signal field is the wrong type (string instead of boolean)', () => {
    expect(
      validateParsedNote({
        difficulty: 'hard',
        pressGrindy: 'yes',
        breathless: false,
        gripCooked: false,
        legsSore: false,
      }),
    ).toBeNull();
  });

  it('still validates when extra fields are present', () => {
    const result = validateParsedNote({
      difficulty: 'easy',
      pressGrindy: false,
      breathless: false,
      gripCooked: false,
      legsSore: false,
      extraField: 'ignored',
    });
    expect(result).not.toBeNull();
    expect(result?.difficulty).toBe('easy');
  });

  it('returns null for null input', () => {
    expect(validateParsedNote(null)).toBeNull();
  });

  it('returns null for non-object input', () => {
    expect(validateParsedNote('easy')).toBeNull();
    expect(validateParsedNote(42)).toBeNull();
    expect(validateParsedNote(undefined)).toBeNull();
  });

  it('accepts "failed" as a valid difficulty', () => {
    const result = validateParsedNote({
      difficulty: 'failed',
      pressGrindy: false,
      breathless: false,
      gripCooked: false,
      legsSore: false,
    });
    expect(result?.difficulty).toBe('failed');
  });

  it('returns null when pressGrindy is not boolean', () => {
    expect(
      validateParsedNote({ difficulty: 'easy', pressGrindy: 1, breathless: false, gripCooked: false, legsSore: false }),
    ).toBeNull();
  });

  it('returns null when breathless is not boolean', () => {
    expect(
      validateParsedNote({ difficulty: 'easy', pressGrindy: false, breathless: 1, gripCooked: false, legsSore: false }),
    ).toBeNull();
  });

  it('returns null when gripCooked is not boolean', () => {
    expect(
      validateParsedNote({ difficulty: 'easy', pressGrindy: false, breathless: false, gripCooked: 1, legsSore: false }),
    ).toBeNull();
  });

  it('returns null when legsSore is not boolean', () => {
    expect(
      validateParsedNote({ difficulty: 'easy', pressGrindy: false, breathless: false, gripCooked: false, legsSore: 1 }),
    ).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// aiSettings
// ---------------------------------------------------------------------------

describe('aiSettings', () => {
  beforeEach(() => {
    _resetAiSettings();
  });

  it('defaults to false', () => {
    expect(isAiEnabled()).toBe(false);
  });

  it('setAiEnabled(true) makes isAiEnabled() return true', () => {
    setAiEnabled(true);
    expect(isAiEnabled()).toBe(true);
  });

  it('setAiEnabled(false) makes isAiEnabled() return false', () => {
    setAiEnabled(true);
    setAiEnabled(false);
    expect(isAiEnabled()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// noOpAiClient
// ---------------------------------------------------------------------------

describe('noOpAiClient', () => {
  it('isEnabled() returns false', () => {
    expect(noOpAiClient.isEnabled()).toBe(false);
  });

  it('parseNote returns null', async () => {
    expect(await noOpAiClient.parseNote('felt good')).toBeNull();
  });

  it('generateLore returns null', async () => {
    expect(await noOpAiClient.generateLore({ date: '2026-06-15', classification: 'kb' })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// validateParsedMovements
// ---------------------------------------------------------------------------

describe('validateParsedMovements', () => {
  it('returns empty array for empty array input', () => {
    expect(validateParsedMovements([])).toEqual([]);
  });

  it('returns null for non-array input', () => {
    expect(validateParsedMovements(null)).toBeNull();
    expect(validateParsedMovements('foo')).toBeNull();
    expect(validateParsedMovements(42)).toBeNull();
    expect(validateParsedMovements({})).toBeNull();
  });

  it('returns valid array with all required fields', () => {
    const raw = [{ name: 'Swing', sets: 3, eachSide: false }];
    const result = validateParsedMovements(raw);
    expect(result).toEqual([{ name: 'Swing', sets: 3, eachSide: false }]);
  });

  it('returns null when name is missing', () => {
    expect(validateParsedMovements([{ sets: 3, eachSide: false }])).toBeNull();
  });

  it('returns null when name is not a string', () => {
    expect(validateParsedMovements([{ name: 42, sets: 3, eachSide: false }])).toBeNull();
  });

  it('returns null when sets is missing', () => {
    expect(validateParsedMovements([{ name: 'Swing', eachSide: false }])).toBeNull();
  });

  it('returns null when sets is not a positive integer', () => {
    expect(validateParsedMovements([{ name: 'Swing', sets: 0, eachSide: false }])).toBeNull();
    expect(validateParsedMovements([{ name: 'Swing', sets: -1, eachSide: false }])).toBeNull();
    expect(validateParsedMovements([{ name: 'Swing', sets: 1.5, eachSide: false }])).toBeNull();
    expect(validateParsedMovements([{ name: 'Swing', sets: 'three', eachSide: false }])).toBeNull();
  });

  it('returns null when eachSide is missing', () => {
    expect(validateParsedMovements([{ name: 'Swing', sets: 3 }])).toBeNull();
  });

  it('returns null when eachSide is not boolean', () => {
    expect(validateParsedMovements([{ name: 'Swing', sets: 3, eachSide: 'yes' }])).toBeNull();
  });

  it('preserves optional numeric fields', () => {
    const raw = [{ name: 'Press', sets: 3, reps: 5, repMax: 8, duration: 30, load: 24, loadFallback: 16, eachSide: true }];
    const result = validateParsedMovements(raw);
    expect(result).toEqual([{ name: 'Press', sets: 3, reps: 5, repMax: 8, duration: 30, load: 24, loadFallback: 16, eachSide: true }]);
  });

  it('tolerates extra fields', () => {
    const raw = [{ name: 'Swing', sets: 3, eachSide: false, foo: 'bar' }];
    const result = validateParsedMovements(raw);
    expect(result).not.toBeNull();
    expect(result![0]!.name).toBe('Swing');
  });

  it('returns null if any item in array is invalid', () => {
    const raw = [
      { name: 'Swing', sets: 3, eachSide: false },
      { name: 'Press', sets: 'bad', eachSide: true },
    ];
    expect(validateParsedMovements(raw)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// noOpAiClient.parseWorkoutLines
// ---------------------------------------------------------------------------

describe('noOpAiClient.parseWorkoutLines', () => {
  it('returns null for any input', async () => {
    expect(await noOpAiClient.parseWorkoutLines(['swing 3x10'])).toBeNull();
    expect(await noOpAiClient.parseWorkoutLines([])).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getAiClient factory
// ---------------------------------------------------------------------------

describe('getAiClient', () => {
  beforeEach(() => {
    _resetAiSettings();
  });

  it('returns noOp when AI is disabled', () => {
    const client = getAiClient({ online: true });
    expect(client.isEnabled()).toBe(false);
  });

  it('returns noOp when AI is enabled but offline', () => {
    setAiEnabled(true);
    const client = getAiClient({ online: false });
    expect(client.isEnabled()).toBe(false);
  });

  it('returns a live client (isEnabled true) when AI is enabled and online', () => {
    setAiEnabled(true);
    const client = getAiClient({ online: true });
    expect(client.isEnabled()).toBe(true);
  });
});
