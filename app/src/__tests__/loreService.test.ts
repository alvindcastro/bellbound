import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../data/db/bellboundDb.js';
import { generateAndStoreLore } from '../services/loreService.js';
import { noOpAiClient } from '../data/ai/noOpAiClient.js';
import type { WorkoutLog } from '@bellbound/engine';

const mockLog: WorkoutLog = {
  id: 'log-test-1',
  date: '2026-06-15',
  blockId: 'block-1',
  plannedDayType: 'kb',
  actualDayType: 'kb',
  source: 'planned',
  category: 'strength',
  plannedWorkout: {},
  actualWorkout: {},
  status: 'completed',
  difficulty: 'normal',
  signals: { pressGrindy: false, breathless: false, gripCooked: false, legsSore: false },
  originalNote: '',
  structuredNotes: {},
};

beforeEach(async () => { await db.open(); });
afterEach(async () => { await db.delete(); });

describe('generateAndStoreLore', () => {
  it('does not mutate the log', async () => {
    const before = JSON.stringify(mockLog);
    await generateAndStoreLore(mockLog, noOpAiClient);
    expect(JSON.stringify(mockLog)).toBe(before);
  });

  it('returns a non-empty string when AI is disabled (deterministic fallback)', async () => {
    const text = await generateAndStoreLore(mockLog, noOpAiClient);
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
  });

  it('stores a lore entry linked to the log', async () => {
    await generateAndStoreLore(mockLog, noOpAiClient);
    const entry = await db.lore.where('logId').equals(mockLog.id).first();
    expect(entry).not.toBeNull();
    expect(entry!.logId).toBe(mockLog.id);
    expect(entry!.source).toBe('deterministic');
  });

  it('uses deterministic source when AI client is no-op', async () => {
    await generateAndStoreLore(mockLog, noOpAiClient);
    const entry = await db.lore.where('logId').equals(mockLog.id).first();
    expect(entry!.source).toBe('deterministic');
  });

  it('is idempotent: calling twice does not throw', async () => {
    await generateAndStoreLore(mockLog, noOpAiClient);
    await expect(generateAndStoreLore(mockLog, noOpAiClient)).resolves.toBeDefined();
  });
});
