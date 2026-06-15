import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../data/db/bellboundDb.js';
import { questRepository } from '../data/repositories/questRepository.js';
import { rewardRepository } from '../data/repositories/rewardRepository.js';

beforeEach(async () => {
  await db.open();
});

afterEach(async () => {
  await db.delete();
});

describe('questRepository', () => {
  it('upsertProgress creates a new row', async () => {
    await questRepository.upsertProgress('quest-1', 3, false);
    const row = await db.quests.get('quest-1');
    expect(row).not.toBeNull();
    expect(row?.id).toBe('quest-1');
    expect(row?.progress).toBe(3);
    expect(row?.completed).toBe(false);
  });

  it('upsertProgress overwrites on second call', async () => {
    await questRepository.upsertProgress('quest-1', 2, false);
    await questRepository.upsertProgress('quest-1', 5, true);
    const row = await db.quests.get('quest-1');
    expect(row?.progress).toBe(5);
    expect(row?.completed).toBe(true);
    const all = await db.quests.toArray();
    expect(all).toHaveLength(1);
  });

  it('getById returns null when not found', async () => {
    const row = await questRepository.getById('no-such-quest');
    expect(row).toBeNull();
  });

  it('getAll returns all quests', async () => {
    await questRepository.upsertProgress('quest-a', 1, false);
    await questRepository.upsertProgress('quest-b', 6, true);
    const all = await questRepository.getAll();
    expect(all).toHaveLength(2);
    const ids = all.map((q) => q.id).sort();
    expect(ids).toEqual(['quest-a', 'quest-b']);
  });
});

describe('rewardRepository', () => {
  it('grantItem stores item with correct fields including unlockedAt', async () => {
    await rewardRepository.grantItem(
      { id: 'item-1', name: 'Iron Bell', flavourText: 'A trusty bell.' },
      '2026-06-15',
    );
    const row = await db.items.get('item-1');
    expect(row).not.toBeNull();
    expect(row?.id).toBe('item-1');
    expect(row?.name).toBe('Iron Bell');
    expect(row?.flavourText).toBe('A trusty bell.');
    expect(row?.unlockedAt).toBe('2026-06-15');
  });

  it('grantItem is idempotent: calling twice does not duplicate', async () => {
    await rewardRepository.grantItem(
      { id: 'item-1', name: 'Iron Bell', flavourText: 'A trusty bell.' },
      '2026-06-15',
    );
    await rewardRepository.grantItem(
      { id: 'item-1', name: 'Iron Bell', flavourText: 'A trusty bell.' },
      '2026-06-16',
    );
    const all = await db.items.toArray();
    expect(all).toHaveLength(1);
    expect(all[0]?.unlockedAt).toBe('2026-06-15');
  });

  it('grantTitle stores title with correct fields', async () => {
    await rewardRepository.grantTitle(
      { id: 'title-1', name: 'The Persistent', flavourText: 'They kept showing up.' },
      '2026-06-15',
    );
    const row = await db.titles.get('title-1');
    expect(row).not.toBeNull();
    expect(row?.id).toBe('title-1');
    expect(row?.name).toBe('The Persistent');
    expect(row?.flavourText).toBe('They kept showing up.');
    expect(row?.unlockedAt).toBe('2026-06-15');
  });

  it('grantTitle is idempotent: calling twice does not duplicate', async () => {
    await rewardRepository.grantTitle(
      { id: 'title-1', name: 'The Persistent', flavourText: 'They kept showing up.' },
      '2026-06-15',
    );
    await rewardRepository.grantTitle(
      { id: 'title-1', name: 'The Persistent', flavourText: 'They kept showing up.' },
      '2026-06-20',
    );
    const all = await db.titles.toArray();
    expect(all).toHaveLength(1);
    expect(all[0]?.unlockedAt).toBe('2026-06-15');
  });

  it('listItems returns all items', async () => {
    await rewardRepository.grantItem(
      { id: 'item-1', name: 'Iron Bell', flavourText: 'A trusty bell.' },
      '2026-06-15',
    );
    await rewardRepository.grantItem(
      { id: 'item-2', name: 'Chalk Bag', flavourText: 'Grip secured.' },
      '2026-06-15',
    );
    const items = await rewardRepository.listItems();
    expect(items).toHaveLength(2);
  });

  it('listTitles returns all titles', async () => {
    await rewardRepository.grantTitle(
      { id: 'title-1', name: 'The Persistent', flavourText: 'They kept showing up.' },
      '2026-06-15',
    );
    await rewardRepository.grantTitle(
      { id: 'title-2', name: 'The Patient', flavourText: 'They waited for strength.' },
      '2026-06-15',
    );
    const titles = await rewardRepository.listTitles();
    expect(titles).toHaveLength(2);
  });
});
