import type { DayType, WeekTemplate, WorkoutLog } from '@bellbound/engine';
import type { DayClassification } from '@bellbound/engine';
import { plannedDayType, classifyDay, getReportWindow } from '@bellbound/engine';
import { weekTemplateRepository } from '../data/repositories/weekTemplateRepository.js';
import { workoutLogRepository } from '../data/repositories/workoutLogRepository.js';

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
  restDaysTaken: number;    // count of days where classification === 'rested_on_rest_day'
  freeDayActivities: number; // count of days where classification === 'free_day_with_activity'
  notes: string[];          // non-empty originalNote strings from logs, in date order
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

  const restDaysTaken = days.filter(
    (d) => d.classification === 'rested_on_rest_day',
  ).length;

  const freeDayActivities = days.filter(
    (d) => d.classification === 'free_day_with_activity',
  ).length;

  const notes = days
    .map((d) => d.log?.originalNote ?? '')
    .filter((n) => n.length > 0);

  return { days, plannedSessions, actualSessions, extras, misses, restDaysTaken, freeDayActivities, notes };
}

export async function fetchWeeklyReport(today: string): Promise<WeekSummary | null> {
  const window = getReportWindow(today);
  const [template, logs] = await Promise.all([
    weekTemplateRepository.getDefault(),
    workoutLogRepository.listByDateRange(window[0]!, window[window.length - 1]!),
  ]);
  if (!template) return null;
  const logsByDate: Record<string, WorkoutLog | null> = {};
  for (const date of window) logsByDate[date] = null;
  for (const log of logs) logsByDate[log.date] = log;
  return buildWeekSummary(window, template, logsByDate);
}
