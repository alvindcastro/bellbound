import type { DayType } from '../entities/enums.js';
import type { Weekday, WeekTemplate } from '../entities/weekTemplate.js';

const WEEKDAY_NAMES: Weekday[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export function plannedDayType(isoDate: string, template: WeekTemplate): DayType {
  // Use local time by appending T00:00:00, not UTC, so the weekday matches the
  // calendar date the user sees on their device.
  const date = new Date(isoDate + 'T00:00:00');
  const weekday = WEEKDAY_NAMES[date.getDay()]!;
  return template.days[weekday];
}
