import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../data/db/bellboundDb.js';
import { generateAndStoreLore } from '../services/loreService.js';
import { noOpAiClient } from '../data/ai/noOpAiClient.js';
import { getAiClient, setAiEnabled, _resetAiSettings } from '../data/ai/index.js';
import { getRecommendationForTemplate } from '../services/councilService.js';
import type { WorkoutLog } from '@bellbound/engine';

const mockLog: WorkoutLog = {
  id: 'log-1',
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

beforeEach(async () => {
  _resetAiSettings();
  await db.open();
});
afterEach(async () => { await db.delete(); });

describe('guardrails: AI confined to lore', () => {
  it('getRecommendationForTemplate has no AiClient parameter', () => {
    // councilService.getRecommendationForTemplate takes (templateId: string)
    // Verifying the module exports a function with no AI parameter is sufficient.
    expect(typeof getRecommendationForTemplate).toBe('function');
    // It takes one string parameter — calling without AiClient is normal usage
    expect(getRecommendationForTemplate.length).toBe(1);
  });

  it('AI disabled: parseNote returns null (no schema pollution)', async () => {
    setAiEnabled(false);
    const client = getAiClient({ online: true });
    const parsed = await client.parseNote('felt grindy, legs heavy');
    expect(parsed).toBeNull();
  });

  it('AI disabled: generateLore returns null (fallback required)', async () => {
    setAiEnabled(false);
    const client = getAiClient({ online: true });
    const lore = await client.generateLore({ date: '2026-06-15', classification: 'kb' });
    expect(lore).toBeNull();
  });

  it('loreService always returns a string even with no-op client', async () => {
    const text = await generateAndStoreLore(mockLog, noOpAiClient);
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
  });

  it('generating lore does not affect the shape of AiClient passed to it', async () => {
    // Prove AI output is siloed: the client we pass in is unmodified after the call
    const before = JSON.stringify(noOpAiClient);
    await generateAndStoreLore(mockLog, noOpAiClient);
    const after = JSON.stringify(noOpAiClient);
    expect(before).toBe(after);
  });
});
