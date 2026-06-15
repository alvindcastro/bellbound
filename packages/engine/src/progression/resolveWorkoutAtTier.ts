import type { WorkoutTemplate } from '../entities/workoutTemplate.js';
import type { ResolvedMovement, ResolvedWorkout } from '../entities/resolvedWorkout.js';

export function resolveWorkoutAtTier(template: WorkoutTemplate, tier: number): ResolvedWorkout {
  const tierDef = template.tiers[String(tier)];
  if (tierDef === undefined) {
    throw new Error(`Tier ${tier} not found in template ${template.id}`);
  }

  const rounds = tierDef.rounds;

  const movements: ResolvedMovement[] = template.movements.map(m => {
    const resolved: ResolvedMovement = { name: m.name, rounds };
    if (m.reps !== undefined) resolved.reps = m.reps;
    if (m.duration !== undefined) resolved.duration = m.duration;
    if (m.load !== undefined) resolved.load = m.load;
    return resolved;
  });

  return {
    templateId: template.id,
    name: template.name,
    zoneName: template.zoneName,
    category: template.category,
    rounds,
    movements,
    defaultRest: template.defaultRest,
  };
}
