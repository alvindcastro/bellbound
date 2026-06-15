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

  let bestIdx = PRIORITY.length;
  for (const effect of effects) {
    const idx = PRIORITY.indexOf(effect.recommendationEffect as RecommendationKind);
    if (idx !== -1 && idx < bestIdx) {
      bestIdx = idx;
    }
  }

  const kind = bestIdx < PRIORITY.length ? PRIORITY[bestIdx]! : 'maintain';
  const names = effects.map(e => e.name).join(', ');
  return { kind, explanation: `Active recovery effects: ${names}.` };
}
