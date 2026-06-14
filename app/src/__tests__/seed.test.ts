import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../data/db/bellboundDb.js';
import { seed } from '../data/seed.js';

beforeEach(async () => {
  await db.open();
});

afterEach(async () => {
  await db.delete();
});

describe('seed', () => {
  it('writes a character on first run', async () => {
    await seed('2026-06-14');
    const char = await db.characters.get('player-1');
    expect(char).not.toBeUndefined();
    expect(char?.characterName).toBe('Adventurer');
    expect(char?.level).toBe(1);
    expect(char?.stats.strength).toBe(0);
    expect(char?.stats.conditioning).toBe(0);
    expect(char?.stats.control).toBe(0);
    expect(char?.stats.consistency).toBe(0);
    expect(char?.stats.recovery).toBe(0);
    expect(char?.stats.judgment).toBe(0);
  });

  it('writes the default week template on first run', async () => {
    await seed('2026-06-14');
    const wt = await db.weekTemplates.get('default');
    expect(wt).not.toBeUndefined();
    expect(wt?.days['monday']).toBe('kb');
    expect(wt?.days['tuesday']).toBe('kb');
    expect(wt?.days['wednesday']).toBe('rest');
    expect(wt?.days['thursday']).toBe('kb');
    expect(wt?.days['friday']).toBe('kb');
    expect(wt?.days['saturday']).toBe('free');
    expect(wt?.days['sunday']).toBe('rest');
  });

  it('writes an active block at tier 1 on first run', async () => {
    await seed('2026-06-14');
    const block = await db.blocks.get('block-1');
    expect(block).not.toBeUndefined();
    expect(block?.baselineTier).toBe(1);
    expect(block?.status).toBe('active');
    expect(block?.testGuardMinSessions).toBe(6);
    expect(block?.completedPlannedKbSessions).toBe(0);
    expect(block?.startDate).toBe('2026-06-14');
  });

  it('writes the Double KB Strength template with correct tiers', async () => {
    await seed('2026-06-14');
    const tmpl = await db.workoutTemplates.get('dkbs');
    expect(tmpl).not.toBeUndefined();
    expect(tmpl?.name).toBe('Double KB Strength');
    expect(tmpl?.tiers['1']?.rounds).toBe(4);
    expect(tmpl?.tiers['2']?.rounds).toBe(5);
    expect(tmpl?.tiers['3']?.rounds).toBe(6);
  });

  it('writes all five movements on the workout template', async () => {
    await seed('2026-06-14');
    const tmpl = await db.workoutTemplates.get('dkbs');
    expect(tmpl?.movements).toHaveLength(5);
    expect(tmpl?.movements[0]?.name).toBe('Double Clean');
    expect(tmpl?.movements[0]?.reps).toBe(5);
    expect(tmpl?.movements[0]?.load).toBe(20);
    expect(tmpl?.movements[1]?.name).toBe('Double Press');
    expect(tmpl?.movements[1]?.reps).toBe(3);
    expect(tmpl?.movements[2]?.name).toBe('Double Front Squat');
    expect(tmpl?.movements[2]?.reps).toBe(5);
    expect(tmpl?.movements[3]?.name).toBe('Push-ups');
    expect(tmpl?.movements[3]?.reps).toBe(10);
    expect(tmpl?.movements[3]?.load).toBeUndefined();
    expect(tmpl?.movements[4]?.name).toBe('Farmer Carry');
    expect(tmpl?.movements[4]?.duration).toBe(30);
    expect(tmpl?.movements[4]?.load).toBe(20);
  });

  it('is idempotent: calling seed twice does not duplicate records', async () => {
    await seed('2026-06-14');
    await seed('2026-06-14');
    expect(await db.characters.count()).toBe(1);
    expect(await db.weekTemplates.count()).toBe(1);
    expect(await db.blocks.count()).toBe(1);
    expect(await db.workoutTemplates.count()).toBe(1);
  });

  it('does not overwrite data that already exists', async () => {
    await seed('2026-06-14');
    await db.characters.update('player-1', { characterName: 'CustomName' });
    await seed('2026-06-15');
    const char = await db.characters.get('player-1');
    expect(char?.characterName).toBe('CustomName');
  });
});
