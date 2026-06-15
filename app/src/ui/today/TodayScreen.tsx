import type { TodayResult } from '../../services/todayService.js';
import type { ResolvedMovement, WorkoutLog, Recommendation, RecommendationKind } from '@bellbound/engine';
import { classifyDay, getEncounterText, getCompletionMessage } from '@bellbound/engine';

const RECOMMENDATION_LABEL: Record<RecommendationKind, string> = {
  reduce: 'Reduce',
  repeat: 'Repeat baseline',
  hold_pressing: 'Hold pressing',
  hold_conditioning: 'Hold conditioning',
  hold_carry: 'Hold carry',
  hold_squat: 'Hold squat',
  progress: 'Progression eligible',
  maintain: 'Maintain',
};

interface Props {
  date: string;
  todayResult: TodayResult | null;
  todayLog: WorkoutLog | null;
  recommendation: Recommendation | null;
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

export default function TodayScreen({ date, todayResult, todayLog, recommendation, onLogWorkout }: Props) {
  if (todayResult === null) {
    return <p className="loading">Loading…</p>;
  }

  if (todayResult.dayType !== 'kb') {
    const classification = classifyDay(todayResult.dayType, todayLog);
    return (
      <div>
        <p className="day-meta">{formatDate(date)} · {DAY_LABEL[todayResult.dayType]}</p>
        <p className="rest-message">{DAY_MESSAGE[todayResult.dayType]}</p>
        {todayLog !== null && classification === 'trained_on_rest_day' && (
          <p className="log-status extra">Extra session logged</p>
        )}
        <button className="btn" onClick={onLogWorkout}>Log a workout anyway</button>
      </div>
    );
  }

  const { workout } = todayResult;
  const classification = classifyDay('kb', todayLog);
  const alreadyLogged = todayLog !== null && classification === 'trained_on_training_day';

  return (
    <div>
      <p className="day-meta">{formatDate(date)} · Kettlebell</p>
      {alreadyLogged && (
        <p className="log-status logged">Logged: {todayLog!.status} · {todayLog!.difficulty}</p>
      )}
      {alreadyLogged && (
        <p className="completion-message">
          {getCompletionMessage('kb', todayLog!.status)}
        </p>
      )}
      {alreadyLogged && recommendation && (
        <div className="council-recommendation">
          <p className="council-kind">{RECOMMENDATION_LABEL[recommendation.kind]}</p>
          <p className="council-explanation">{recommendation.explanation}</p>
        </div>
      )}
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
              <td>
                {m.name}
                {getEncounterText(m.name) && (
                  <span className="encounter-text">{getEncounterText(m.name)}</span>
                )}
              </td>
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
      {alreadyLogged ? (
        <button className="btn" onClick={onLogWorkout}>Edit log</button>
      ) : (
        <button className="btn-primary" onClick={onLogWorkout}>Log this workout</button>
      )}
    </div>
  );
}
