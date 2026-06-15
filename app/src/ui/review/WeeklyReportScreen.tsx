import { useState, useEffect } from 'react';
import type { DayClassification } from '@bellbound/engine';
import { fetchWeeklyReport } from '../../services/weeklyHistoryService.js';
import type { WeekSummary, DaySummary } from '../../services/weeklyHistoryService.js';

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

interface Props {
  today: string;
}

export default function WeeklyReportScreen({ today }: Props) {
  const [summary, setSummary] = useState<WeekSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeeklyReport(today).then((result) => {
      setSummary(result);
      setLoading(false);
    });
  }, [today]);

  if (loading) {
    return <p className="loading">Loading…</p>;
  }

  if (summary === null) {
    return <p className="loading">No training template found.</p>;
  }

  return (
    <div>
      <h2 className="section-title">Council Report</h2>
      <p>
        Planned sessions: {summary.plannedSessions}&nbsp;&nbsp;
        Completed: {summary.actualSessions}&nbsp;&nbsp;
        Missed: {summary.misses}&nbsp;&nbsp;
        Extras: {summary.extras}&nbsp;&nbsp;
        Rest days: {summary.restDaysTaken}&nbsp;&nbsp;
        Free day activities: {summary.freeDayActivities}
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
      {summary.notes.length > 0 && (
        <>
          <h3>Notes</h3>
          <ul>
            {summary.notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
