import type { WeekTemplate } from '../entities/weekTemplate.js';
import type { ChallengePath } from '../entities/enums.js';

export function applyChallengePath(
  template: WeekTemplate,
  path: ChallengePath | null | undefined,
): WeekTemplate {
  if (!path) return template;

  if (path === 'minimalist') {
    // Reduce from 4 KB days to 3 by changing Tuesday from KB to rest.
    // Monday, Thursday, Friday remain KB. This is a deterministic, fixed change.
    return {
      ...template,
      days: {
        ...template.days,
        tuesday: 'rest',
      },
    };
  }

  // All other paths: day-type emphasis is unchanged at Phase 12.
  // Clean Press, Swing Marsh, Recovery Rogue, Double Bell modify workout
  // selection emphasis in a future phase. Day types are unchanged here.
  return template;
}
