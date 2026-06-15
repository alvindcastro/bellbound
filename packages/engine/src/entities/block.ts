import type { BlockStatus, ChallengePath } from './enums.js';

export interface Block {
  id: string;
  name: string;
  baselineTier: number;
  startDate: string;
  status: BlockStatus;
  testGuardMinSessions: number;
  completedPlannedKbSessions: number;
  challengePath?: ChallengePath | null;
}
