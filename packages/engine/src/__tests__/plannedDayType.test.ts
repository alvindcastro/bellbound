import { describe, it, expect } from 'vitest';
import { plannedDayType } from '../schedule/plannedDayType.js';
import type { WeekTemplate } from '../entities/weekTemplate.js';

const defaultTemplate: WeekTemplate = {
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

describe('plannedDayType', () => {
  it('returns kb for a Monday (2026-06-15)', () => {
    expect(plannedDayType('2026-06-15', defaultTemplate)).toBe('kb');
  });

  it('returns kb for a Tuesday (2026-06-16)', () => {
    expect(plannedDayType('2026-06-16', defaultTemplate)).toBe('kb');
  });

  it('returns rest for a Wednesday (2026-06-17)', () => {
    expect(plannedDayType('2026-06-17', defaultTemplate)).toBe('rest');
  });

  it('returns kb for a Thursday (2026-06-18)', () => {
    expect(plannedDayType('2026-06-18', defaultTemplate)).toBe('kb');
  });

  it('returns kb for a Friday (2026-06-19)', () => {
    expect(plannedDayType('2026-06-19', defaultTemplate)).toBe('kb');
  });

  it('returns free for a Saturday (2026-06-20)', () => {
    expect(plannedDayType('2026-06-20', defaultTemplate)).toBe('free');
  });

  it('returns rest for a Sunday (2026-06-21)', () => {
    expect(plannedDayType('2026-06-21', defaultTemplate)).toBe('rest');
  });

  it('uses local time (T00:00:00 suffix) so 2026-06-15 resolves to Monday, not Sunday', () => {
    // With UTC parsing, midnight on 2026-06-15 in a UTC+N timezone would still be
    // 2026-06-15. Using T00:00:00 (local time) ensures correct day resolution.
    expect(plannedDayType('2026-06-15', defaultTemplate)).toBe('kb'); // Monday
  });

  it('works with a custom template where all days are rest', () => {
    const allRestTemplate: WeekTemplate = {
      id: 'all-rest',
      days: {
        monday: 'rest',
        tuesday: 'rest',
        wednesday: 'rest',
        thursday: 'rest',
        friday: 'rest',
        saturday: 'rest',
        sunday: 'rest',
      },
    };
    expect(plannedDayType('2026-06-15', allRestTemplate)).toBe('rest');
    expect(plannedDayType('2026-06-20', allRestTemplate)).toBe('rest');
  });

  it('works with a template that has a test day on Thursday', () => {
    const testTemplate: WeekTemplate = {
      id: 'with-test',
      days: {
        monday: 'kb',
        tuesday: 'kb',
        wednesday: 'rest',
        thursday: 'test',
        friday: 'kb',
        saturday: 'free',
        sunday: 'rest',
      },
    };
    expect(plannedDayType('2026-06-18', testTemplate)).toBe('test'); // Thursday
  });
});
