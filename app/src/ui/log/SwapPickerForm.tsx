import { useState, useEffect } from 'react';
import type { WorkoutTemplate, ResolvedWorkout } from '@bellbound/engine';
import { resolveWorkoutAtTier } from '@bellbound/engine';
import { workoutTemplateRepository } from '../../data/repositories/workoutTemplateRepository.js';

interface Props {
  prescribedTemplateId: string;
  baselineTier: number;
  onPick: (chosen: ResolvedWorkout, reason: string) => void;
  onPasteNew?: () => void;
  onCancel: () => void;
}

export default function SwapPickerForm({ prescribedTemplateId, baselineTier, onPick, onPasteNew, onCancel }: Props) {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    workoutTemplateRepository.listKettlebell().then(all => {
      const others = all.filter(t => t.id !== prescribedTemplateId);
      setTemplates(others);
      if (others.length > 0 && others[0]) setSelected(others[0].id);
    });
  }, [prescribedTemplateId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const template = templates.find(t => t.id === selected);
    if (!template) return;
    const resolved = resolveWorkoutAtTier(template, baselineTier);
    onPick(resolved, reason.trim());
  }

  if (templates.length === 0) return <p className="loading">Loading workouts…</p>;

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="section-title">Choose a different workout</h2>
      <p className="form-hint">This swap counts toward your block. The schedule stays the same.</p>

      <div className="form-group">
        <label>Workout</label>
        <div className="radio-group">
          {templates.map(t => (
            <label key={t.id}>
              <input
                type="radio"
                name="swapTemplate"
                value={t.id}
                checked={selected === t.id}
                onChange={() => setSelected(t.id)}
              />
              {' '}{t.name}
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="swapReason">Reason (optional — contributes to Judgment)</label>
        <input
          id="swapReason"
          type="text"
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="e.g. only one bell available, fatigue, time"
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary">Log this workout</button>
        {onPasteNew && (
          <button type="button" className="btn" onClick={onPasteNew}>Paste new workout</button>
        )}
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
