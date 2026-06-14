export interface CharacterStats {
  strength: number;
  conditioning: number;
  control: number;
  consistency: number;
  recovery: number;
  judgment: number;
}

export interface Character {
  userId: string;
  characterName: string;
  className: string;
  level: number;
  stats: CharacterStats;
}
