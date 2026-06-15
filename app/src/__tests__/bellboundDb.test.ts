import { describe, it, expect, afterEach } from 'vitest';
import { db } from '../data/db/bellboundDb.js';

afterEach(async () => {
  await db.delete();
});

describe('bellboundDb schema', () => {
  it('opens at version 2', async () => {
    await db.open();
    expect(db.verno).toBe(2);
  });

  it('exposes all ten tables', async () => {
    await db.open();
    const names = db.tables.map((t) => t.name).sort();
    expect(names).toEqual([
      'blocks',
      'characters',
      'dailyContext',
      'items',
      'quests',
      'statusEffects',
      'titles',
      'weekTemplates',
      'workoutLogs',
      'workoutTemplates',
    ]);
  });

  it('characters keyed by userId', async () => {
    await db.open();
    expect(db.table('characters').schema.primKey.name).toBe('userId');
  });

  it('blocks keyed by id', async () => {
    await db.open();
    expect(db.table('blocks').schema.primKey.name).toBe('id');
  });

  it('weekTemplates keyed by id', async () => {
    await db.open();
    expect(db.table('weekTemplates').schema.primKey.name).toBe('id');
  });

  it('workoutTemplates keyed by id', async () => {
    await db.open();
    expect(db.table('workoutTemplates').schema.primKey.name).toBe('id');
  });

  it('workoutLogs keyed by id, indexed by date and blockId', async () => {
    await db.open();
    const schema = db.table('workoutLogs').schema;
    expect(schema.primKey.name).toBe('id');
    const indexNames = schema.indexes.map((i) => i.name);
    expect(indexNames).toContain('date');
    expect(indexNames).toContain('blockId');
  });

  it('dailyContext keyed by date', async () => {
    await db.open();
    expect(db.table('dailyContext').schema.primKey.name).toBe('date');
  });

  it('statusEffects keyed by id', async () => {
    await db.open();
    expect(db.table('statusEffects').schema.primKey.name).toBe('id');
  });

  it('quests keyed by id', async () => {
    await db.open();
    expect(db.table('quests').schema.primKey.name).toBe('id');
  });

  it('items keyed by id', async () => {
    await db.open();
    expect(db.table('items').schema.primKey.name).toBe('id');
  });

  it('titles keyed by id', async () => {
    await db.open();
    expect(db.table('titles').schema.primKey.name).toBe('id');
  });
});
