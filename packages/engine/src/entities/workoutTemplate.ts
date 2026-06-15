export interface Movement {
  name: string;
  reps?: number;
  rounds?: number;
  duration?: number;
  load?: number;
  loadFallback?: number; // "24 or 16 kg" → load=24, loadFallback=16
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
