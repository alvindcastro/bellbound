import Dexie, { type Table } from 'dexie';

// Row types live in the data layer — they do not import from @bellbound/engine.
// Shapes mirror the engine entities but are owned here.

interface CharacterStats {
  strength: number;
  conditioning: number;
  control: number;
  consistency: number;
  recovery: number;
  judgment: number;
}

export interface CharacterRow {
  userId: string;
  characterName: string;
  className: string;
  level: number;
  stats: CharacterStats;
}

export interface BlockRow {
  id: string;
  name: string;
  baselineTier: number;
  startDate: string;
  status: string;
  testGuardMinSessions: number;
  completedPlannedKbSessions: number;
}

export interface WeekTemplateRow {
  id: string;
  days: Record<string, string>;
}

interface MovementRow {
  name: string;
  reps?: number;
  rounds?: number;
  duration?: number;
  load?: number;
}

export interface WorkoutTemplateRow {
  id: string;
  name: string;
  zoneName: string;
  category: string;
  defaultRest: number;
  tierStep: string;
  tiers: Record<string, { rounds: number }>;
  movements: MovementRow[];
}

interface SignalsRow {
  pressGrindy: boolean;
  breathless: boolean;
  gripCooked: boolean;
  legsSore: boolean;
}

export interface WorkoutLogRow {
  id: string;
  date: string;
  blockId: string;
  plannedDayType: string;
  actualDayType: string;
  source: string;
  category: string;
  plannedWorkout: Record<string, unknown>;
  actualWorkout: Record<string, unknown>;
  status: string;
  difficulty: string;
  signals: SignalsRow;
  originalNote: string;
  structuredNotes: Record<string, unknown>;
}

export interface DailyContextRow {
  date: string;
  hoursSlept: number | null;
  bodyweight: number | null;
  foodNote: string | null;
}

export interface StatusEffectRow {
  id: string;
  name: string;
  source: string;
  recommendationEffect: string;
  expiryType: string;
  expiryParam: number | null;
  createdDate: string;
}

class BellboundDb extends Dexie {
  characters!: Table<CharacterRow, string>;
  blocks!: Table<BlockRow, string>;
  weekTemplates!: Table<WeekTemplateRow, string>;
  workoutTemplates!: Table<WorkoutTemplateRow, string>;
  workoutLogs!: Table<WorkoutLogRow, string>;
  dailyContext!: Table<DailyContextRow, string>;
  statusEffects!: Table<StatusEffectRow, string>;

  constructor() {
    super('bellbound');
    this.version(1).stores({
      characters: 'userId',
      blocks: 'id',
      weekTemplates: 'id',
      workoutTemplates: 'id',
      workoutLogs: 'id, date, blockId',
      dailyContext: 'date',
      statusEffects: 'id',
    });
  }
}

export const db = new BellboundDb();
