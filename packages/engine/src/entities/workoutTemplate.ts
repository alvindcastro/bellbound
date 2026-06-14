export interface Movement {
  name: string;
  reps?: number;
  rounds?: number;
  duration?: number;
  load?: number;
}

export interface TierDefinition {
  rounds: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  zoneName: string;
  category: string;
  defaultRest: number;
  tierStep: string;
  tiers: Record<string, TierDefinition>;
  movements: Movement[];
}
