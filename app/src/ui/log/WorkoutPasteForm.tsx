import { useState } from 'react';
import type { ParsedMovement, ParseResult } from '@bellbound/engine';
import { parseWorkoutText } from '@bellbound/engine';
import { isAiEnabled, getAiClient } from '../../data/ai/index.js';
import { saveParsedTemplate } from '../../services/parsedTemplateService.js';

interface Props {
  onSave: (templateId: string) => void;
  onCancel: () => void;
}

type AiSuggestion = {
  movements: ParsedMovement[];
  accepted: boolean | null; // null = pending, true = accepted, false = dismissed
};

function formatMovement(m: ParsedMovement): string {
  const parts: string[] = [];
  if (m.load !== undefined) {
    parts.push(m.loadFallback !== undefined ? `${m.load} or ${m.loadFallback} kg` : `${m.load} kg`);
  }
  if (m.reps !== undefined) {
    parts.push(m.repMax !== undefined ? `${m.sets}x${m.reps}-${m.repMax}` : `${m.sets}x${m.reps}`);
  } else if (m.duration !== undefined) {
    parts.push(`${m.sets}x${m.duration}s`);
  } else {
    parts.push(`${m.sets} sets`);
  }
  if (m.eachSide) parts.push('each side');
  return `${m.name} — ${parts.join(', ')}`;
}

export default function WorkoutPasteForm({ onSave, onCancel }: Props) {
  const [text, setText] = useState('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [movements, setMovements] = useState<ParsedMovement[]>([]);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function handleParse() {
    const result = parseWorkoutText(text);
    setParseResult(result);
    setMovements(result.movements);
    setAiSuggestion(null);
    setSaveError(null);
  }

  async function handleAiParse() {
    if (!parseResult || parseResult.unparsedLines.length === 0) return;
    setAiLoading(true);
    try {
      const client = getAiClient({ online: navigator.onLine });
      const parsed = await client.parseWorkoutLines(parseResult.unparsedLines);
      if (parsed !== null && parsed.length > 0) {
        setAiSuggestion({ movements: parsed, accepted: null });
      } else {
        setAiSuggestion({ movements: [], accepted: null });
      }
    } finally {
      setAiLoading(false);
    }
  }

  function acceptAiSuggestion() {
    if (!aiSuggestion) return;
    setMovements(prev => [...prev, ...aiSuggestion.movements]);
    setAiSuggestion(prev => prev ? { ...prev, accepted: true } : null);
  }

  function dismissAiSuggestion() {
    setAiSuggestion(prev => prev ? { ...prev, accepted: false } : null);
  }

  async function handleSave() {
    if (!name.trim()) {
      setSaveError('Please enter a name for this workout.');
      return;
    }
    if (movements.length === 0) {
      setSaveError('No movements to save. Parse the workout first.');
      return;
    }
    setSaveError(null);
    setSaving(true);
    try {
      const defaultRest = parseResult?.defaultRest ?? 90;
      const id = await saveParsedTemplate(name.trim(), movements, defaultRest);
      onSave(id);
    } catch {
      setSaveError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const hasUnparsed = parseResult !== null && parseResult.unparsedLines.length > 0;
  const aiAvailable = isAiEnabled();
  const aiSuggestionPending = aiSuggestion !== null && aiSuggestion.accepted === null;

  return (
    <div>
      <h2 className="section-title">Paste workout</h2>

      <div className="form-group">
        <label htmlFor="workout-text">Workout text</label>
        <textarea
          id="workout-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder={[
            'Paste or type your workout, one movement per line. Examples:',
            'Single-arm swing 24 kg 5x10 each side',
            'Push-up 3x8-10',
            'Plank 3x30 sec',
            'Rest 60 sec',
          ].join('\n')}
        />
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={handleParse}
          disabled={!text.trim()}
        >
          Parse
        </button>
      </div>

      {parseResult !== null && (
        <>
          <div className="form-group">
            <h3>Parsed movements ({movements.length})</h3>
            {movements.length === 0 ? (
              <p className="form-hint">No movements parsed from the text above.</p>
            ) : (
              <ul>
                {movements.map((m, i) => (
                  <li key={i}>{formatMovement(m)}</li>
                ))}
              </ul>
            )}
            {parseResult.defaultRest !== undefined && (
              <p className="form-hint">Default rest: {parseResult.defaultRest}s</p>
            )}
          </div>

          {hasUnparsed && (
            <div className="form-group">
              <h3>Lines not recognised</h3>
              <ul>
                {parseResult.unparsedLines.map((line, i) => (
                  <li key={i}><code>{line}</code></li>
                ))}
              </ul>

              {aiAvailable && aiSuggestion === null && (
                <button
                  type="button"
                  className="btn"
                  onClick={handleAiParse}
                  disabled={aiLoading}
                >
                  {aiLoading ? 'Asking AI…' : 'Try AI for unparsed lines'}
                </button>
              )}

              {aiSuggestionPending && aiSuggestion.movements.length > 0 && (
                <div className="form-group">
                  <h4>AI suggestions</h4>
                  <ul>
                    {aiSuggestion.movements.map((m, i) => (
                      <li key={i}>{formatMovement(m)}</li>
                    ))}
                  </ul>
                  <button type="button" className="btn-primary" onClick={acceptAiSuggestion}>
                    Accept
                  </button>
                  {' '}
                  <button type="button" className="btn" onClick={dismissAiSuggestion}>
                    Dismiss
                  </button>
                </div>
              )}

              {aiSuggestionPending && aiSuggestion.movements.length === 0 && (
                <div className="form-group">
                  <p className="form-hint">AI could not parse those lines.</p>
                  <button type="button" className="btn" onClick={dismissAiSuggestion}>
                    Dismiss
                  </button>
                </div>
              )}

              {aiSuggestion?.accepted === true && (
                <p className="form-hint">AI suggestions added to movements above.</p>
              )}

              {aiSuggestion?.accepted === false && (
                <p className="form-hint">AI suggestions dismissed.</p>
              )}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="template-name">Workout name (required)</label>
            <input
              id="template-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tuesday KB circuit"
            />
          </div>

          {saveError && (
            <p className="form-hint" style={{ color: 'var(--danger, #e74c3c)' }}>{saveError}</p>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={handleSave}
              disabled={saving || movements.length === 0}
            >
              {saving ? 'Saving…' : 'Save workout'}
            </button>
            <button type="button" className="btn" onClick={onCancel}>Cancel</button>
          </div>
        </>
      )}

      {parseResult === null && (
        <div className="form-actions">
          <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        </div>
      )}
    </div>
  );
}
