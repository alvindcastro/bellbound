import type { AscensionOutcome } from '../../services/ascensionService.js';

interface Props {
  outcome: AscensionOutcome;
  onDismiss: () => void;
}

export default function AscensionScreen({ outcome, onDismiss }: Props) {
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
        </div>
      )}

      <button className="btn" onClick={onDismiss}>Continue</button>
    </div>
  );
}
