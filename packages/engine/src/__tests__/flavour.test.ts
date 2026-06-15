import { describe, it, expect } from 'vitest';
import { getZoneName } from '../flavour/zones.js';
import { getEncounterText } from '../flavour/encounterText.js';
import { getCompletionMessage } from '../flavour/completionMessages.js';
import { getCharacterClass, CHARACTER_CLASSES } from '../flavour/characterClasses.js';

describe('getZoneName', () => {
  it('returns the zone name when provided', () => {
    expect(getZoneName('The Double-Bell Gate')).toBe('The Double-Bell Gate');
  });

  it('returns Unknown Territory for undefined', () => {
    expect(getZoneName(undefined)).toBe('Unknown Territory');
  });

  it('returns Unknown Territory for null', () => {
    expect(getZoneName(null)).toBe('Unknown Territory');
  });

  it('returns Unknown Territory for empty string', () => {
    expect(getZoneName('')).toBe('Unknown Territory');
  });
});

describe('getEncounterText', () => {
  it('returns the correct line for Double Press', () => {
    expect(getEncounterText('Double Press')).toBe('You press the bells overhead. The ceiling remains unimpressed.');
  });

  it('returns empty string for unknown movement', () => {
    expect(getEncounterText('unknown movement')).toBe('');
  });

  it('returns the correct line for Two-hand Swing', () => {
    expect(getEncounterText('Two-hand Swing')).toBe('The bell arcs. Power from the hips, not the ceiling.');
  });
});

describe('getCompletionMessage', () => {
  it('returns the completed line for kb + completed', () => {
    expect(getCompletionMessage('kb', 'completed')).toBe('You completed the workout. The bells remain unemployed.');
  });

  it('returns the modified line for kb + modified', () => {
    expect(getCompletionMessage('kb', 'modified')).toBe('You completed a modified session. The bells accept this, narrowly.');
  });

  it('returns the skipped line for kb + skipped', () => {
    expect(getCompletionMessage('kb', 'skipped')).toBe('Session logged as skipped. The bells noted it without comment.');
  });

  it('returns the default line for kb + unknown status', () => {
    expect(getCompletionMessage('kb', 'something-else')).toBe('Session logged. The clerk makes a note.');
  });

  it('returns the rest line for rest day type', () => {
    expect(getCompletionMessage('rest')).toBe('You rested. This confused the goblins but pleased your joints.');
  });

  it('returns the free line for free day type', () => {
    expect(getCompletionMessage('free')).toBe('Free day recorded. The ledger is satisfied.');
  });
});

describe('getCharacterClass', () => {
  it('returns Bellbarian for bellbarian id', () => {
    expect(getCharacterClass('bellbarian').displayName).toBe('Bellbarian');
  });

  it('returns Program Warlock for program-warlock id', () => {
    expect(getCharacterClass('program-warlock').displayName).toBe('Program Warlock');
  });

  it('returns bellbarian as default for unknown id', () => {
    expect(getCharacterClass('unknown').id).toBe('bellbarian');
  });

  it('CHARACTER_CLASSES has exactly 5 entries', () => {
    expect(CHARACTER_CLASSES).toHaveLength(5);
  });
});
