import type { TodayResult, ResolvedMovement } from '../../services/todayService.js';

interface Props {
  date: string;
  todayResult: TodayResult | null;
  onLogWorkout: () => void;
}

function formatReps(m: ResolvedMovement): string {
  if (m.reps !== undefined) return `${m.rounds} × ${m.reps}`;
  if (m.duration !== undefined) return `${m.rounds} × ${m.duration} sec`;
  return `${m.rounds} sets`;
}

function formatLoad(m: ResolvedMovement): string {
  return m.load !== undefined ? `double ${m.load} kg` : 'bodyweight';
}

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

const DAY_LABEL: Record<string, string> = {
  rest: 'Rest', free: 'Free', test: 'Test',
};

const DAY_MESSAGE: Record<string, string> = {
  rest: 'Rest day. Recover well.',
  free: 'Free day. Move how you feel.',
  test: 'Test day — logging coming in a later phase.',
};

export default function TodayScreen({ date, todayResult, onLogWorkout }: Props) {
  if (todayResult === null) {
    return <p className="loading">Loading…</p>;
  }

  if (todayResult.dayType !== 'kb') {
    return (
      <div>
        <p className="day-meta">{formatDate(date)} · {DAY_LABEL[todayResult.dayType]}</p>
        <p className="rest-message">{DAY_MESSAGE[todayResult.dayType]}</p>
      </div>
    );
  }

  const { workout } = todayResult;

  return (
    <div>
      <p className="day-meta">{formatDate(date)} · Kettlebell</p>
      <p className="zone-title">{workout.zoneName}</p>
      <table className="workout-table">
        <thead>
          <tr>
            <th>Movement</th>
            <th>Sets × Reps</th>
            <th>Load</th>
          </tr>
        </thead>
        <tbody>
          {workout.movements.map((m) => (
            <tr key={m.name}>
              <td>{m.name}</td>
              <td>{formatReps(m)}</td>
              <td>{formatLoad(m)}</td>
            </tr>
          ))}
          <tr className="rest-row">
            <td>Rest</td>
            <td>{workout.defaultRest}–{workout.defaultRest + 30} sec</td>
            <td>after full round</td>
          </tr>
        </tbody>
      </table>
      <button className="btn-primary" onClick={onLogWorkout}>Log this workout</button>
    </div>
  );
}
