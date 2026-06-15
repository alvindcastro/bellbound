import type { ParsedMovement } from '@bellbound/engine';
import type { WorkoutTemplate } from '@bellbound/engine';
import { db } from '../data/db/bellboundDb.js';

export async function saveParsedTemplate(
  name: string,
  movements: ParsedMovement[],
  defaultRest: number,
): Promise<string> {
  const id = `custom-${crypto.randomUUID()}`;
  const sets = movements[0]?.sets ?? 1;

  const template: WorkoutTemplate = {
    id,
    name,
    zoneName: name,
    category: 'kettlebell',
    defaultRest,
    tierStep: 'Fixed (pasted)',
    tiers: { '1': { rounds: sets } },
    movements: movements.map(m => ({
      name: m.name,
      reps: m.reps,
      duration: m.duration,
      load: m.load,
      loadFallback: m.loadFallback,
    })),
  };

  await db.workoutTemplates.put(template);
  return id;
}
