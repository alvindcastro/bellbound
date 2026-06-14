import type { DayType, WeekTemplate, WorkoutLog } from '@bellbound/engine';
import type { DayClassification } from '@bellbound/engine';
import { plannedDayType, classifyDay } from '@bellbound/engine';

export interface DaySummary {
  date: string;
  planned: DayType;
  classification: DayClassification;
  log: WorkoutLog | null;
}

export interface WeekSummary {
  days: DaySummary[];
  plannedSessions: number;  // count of days where planned === 'kb' or 'test'
  actualSessions: number;   // trained_on_training_day + trained_on_rest_day
  extras: number;           // trained_on_rest_day count
  misses: number;           // missed_training_day count
}

export function buildWeekSummary(
  dates: string[],
  template: WeekTemplate,
  logsByDate: Record<string, WorkoutLog | null>,
): WeekSummary {
  const days: DaySummary[] = dates.map((date) => {
    const planned = plannedDayType(date, template);
    const log = logsByDate[date] ?? null;
    const classification = classifyDay(planned, log);
    return { date, planned, classification, log };
  });

  const plannedSessions = days.filter(
    (d) => d.planned === 'kb' || d.planned === 'test',
  ).length;

  const actualSessions = days.filter(
    (d) =>
      d.classification === 'trained_on_training_day' ||
      d.classification === 'trained_on_rest_day',
  ).length;

  const extras = days.filter(
    (d) => d.classification === 'trained_on_rest_day',
  ).length;

  const misses = days.filter(
    (d) => d.classification === 'missed_training_day',
  ).length;

  return { days, plannedSessions, actualSessions, extras, misses };
}
