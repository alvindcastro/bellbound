import type { BlockStatus } from './enums.js';

export interface Block {
  id: string;
  name: string;
  baselineTier: number;
  startDate: string;
  status: BlockStatus;
  testGuardMinSessions: number;
  completedPlannedKbSessions: number;
}
