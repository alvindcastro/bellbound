import type { ParsedNote } from './types.js';

const VALID_DIFFICULTIES = new Set(['easy', 'normal', 'hard', 'failed']);

export function validateParsedNote(raw: unknown): ParsedNote | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  const obj = raw as Record<string, unknown>;

  if (!VALID_DIFFICULTIES.has(obj['difficulty'] as string)) {
    return null;
  }

  for (const field of ['pressGrindy', 'breathless', 'gripCooked', 'legsSore'] as const) {
    if (typeof obj[field] !== 'boolean') {
      return null;
    }
  }

  return {
    difficulty: obj['difficulty'] as ParsedNote['difficulty'],
    pressGrindy: obj['pressGrindy'] as boolean,
    breathless: obj['breathless'] as boolean,
    gripCooked: obj['gripCooked'] as boolean,
    legsSore: obj['legsSore'] as boolean,
  };
}
