import { useState, useEffect } from 'react';
import type { WorkoutLog } from '@bellbound/engine';
import { workoutLogRepository } from '../../data/repositories/workoutLogRepository.js';

export default function RecentLogs() {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workoutLogRepository.listRecent(10).then((result) => {
      setLogs(result);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="loading">Loading…</p>;

  if (logs.length === 0) {
    return <p className="empty-state">No logs yet. Log your first workout today.</p>;
  }

  return (
    <ul className="log-list">
      {logs.map((log) => {
        const workoutName = (log.plannedWorkout as { name?: string }).name ?? 'Workout';
        return (
          <li key={log.id} className="log-item">
            <div className="log-date">{log.date}</div>
            <div className="log-name">{workoutName}</div>
            <div className="log-meta">{log.status} · {log.difficulty}</div>
            {log.originalNote && <div className="log-note">{log.originalNote}</div>}
          </li>
        );
      })}
    </ul>
  );
}
