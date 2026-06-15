import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../data/db/bellboundDb.js';
import { statusEffectRepository } from '../data/repositories/statusEffectRepository.js';
import type { StatusEffect } from '@bellbound/engine';

beforeEach(async () => {
  await db.open();
});

afterEach(async () => {
  await db.delete();
});

describe('statusEffectRepository', () => {
  const makeEffect = (id: string, overrides: Partial<StatusEffect> = {}): StatusEffect => ({
    id,
    name: 'Press Gremlin',
    source: 'pressGrindy',
    recommendationEffect: 'hold_pressing',
    expiryType: 'after_next_session',
    expiryParam: null,
    createdDate: '2026-06-14',
    ...overrides,
  });

  it('add writes an effect and listAll returns it with correct fields', async () => {
    await statusEffectRepository.add(makeEffect('se-1'));
    const all = await statusEffectRepository.listAll();
    expect(all).toHaveLength(1);
    expect(all[0]?.id).toBe('se-1');
    expect(all[0]?.name).toBe('Press Gremlin');
    expect(all[0]?.source).toBe('pressGrindy');
    expect(all[0]?.recommendationEffect).toBe('hold_pressing');
    expect(all[0]?.expiryType).toBe('after_next_session');
    expect(all[0]?.expiryParam).toBeNull();
    expect(all[0]?.createdDate).toBe('2026-06-14');
  });

  it('listAll returns both effects when two are added', async () => {
    await statusEffectRepository.add(makeEffect('se-1'));
    await statusEffectRepository.add(makeEffect('se-2', { name: 'Grip Curse', source: 'gripCooked', recommendationEffect: 'hold_carry' }));
    const all = await statusEffectRepository.listAll();
    expect(all).toHaveLength(2);
  });

  it('deleteById removes the correct effect and the other remains', async () => {
    await statusEffectRepository.add(makeEffect('se-1'));
    await statusEffectRepository.add(makeEffect('se-2', { name: 'Breathless Fog' }));
    await statusEffectRepository.deleteById('se-1');
    const all = await statusEffectRepository.listAll();
    expect(all).toHaveLength(1);
    expect(all[0]?.id).toBe('se-2');
  });

  it('round-trip preserves createdDate', async () => {
    await statusEffectRepository.add(makeEffect('se-1', { createdDate: '2026-05-01' }));
    const all = await statusEffectRepository.listAll();
    expect(all[0]?.createdDate).toBe('2026-05-01');
  });

  it('listAll returns empty array when no effects added', async () => {
    const all = await statusEffectRepository.listAll();
    expect(all).toHaveLength(0);
  });
});
