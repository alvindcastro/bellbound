import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../data/db/bellboundDb.js';
import { seed } from '../data/seed.js';
import { serializeDb } from '../data/backup/exportData.js';
import { deserializeAndRestore, importFromJson } from '../data/backup/importData.js';

beforeEach(async () => {
  await db.open();
});

afterEach(async () => {
  await db.delete();
});

describe('serializeDb', () => {
  it('returns a backup object with version and exportedAt', async () => {
    await seed('2026-06-14');
    const backup = await serializeDb();
    expect(backup.version).toBe(1);
    expect(backup.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('includes data from all seven tables', async () => {
    await seed('2026-06-14');
    const backup = await serializeDb();
    const keys = Object.keys(backup.tables).sort();
    expect(keys).toEqual([
      'blocks',
      'characters',
      'dailyContext',
      'statusEffects',
      'weekTemplates',
      'workoutLogs',
      'workoutTemplates',
    ]);
  });

  it('captures seeded records correctly', async () => {
    await seed('2026-06-14');
    const backup = await serializeDb();
    expect(backup.tables.characters).toHaveLength(1);
    expect(backup.tables.characters[0]?.userId).toBe('player-1');
    expect(backup.tables.blocks).toHaveLength(1);
    expect(backup.tables.blocks[0]?.status).toBe('active');
    expect(backup.tables.weekTemplates).toHaveLength(1);
    expect(backup.tables.workoutTemplates).toHaveLength(5);
    const dkbs = backup.tables.workoutTemplates.find((t: { name: string }) => t.name === 'Double KB Strength');
    expect(dkbs).toBeDefined();
  });

  it('exports empty tables as empty arrays', async () => {
    await seed('2026-06-14');
    const backup = await serializeDb();
    expect(backup.tables.workoutLogs).toHaveLength(0);
    expect(backup.tables.dailyContext).toHaveLength(0);
    expect(backup.tables.statusEffects).toHaveLength(0);
  });
});

describe('deserializeAndRestore', () => {
  it('restores all records into a fresh db', async () => {
    await seed('2026-06-14');
    const backup = await serializeDb();

    await db.delete();
    await db.open();

    await deserializeAndRestore(backup);

    expect(await db.characters.count()).toBe(1);
    expect(await db.blocks.count()).toBe(1);
    expect(await db.weekTemplates.count()).toBe(1);
    expect(await db.workoutTemplates.count()).toBe(5);
    expect((await db.characters.get('player-1'))?.characterName).toBe('Adventurer');
    expect((await db.workoutTemplates.get('dkbs'))?.tiers['1']?.rounds).toBe(4);
  });

  it('replaces existing data — extra records are wiped', async () => {
    await seed('2026-06-14');
    const backup = await serializeDb();

    await db.blocks.add({
      id: 'extra-block',
      name: 'Extra',
      baselineTier: 2,
      startDate: '2025-01-01',
      status: 'archived',
      testGuardMinSessions: 6,
      completedPlannedKbSessions: 6,
    });
    expect(await db.blocks.count()).toBe(2);

    await deserializeAndRestore(backup);

    expect(await db.blocks.count()).toBe(1);
    expect(await db.blocks.get('extra-block')).toBeUndefined();
  });

  it('round-trips nested objects faithfully', async () => {
    await seed('2026-06-14');
    const backup = await serializeDb();

    await db.delete();
    await db.open();
    await deserializeAndRestore(backup);

    const wt = await db.weekTemplates.get('default');
    expect(wt?.days['monday']).toBe('kb');
    expect(wt?.days['saturday']).toBe('free');

    const tmpl = await db.workoutTemplates.get('dkbs');
    expect(tmpl?.movements[0]?.name).toBe('Double Clean');
    expect(tmpl?.movements[4]?.duration).toBe(30);
  });
});

describe('importFromJson', () => {
  it('round-trips through a JSON string', async () => {
    await seed('2026-06-14');
    const backup = await serializeDb();
    const json = JSON.stringify(backup);

    await db.delete();
    await db.open();

    await importFromJson(json);

    expect(await db.characters.count()).toBe(1);
    expect(await db.blocks.count()).toBe(1);
    expect((await db.characters.get('player-1'))?.level).toBe(1);
  });

  it('throws on invalid JSON', async () => {
    await expect(importFromJson('not json at all')).rejects.toThrow();
  });

  it('throws when tables key is missing', async () => {
    await expect(importFromJson('{"version":1,"exportedAt":"2026-06-14T00:00:00.000Z"}')).rejects.toThrow();
  });
});
