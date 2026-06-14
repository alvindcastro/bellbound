import { useState, useEffect } from 'react';
import type { WorkoutLog } from '@bellbound/engine';
import { weekTemplateRepository } from '../../data/repositories/weekTemplateRepository.js';
import { workoutLogRepository } from '../../data/repositories/workoutLogRepository.js';
import { buildWeekSummary } from '../../services/weeklyHistoryService.js';
import type { WeekSummary, DaySummary } from '../../services/weeklyHistoryService.js';
import type { DayClassification } from '@bellbound/engine';

const CLASSIFICATION_LABEL: Record<DayClassification, string> = {
  trained_on_training_day: 'Trained',
  rested_on_rest_day: 'Rested',
  trained_on_rest_day: 'Extra session',
  missed_training_day: 'Missed',
  free_day_with_activity: 'Activity logged',
  free_day_no_activity: '—',
  test_day: 'Test day',
};

const PLANNED_LABEL: Record<string, string> = {
  kb: 'KB',
  rest: 'Rest',
  free: 'Free',
  test: 'Test',
};

function formatDateShort(isoDate: string): string {
  return new Date(isoDate + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function getLast7Dates(): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export default function WeeklyHistory() {
  const [summary, setSummary] = useState<WeekSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const dates = getLast7Dates();
      const oldest = dates[dates.length - 1]!;
      const newest = dates[0]!;

      const [template, logs] = await Promise.all([
        weekTemplateRepository.getDefault(),
        workoutLogRepository.listByDateRange(oldest, newest),
      ]);

      if (template === null) {
        setLoading(false);
        return;
      }

      const logsByDate: Record<string, WorkoutLog | null> = {};
      for (const date of dates) {
        logsByDate[date] = null;
      }
      for (const log of logs) {
        logsByDate[log.date] = log;
      }

      // Reverse dates to show oldest first (Mon → Sun order)
      const orderedDates = [...dates].reverse();
      setSummary(buildWeekSummary(orderedDates, template, logsByDate));
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return <p className="loading">Loading…</p>;
  }

  if (summary === null) {
    return <p className="loading">No training template found.</p>;
  }

  return (
    <div>
      <h2 className="section-title">Weekly Summary</h2>
      <p>
        Planned sessions: {summary.plannedSessions}&nbsp;&nbsp;
        Completed: {summary.actualSessions}&nbsp;&nbsp;
        Missed: {summary.misses}&nbsp;&nbsp;
        Extras: {summary.extras}
      </p>
      <table className="workout-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Planned</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          {summary.days.map((day: DaySummary) => (
            <tr key={day.date}>
              <td>{formatDateShort(day.date)}</td>
              <td>{PLANNED_LABEL[day.planned] ?? day.planned}</td>
              <td>{CLASSIFICATION_LABEL[day.classification]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
