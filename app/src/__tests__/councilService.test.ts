import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../data/db/bellboundDb.js';
import { seed } from '../data/seed.js';
import { workoutLogRepository } from '../data/repositories/workoutLogRepository.js';
import { buildWorkoutLog } from '../services/buildWorkoutLog.js';
import { getRecommendationForTemplate } from '../services/councilService.js';

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
});
