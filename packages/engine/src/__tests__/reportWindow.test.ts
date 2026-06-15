import { describe, it, expect } from 'vitest';
import { getReportWindow } from '../schedule/reportWindow.js';

describe('getReportWindow', () => {
  it('returns exactly 7 dates', () => {
    expect(getReportWindow('2026-06-14')).toHaveLength(7);
  });

  it('first entry is 6 days before today', () => {
    expect(getReportWindow('2026-06-14')[0]).toBe('2026-06-08');
  });

  it('last entry is today itself', () => {
    const result = getReportWindow('2026-06-14');
    expect(result[result.length - 1]).toBe('2026-06-14');
  });

  it('returns the complete expected array', () => {
    expect(getReportWindow('2026-06-14')).toEqual([
      '2026-06-08',
      '2026-06-09',
      '2026-06-10',
      '2026-06-11',
      '2026-06-12',
      '2026-06-13',
      '2026-06-14',
    ]);
  });

  it('spans a month boundary (March 2026 — Feb has 28 days)', () => {
    const result = getReportWindow('2026-03-01');
    expect(result[result.length - 1]).toBe('2026-03-01');
    expect(result[0]).toBe('2026-02-23');
  });

  it('spans a year boundary (Jan 1 2026)', () => {
    const result = getReportWindow('2026-01-01');
    expect(result[result.length - 1]).toBe('2026-01-01');
    expect(result[0]).toBe('2025-12-26');
  });
});
