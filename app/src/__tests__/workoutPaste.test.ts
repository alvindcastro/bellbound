import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../data/db/bellboundDb.js';
import { workoutTemplateRepository } from '../data/repositories/workoutTemplateRepository.js';
import { saveParsedTemplate } from '../services/parsedTemplateService.js';
import type { ParsedMovement } from '@bellbound/engine';

const movements: ParsedMovement[] = [
  { name: 'Single-arm clean', sets: 3, reps: 5, load: 24, eachSide: true },
  { name: 'Single-arm press', sets: 3, reps: 3, load: 24, loadFallback: 16, eachSide: true },
  { name: 'Push-ups', sets: 3, reps: 8, repMax: 10, eachSide: false },
];

beforeEach(async () => { await db.open(); });
afterEach(async () => { await db.delete(); });

describe('saveParsedTemplate', () => {
  it('saves a parsed workout as a WorkoutTemplate readable by the repository', async () => {
    const id = await saveParsedTemplate('My Custom KB', movements, 90);
    const saved = await workoutTemplateRepository.getById(id);
    expect(saved).not.toBeNull();
    expect(saved!.name).toBe('My Custom KB');
    expect(saved!.category).toBe('kettlebell');
  });

  it('stores movements with loadFallback preserved', async () => {
    const id = await saveParsedTemplate('My KB', movements, 60);
    const saved = await workoutTemplateRepository.getById(id);
    const press = saved!.movements.find(m => m.name === 'Single-arm press');
    expect(press?.load).toBe(24);
    expect(press?.loadFallback).toBe(16);
  });

  it('saved template appears in listKettlebell()', async () => {
    await saveParsedTemplate('Pasted KB', movements, 90);
    const all = await workoutTemplateRepository.listKettlebell();
    expect(all.some(t => t.name === 'Pasted KB')).toBe(true);
  });

  it('saved template has a single fixed tier at tier 1', async () => {
    const id = await saveParsedTemplate('Pasted KB', movements, 90);
    const saved = await workoutTemplateRepository.getById(id);
    expect(saved!.tiers['1']).toBeDefined();
    expect(saved!.tiers['1']?.rounds).toBe(movements[0]?.sets ?? 3);
  });
});
