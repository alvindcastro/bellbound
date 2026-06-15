import type { Difficulty, ParsedMovement } from '@bellbound/engine';

export interface ParsedNote {
  difficulty: Difficulty;
  pressGrindy: boolean;
  breathless: boolean;
  gripCooked: boolean;
  legsSore: boolean;
}

export interface LoreContext {
  date: string;
  classification: string;
  difficulty?: string;
}

export interface AiClient {
  isEnabled(): boolean;
  parseNote(note: string): Promise<ParsedNote | null>;
  generateLore(context: LoreContext): Promise<string | null>;
  parseWorkoutLines(lines: string[]): Promise<ParsedMovement[] | null>;
}
