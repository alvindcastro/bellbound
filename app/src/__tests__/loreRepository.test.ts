import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../data/db/bellboundDb.js';
import { loreRepository } from '../data/repositories/loreRepository.js';

beforeEach(async () => { await db.open(); });
afterEach(async () => { await db.delete(); });

describe('loreRepository', () => {
  it('stores and retrieves a lore entry by logId', async () => {
    await loreRepository.put({ id: 'lore-log-1', logId: 'log-1', text: 'A dry entry.', generatedAt: '2026-06-15', source: 'deterministic' });
    const found = await loreRepository.getForLog('log-1');
    expect(found).not.toBeNull();
    expect(found!.text).toBe('A dry entry.');
    expect(found!.source).toBe('deterministic');
  });

  it('returns null when no lore exists for logId', async () => {
    const found = await loreRepository.getForLog('nonexistent');
    expect(found).toBeNull();
  });

  it('put is idempotent: storing twice does not error', async () => {
    const entry = { id: 'lore-log-2', logId: 'log-2', text: 'First.', generatedAt: '2026-06-15', source: 'deterministic' as const };
    await loreRepository.put(entry);
    await loreRepository.put({ ...entry, text: 'Second.' }); // overwrites
    const found = await loreRepository.getForLog('log-2');
    expect(found!.text).toBe('Second.');
  });
});
