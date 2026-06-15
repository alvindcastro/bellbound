import type { ChallengePath } from './enums.js';

export interface ChallengePathDefinition {
  id: ChallengePath;
  name: string;
  description: string;
}

export const CHALLENGE_PATH_DEFINITIONS: ChallengePathDefinition[] = [
  {
    id: 'clean_press',
    name: 'The Clean Press Path',
    description: 'Emphasis on clean and press strength. The press is the measure.',
  },
  {
    id: 'swing_marsh',
    name: 'The Swing Marsh Path',
    description: 'Conditioning focus. The swings do not stop.',
  },
  {
    id: 'recovery_rogue',
    name: 'The Recovery Rogue Path',
    description: 'A mandatory light day follows hard conditioning. Recovery is not optional.',
  },
  {
    id: 'minimalist',
    name: 'The Minimalist Path',
    description: 'Three training days per week. Each one counts more.',
  },
  {
    id: 'double_bell',
    name: 'The Double-Bell Path',
    description: 'Two double-bell sessions per week. Load doubles, patience required.',
  },
];
