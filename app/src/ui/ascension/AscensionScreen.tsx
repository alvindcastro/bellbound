import { useState } from 'react';
import type { AscensionOutcome } from '../../services/ascensionService.js';
import type { ChallengePath } from '@bellbound/engine';
import { CHALLENGE_PATH_DEFINITIONS } from '@bellbound/engine';

interface Props {
  outcome: AscensionOutcome;
  onComplete: (selectedPath: ChallengePath | null) => Promise<void>;
}

export default function AscensionScreen({ outcome, onComplete }: Props) {
  const [selectedPath, setSelectedPath] = useState<ChallengePath | null>(null);
  const [completing, setCompleting] = useState(false);

  return (
    <div className="ascension-screen">
      {outcome.kind === 'guard_not_met' && (
        <div>
          <p className="ascension-message">The baseline is not yet consolidated.</p>
          <p className="session-guard">
            Sessions completed: {outcome.sessionsCompleted} / {outcome.sessionsNeeded}
          </p>
          <p className="ascension-note">The block continues. Nothing changed.</p>
        </div>
      )}

      {outcome.kind === 'test_failed' && (
        <div>
          <p className="ascension-message">Test workout not completed.</p>
          <p className="ascension-note">The baseline holds. Nothing changed.</p>
        </div>
      )}

      {outcome.kind === 'ascended' && (
        <div>
          <p className="ascension-message">Block complete.</p>
          <p className="ascension-tier">Tier {outcome.nextTier} begins.</p>
          <p className="ascension-lesson-label">Permanent lesson banked:</p>
          <p className="ascension-lesson-title">"{outcome.lesson.title}"</p>
          <p className="ascension-lesson-desc">{outcome.lesson.description}</p>
          <p className="ascension-note">Stats have been reset. The counter starts again.</p>
          <section>
            <p>Select a challenge path for the next block, or continue with the standard block.</p>
            <div>
              <label>
                <input
                  type="radio"
                  name="path"
                  checked={selectedPath === null}
                  onChange={() => setSelectedPath(null)}
                />
                {' '}No path — standard block
              </label>
              {CHALLENGE_PATH_DEFINITIONS.map(def => (
                <label key={def.id}>
                  <input
                    type="radio"
                    name="path"
                    checked={selectedPath === def.id}
                    onChange={() => setSelectedPath(def.id)}
                  />
                  {' '}{def.name} — {def.description}
                </label>
              ))}
            </div>
          </section>
        </div>
      )}

      {outcome.kind === 'ascended' ? (
        <button
          className="btn-primary"
          disabled={completing}
          onClick={async () => {
            setCompleting(true);
            await onComplete(selectedPath);
          }}
        >
          {completing ? 'Saving…' : 'Begin next block'}
        </button>
      ) : (
        <button
          className="btn"
          disabled={completing}
          onClick={async () => {
            setCompleting(true);
            await onComplete(null);
          }}
        >
          Continue
        </button>
      )}
    </div>
  );
}
