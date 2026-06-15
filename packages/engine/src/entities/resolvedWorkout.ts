export interface ResolvedMovement {
  name: string;
  rounds: number;
  reps?: number;
  duration?: number;
  load?: number;
}

export interface ResolvedWorkout {
  templateId: string;
  name: string;
  zoneName: string;
  category: string;
  rounds: number;
  movements: ResolvedMovement[];
  defaultRest: number;
}
