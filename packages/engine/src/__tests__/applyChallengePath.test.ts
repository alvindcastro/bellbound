import { describe, it, expect } from 'vitest';
import { applyChallengePath } from '../challenges/applyChallengePath.js';
import type { WeekTemplate } from '../entities/weekTemplate.js';

const BASE_TEMPLATE: WeekTemplate = {
  id: 'default',
  days: {
    monday: 'kb',
    tuesday: 'kb',
    wednesday: 'rest',
    thursday: 'kb',
    friday: 'kb',
    saturday: 'free',
    sunday: 'rest',
  },
};

describe('applyChallengePath', () => {
  it('returns template unchanged when path is null', () => {
    const result = applyChallengePath(BASE_TEMPLATE, null);
    expect(result).toEqual(BASE_TEMPLATE);
  });

  it('returns template unchanged when path is undefined', () => {
    const result = applyChallengePath(BASE_TEMPLATE, undefined);
    expect(result).toEqual(BASE_TEMPLATE);
  });

  it('Minimalist path changes Tuesday from kb to rest', () => {
    const result = applyChallengePath(BASE_TEMPLATE, 'minimalist');
    expect(result.days.tuesday).toBe('rest');
  });

  it('Minimalist path leaves Monday as kb', () => {
    const result = applyChallengePath(BASE_TEMPLATE, 'minimalist');
    expect(result.days.monday).toBe('kb');
  });

  it('Minimalist path leaves Thursday as kb', () => {
    const result = applyChallengePath(BASE_TEMPLATE, 'minimalist');
    expect(result.days.thursday).toBe('kb');
  });

  it('Minimalist path leaves Friday as kb', () => {
    const result = applyChallengePath(BASE_TEMPLATE, 'minimalist');
    expect(result.days.friday).toBe('kb');
  });

  it('Minimalist path produces exactly 3 KB days', () => {
    const result = applyChallengePath(BASE_TEMPLATE, 'minimalist');
    const kbDays = Object.values(result.days).filter(d => d === 'kb');
    expect(kbDays).toHaveLength(3);
  });

  it('clean_press path leaves template unchanged (emphasis only at Phase 12)', () => {
    const result = applyChallengePath(BASE_TEMPLATE, 'clean_press');
    expect(result.days).toEqual(BASE_TEMPLATE.days);
  });

  it('swing_marsh path leaves template unchanged', () => {
    const result = applyChallengePath(BASE_TEMPLATE, 'swing_marsh');
    expect(result.days).toEqual(BASE_TEMPLATE.days);
  });

  it('recovery_rogue path leaves template unchanged', () => {
    const result = applyChallengePath(BASE_TEMPLATE, 'recovery_rogue');
    expect(result.days).toEqual(BASE_TEMPLATE.days);
  });

  it('double_bell path leaves template unchanged', () => {
    const result = applyChallengePath(BASE_TEMPLATE, 'double_bell');
    expect(result.days).toEqual(BASE_TEMPLATE.days);
  });

  it('does not mutate the original template', () => {
    const original = { ...BASE_TEMPLATE, days: { ...BASE_TEMPLATE.days } };
    applyChallengePath(BASE_TEMPLATE, 'minimalist');
    expect(BASE_TEMPLATE.days).toEqual(original.days);
  });
});
