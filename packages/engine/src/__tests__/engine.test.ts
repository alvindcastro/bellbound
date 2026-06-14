import { describe, it, expect } from 'vitest';
import { TEST_GUARD_MIN_SESSIONS, SLEEP_OK_HOURS } from '../config.js';

describe('engine package', () => {
  it('is importable and exports config constants', () => {
    expect(TEST_GUARD_MIN_SESSIONS).toBe(6);
    expect(SLEEP_OK_HOURS).toBe(7);
  });
});
