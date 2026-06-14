import { describe, it, expect } from 'vitest';
import {
  TEST_GUARD_MIN_SESSIONS,
  SLEEP_OK_HOURS,
  SORENESS_EFFECT_DAYS,
} from '../config.js';

describe('engine config — tunable constants', () => {
  it('TEST_GUARD_MIN_SESSIONS is 6', () => {
    expect(TEST_GUARD_MIN_SESSIONS).toBe(6);
  });

  it('SLEEP_OK_HOURS is 7', () => {
    expect(SLEEP_OK_HOURS).toBe(7);
  });

  it('SORENESS_EFFECT_DAYS has breathlessFog: 3', () => {
    expect(SORENESS_EFFECT_DAYS.breathlessFog).toBe(3);
  });

  it('SORENESS_EFFECT_DAYS has squatTax: 3', () => {
    expect(SORENESS_EFFECT_DAYS.squatTax).toBe(3);
  });

  it('SORENESS_EFFECT_DAYS has gripCurse: 2', () => {
    expect(SORENESS_EFFECT_DAYS.gripCurse).toBe(2);
  });
});
