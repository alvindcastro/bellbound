import type { AiClient } from './types.js';

export const noOpAiClient: AiClient = {
  isEnabled: () => false,
  parseNote: async () => null,
  generateLore: async () => null,
  parseWorkoutLines: async () => null,
};
