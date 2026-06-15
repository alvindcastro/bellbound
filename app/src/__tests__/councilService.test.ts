import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../data/db/bellboundDb.js';
import { seed } from '../data/seed.js';
import { workoutLogRepository } from '../data/repositories/workoutLogRepository.js';
import { buildWorkoutLog } from '../services/buildWorkoutLog.js';
import { getRecommendationForTemplate } from '../services/councilService.js';
import type { StatusEffectRow } from '../data/db/bellboundDb.js';

const dkbsContext = {
  date: '2026-06-15',
  blockId: 'block-1',
  plannedDayType: 'kb' as const,
  actualDayType: 'kb' as const,
  templateId: 'dkbs',
  templateName: 'Double KB Strength',
  category: 'kettlebell',
};

beforeEach(async () => {
  await db.open();
  await seed('2026-06-14');
});

afterEach(async () => {
  await db.delete();
});

describe('getRecommendationForTemplate', () => {
  it('returns maintain when no logs exist for the template', async () => {
    const rec = await getRecommendationForTemplate('dkbs');
    expect(rec.kind).toBe('maintain');
  });

  it('returns progress when 2 normal logs with no signals exist', async () => {
    const log1 = buildWorkoutLog(
      { status: 'completed', roundsCompleted: 4, difficulty: 'normal', note: '' },
      { ...dkbsContext, date: '2026-06-14' },
    );
    const log2 = buildWorkoutLog(
      { status: 'completed', roundsCompleted: 4, difficulty: 'normal', note: '' },
      { ...dkbsContext, date: '2026-06-15' },
    );
    await workoutLogRepository.add(log1);
    await workoutLogRepository.add(log2);
    const rec = await getRecommendationForTemplate('dkbs');
    expect(rec.kind).toBe('progress');
  });

  it('returns reduce when most recent log has difficulty failed', async () => {
    const log = buildWorkoutLog(
      { status: 'completed', roundsCompleted: 2, difficulty: 'failed', note: '' },
      { ...dkbsContext, date: '2026-06-15' },
    );
    await workoutLogRepository.add(log);
    const rec = await getRecommendationForTemplate('dkbs');
    expect(rec.kind).toBe('reduce');
  });

  it('returns hold_pressing when a non-expired Press Gremlin is in the DB', async () => {
    // Press Gremlin expires 'after_next_session' — no logs after createdDate → not expired
    const today = new Date().toISOString().slice(0, 10);
    const row: StatusEffectRow = {
      id: 'pg-1',
      name: 'Press Gremlin',
      source: 'pressGrindy',
      recommendationEffect: 'hold_pressing',
      expiryType: 'after_next_session',
      expiryParam: null,
      createdDate: today,
    };
    await db.statusEffects.add(row);
    const rec = await getRecommendationForTemplate('dkbs');
    expect(rec.kind).toBe('hold_pressing');
  });

  it('ignores expired effects (Grip Curse with after_n_days=2 created 10 days ago)', async () => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 10);
    const tenDaysAgo = d.toISOString().slice(0, 10);
    const row: StatusEffectRow = {
      id: 'gc-1',
      name: 'Grip Curse',
      source: 'gripCooked',
      recommendationEffect: 'hold_carry',
      expiryType: 'after_n_days',
      expiryParam: 2,
      createdDate: tenDaysAgo,
    };
    await db.statusEffects.add(row);
    const rec = await getRecommendationForTemplate('dkbs');
    expect(rec.kind).toBe('maintain'); // expired, no logs, so maintain
  });
});
