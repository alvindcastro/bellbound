import type { StatusEffect } from '../entities/statusEffect.js';
import type { Recommendation, RecommendationKind } from '../entities/recommendation.js';

// Priority order: most conservative first (lower index = higher priority)
const PRIORITY: RecommendationKind[] = [
  'repeat',
  'hold_conditioning',
  'hold_pressing',
  'hold_carry',
  'hold_squat',
];

export function resolveActiveEffects(effects: StatusEffect[]): Recommendation {
  if (effects.length === 0) {
    return { kind: 'maintain', explanation: 'No active status effects.' };
  }

  let winnerKind: RecommendationKind = 'hold_squat';
  let winnerPriority = PRIORITY.length; // starts at lowest

  for (const effect of effects) {
    const kind = effect.recommendationEffect as RecommendationKind;
    const idx = PRIORITY.indexOf(kind);
    if (idx !== -1 && idx < winnerPriority) {
      winnerPriority = idx;
      winnerKind = kind;
    }
  }

  const names = effects.map(e => e.name).join(', ');
  return {
    kind: winnerKind,
    explanation: `Active recovery effects: ${names}.`,
  };
}
