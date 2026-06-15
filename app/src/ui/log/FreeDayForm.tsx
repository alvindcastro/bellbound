import { useState } from 'react';
import type { Difficulty, WorkoutSource } from '@bellbound/engine';
import { defaultSourceForActivity } from '@bellbound/engine';
import type { WorkoutContext, LogFormInputs } from '../../services/buildWorkoutLog.js';
import { buildWorkoutLog } from '../../services/buildWorkoutLog.js';
import { saveLogAndUpdateCounter } from '../../services/sessionCounterService.js';

interface Props {
  date: string;
  blockId: string;
  onSave: () => void;
  onCancel: () => void;
}

type ActivityKey = 'run' | 'hike' | 'pickleball' | 'barbell' | 'yoga' | 'walk' | 'reading' | 'cube';
type Status = 'completed' | 'modified' | 'skipped';

const ACTIVITY_OPTIONS: { value: ActivityKey; label: string }[] = [
  { value: 'run', label: 'Run' },
  { value: 'hike', label: 'Hike' },
  { value: 'pickleball', label: 'Pickleball' },
  { value: 'barbell', label: 'Barbell work' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'walk', label: 'Walk' },
  { value: 'reading', label: 'Reading' },
  { value: 'cube', label: 'Cube / skill' },
];

const ACTIVITY_LABEL: Record<ActivityKey, string> = {
  run: 'Run',
  hike: 'Hike',
  pickleball: 'Pickleball',
  barbell: 'Barbell work',
  yoga: 'Yoga',
  walk: 'Walk',
  reading: 'Reading',
  cube: 'Cube / skill',
};

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

export default function FreeDayForm({ date, blockId, onSave, onCancel }: Props) {
  const [activityType, setActivityType] = useState<ActivityKey>('run');
  const [source, setSource] = useState<WorkoutSource>(defaultSourceForActivity('run'));
  const [status, setStatus] = useState<Status>('completed');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [breathless, setBreathless] = useState(false);
  const [gripCooked, setGripCooked] = useState(false);
  const [legsSore, setLegsSore] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  function handleActivityChange(next: ActivityKey) {
    setActivityType(next);
    setSource(defaultSourceForActivity(next));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const context: WorkoutContext = {
      date,
      blockId,
      plannedDayType: 'free',
      actualDayType: 'free',
      templateId: activityType,
      templateName: ACTIVITY_LABEL[activityType],
      category: activityType,
      source,
    };

    const inputs: LogFormInputs = {
      status,
      roundsCompleted: 0,
      difficulty,
      note,
      signals: { pressGrindy: false, breathless, gripCooked, legsSore },
    };

    setSaving(true);
    try {
      const log = buildWorkoutLog(inputs, context);
      await saveLogAndUpdateCounter(log);
      onSave();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="section-title">Log activity</h2>

      <div className="form-group">
        <label htmlFor="activityType">Activity</label>
        <select
          id="activityType"
          value={activityType}
          onChange={(e) => handleActivityChange(e.target.value as ActivityKey)}
        >
          {ACTIVITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Off-block training may trigger recovery effects; recovery/skill gives positive feedback only */}
      <div className="form-group">
        <label>Source</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="source"
              value="off_block"
              checked={source === 'off_block'}
              onChange={() => setSource('off_block')}
            />
            {' '}Off-block training
          </label>
          <label>
            <input
              type="radio"
              name="source"
              value="recovery_skill"
              checked={source === 'recovery_skill'}
              onChange={() => setSource('recovery_skill')}
            />
            {' '}Recovery / skill
          </label>
        </div>
      </div>

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
              {' '}{opt.label}
            </label>
          ))}
        </div>
      </div>

      {status !== 'skipped' && (
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
                {' '}{opt.label}
              </label>
            ))}
          </div>
        </div>
      )}

      {status !== 'skipped' && (
        <div className="form-group">
          <label>Signal flags (optional)</label>
          <div className="checkbox-group">
            <label>
              <input type="checkbox" checked={breathless} onChange={(e) => setBreathless(e.target.checked)} />
              {' '}Out of breath / conditioning too hard
            </label>
            <label>
              <input type="checkbox" checked={gripCooked} onChange={(e) => setGripCooked(e.target.checked)} />
              {' '}Grip cooked
            </label>
            <label>
              <input type="checkbox" checked={legsSore} onChange={(e) => setLegsSore(e.target.checked)} />
              {' '}Legs sore
            </label>
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
