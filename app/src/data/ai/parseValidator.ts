import type { ParsedNote } from './types.js';
import type { ParsedMovement } from '@bellbound/engine';

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

function isPositiveInteger(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v > 0;
}

function parseOptionalNumber(v: unknown): number | undefined {
  if (v === undefined) return undefined;
  if (typeof v === 'number') return v;
  return undefined;
}

export function validateParsedMovements(raw: unknown): ParsedMovement[] | null {
  if (!Array.isArray(raw)) return null;

  const result: ParsedMovement[] = [];

  for (const item of raw) {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) return null;

    const obj = item as Record<string, unknown>;

    if (typeof obj['name'] !== 'string') return null;
    if (!isPositiveInteger(obj['sets'])) return null;
    if (typeof obj['eachSide'] !== 'boolean') return null;

    const movement: ParsedMovement = {
      name: obj['name'],
      sets: obj['sets'] as number,
      eachSide: obj['eachSide'],
    };

    const reps = parseOptionalNumber(obj['reps']);
    if (reps !== undefined) movement.reps = reps;

    const repMax = parseOptionalNumber(obj['repMax']);
    if (repMax !== undefined) movement.repMax = repMax;

    const duration = parseOptionalNumber(obj['duration']);
    if (duration !== undefined) movement.duration = duration;

    const load = parseOptionalNumber(obj['load']);
    if (load !== undefined) movement.load = load;

    const loadFallback = parseOptionalNumber(obj['loadFallback']);
    if (loadFallback !== undefined) movement.loadFallback = loadFallback;

    result.push(movement);
  }

  return result;
}
