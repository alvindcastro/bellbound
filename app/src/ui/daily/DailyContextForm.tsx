import { useState } from 'react';
import { dailyContextRepository } from '../../data/repositories/dailyContextRepository.js';
import { createAndPersistPoorSleepGoblinIfNeeded } from '../../services/effectService.js';

interface Props {
  date: string;
  onSave: () => void;
  onCancel: () => void;
}

export default function DailyContextForm({ date, onSave, onCancel }: Props) {
  const [hoursSlept, setHoursSlept] = useState(7);
  const [bodyweightStr, setBodyweightStr] = useState('');
  const [foodNote, setFoodNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const bw = bodyweightStr === '' ? null : parseFloat(bodyweightStr);
    const fn = foodNote === '' ? null : foodNote;

    setSaving(true);
    try {
      await dailyContextRepository.upsert({ date, hoursSlept, bodyweight: bw, foodNote: fn });
      await createAndPersistPoorSleepGoblinIfNeeded(date, hoursSlept);
      onSave();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="section-title">Daily Context</h2>

      <div className="form-group">
        <label htmlFor="hours-slept">Hours slept</label>
        <input
          id="hours-slept"
          type="number"
          min={0}
          max={24}
          step={0.5}
          value={hoursSlept}
          onChange={(e) => setHoursSlept(Number(e.target.value))}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="bodyweight">Bodyweight (optional)</label>
        <input
          id="bodyweight"
          type="number"
          min={0}
          step={0.1}
          value={bodyweightStr}
          onChange={(e) => setBodyweightStr(e.target.value)}
          placeholder=""
        />
      </div>

      <div className="form-group">
        <label htmlFor="notes">Notes (optional)</label>
        <textarea
          id="notes"
          value={foodNote}
          onChange={(e) => setFoodNote(e.target.value)}
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
