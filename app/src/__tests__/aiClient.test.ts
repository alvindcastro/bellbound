import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateParsedNote } from '../data/ai/parseValidator.js';
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
