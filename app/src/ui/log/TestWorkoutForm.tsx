import { useState } from 'react';
import type { Difficulty, ResolvedWorkout, WorkoutLog } from '@bellbound/engine';
import type { WorkoutContext, LogFormInputs } from '../../services/buildWorkoutLog.js';
import { buildWorkoutLog } from '../../services/buildWorkoutLog.js';
import { saveLogAndUpdateCounter } from '../../services/sessionCounterService.js';

interface Props {
  date: string;
  blockId: string;
  workout: ResolvedWorkout;
  sessionsCompleted: number;
  sessionsNeeded: number;
  onSave: (log: WorkoutLog) => void;
  onCancel: () => void;
}

type Status = 'completed' | 'failed';

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'normal', label: 'Normal' },
  { value: 'hard', label: 'Hard' },
  { value: 'failed', label: 'Failed' },
];

export default function TestWorkoutForm({
  date,
  blockId,
  workout,
  sessionsCompleted,
  sessionsNeeded,
  onSave,
  onCancel,
}: Props) {
  const [status, setStatus] = useState<Status>('completed');
  const [difficulty, setDifficulty] = useState<Difficulty>('hard');
  const [note, setNote] = useState('');
  const [breathless, setBreathless] = useState(false);
  const [gripCooked, setGripCooked] = useState(false);
  const [legsSore, setLegsSore] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const context: WorkoutContext = {
      date,
      blockId,
      plannedDayType: 'kb',
      actualDayType: 'test',
      templateId: workout.templateId,
      templateName: workout.name,
      category: workout.category,
    };

    const inputs: LogFormInputs = {
      status: status === 'failed' ? 'skipped' : 'completed',
      roundsCompleted: workout.rounds,
      difficulty,
      note,
      signals: { pressGrindy: false, breathless, gripCooked, legsSore },
    };

    setSaving(true);
    try {
      const log = buildWorkoutLog(inputs, context);
      await saveLogAndUpdateCounter(log);
      onSave(log);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="section-title">Test Workout</h2>
      <p className="form-sub">{workout.name} at test intensity</p>

      <p className="session-guard">
        Sessions completed: {sessionsCompleted}/{sessionsNeeded}
      </p>

      <div className="form-group">
        <label>Status</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="status"
              value="completed"
              checked={status === 'completed'}
              onChange={() => setStatus('completed')}
            />
            Completed
          </label>
          <label>
            <input
              type="radio"
              name="status"
              value="failed"
              checked={status === 'failed'}
              onChange={() => setStatus('failed')}
            />
            Did not complete
          </label>
        </div>
      </div>

      {status === 'completed' && (
        <div className="form-group">
          <label>Difficulty</label>
          <div className="radio-group">
            {DIFFICULTY_OPTIONS.map((opt) => (
              <label key={opt.value}>
                <input
                  type="radio"
                  name="difficulty"
                  value={opt.value}
                  checked={difficulty === opt.value}
                  onChange={() => setDifficulty(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="form-group">
        <label>Signal flags (optional)</label>
        <div className="checkbox-group">
          <label>
            <input type="checkbox" checked={breathless} onChange={e => setBreathless(e.target.checked)} />
            {' '}Out of breath / conditioning too hard
          </label>
          <label>
            <input type="checkbox" checked={gripCooked} onChange={e => setGripCooked(e.target.checked)} />
            {' '}Grip cooked
          </label>
          <label>
            <input type="checkbox" checked={legsSore} onChange={e => setLegsSore(e.target.checked)} />
            {' '}Legs sore
          </label>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="note">Note (optional)</label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="How did it go?"
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save log'}
        </button>
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
