import { useState } from 'react';
import type { Difficulty, DayType } from '@bellbound/engine';
import type { ResolvedWorkout } from '../../services/todayService.js';
import type { WorkoutContext, LogFormInputs } from '../../services/buildWorkoutLog.js';
import { buildWorkoutLog } from '../../services/buildWorkoutLog.js';
import { workoutLogRepository } from '../../data/repositories/workoutLogRepository.js';

interface Props {
  date: string;
  blockId: string;
  workout: ResolvedWorkout;
  plannedDayType: DayType;
  onSave: () => void;
  onCancel: () => void;
}

type Status = LogFormInputs['status'];

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'completed', label: 'Completed' },
  { value: 'modified', label: 'Modified' },
  { value: 'skipped', label: 'Skipped' },
];

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'normal', label: 'Normal' },
  { value: 'hard', label: 'Hard' },
  { value: 'failed', label: 'Failed' },
];

export default function LogForm({ date, blockId, workout, plannedDayType, onSave, onCancel }: Props) {
  const [status, setStatus] = useState<Status>('completed');
  const [rounds, setRounds] = useState(workout.rounds);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rounds < 0) return;

    const context: WorkoutContext = {
      date,
      blockId,
      plannedDayType,
      actualDayType: 'kb',
      templateId: workout.templateId,
      templateName: workout.name,
      category: workout.category,
    };

    const inputs: LogFormInputs = { status, roundsCompleted: rounds, difficulty, note };

    setSaving(true);
    try {
      const log = buildWorkoutLog(inputs, context);
      await workoutLogRepository.add(log);
      onSave();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="section-title">{workout.name}</h2>

      <div className="form-group">
        <label>Status</label>
        <div className="radio-group">
          {STATUS_OPTIONS.map((opt) => (
            <label key={opt.value}>
              <input
                type="radio"
                name="status"
                value={opt.value}
                checked={status === opt.value}
                onChange={() => setStatus(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {status !== 'skipped' && (
        <div className="form-group">
          <label htmlFor="rounds">Rounds completed (planned: {workout.rounds})</label>
          <input
            id="rounds"
            type="number"
            min={0}
            value={rounds}
            onChange={(e) => setRounds(Number(e.target.value))}
          />
        </div>
      )}

      {(status === 'completed' || status === 'modified') && (
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
        <label htmlFor="note">Note (optional)</label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="How did it feel?"
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
