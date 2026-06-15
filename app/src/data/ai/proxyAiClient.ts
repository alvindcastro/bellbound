import type { AiClient, ParsedNote, LoreContext } from './types.js';
import type { ParsedMovement } from '@bellbound/engine';
import { validateParsedNote, validateParsedMovements } from './parseValidator.js';

const MODEL = 'claude-haiku-4-5-20251001';

export function createProxyAiClient(proxyUrl: string, authToken: string): AiClient {
  return {
    isEnabled: () => true,

    async parseNote(note: string): Promise<ParsedNote | null> {
      try {
        const response = await fetch(`${proxyUrl}/api/ai`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            model: MODEL,
            max_tokens: 256,
            system:
              'You are a training log parser. Given a workout note, respond with ONLY valid JSON matching this schema: { "difficulty": "easy"|"normal"|"hard"|"failed", "pressGrindy": boolean, "breathless": boolean, "gripCooked": boolean, "legsSore": boolean }. No explanation, no markdown.',
            messages: [{ role: 'user', content: note }],
          }),
        });

        if (!response.ok) {
          return null;
        }

        const data = (await response.json()) as unknown;
        const text =
          data &&
          typeof data === 'object' &&
          'content' in data &&
          Array.isArray((data as Record<string, unknown>)['content']) &&
          (data as { content: Array<{ text?: unknown }> }).content[0]?.text;

        if (typeof text !== 'string') {
          return null;
        }

        return validateParsedNote(JSON.parse(text));
      } catch {
        return null;
      }
    },

    async generateLore(context: LoreContext): Promise<string | null> {
      try {
        const contextDescription = [
          `Date: ${context.date}`,
          `Classification: ${context.classification}`,
          context.difficulty ? `Difficulty: ${context.difficulty}` : null,
        ]
          .filter(Boolean)
          .join(', ');

        const response = await fetch(`${proxyUrl}/api/ai`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            model: MODEL,
            max_tokens: 128,
            system:
              'You are a dry RPG flavour text generator for a kettlebell training log. Write exactly one short, dry, flavourful sentence describing the session. No cheerleading, no health advice.',
            messages: [{ role: 'user', content: contextDescription }],
          }),
        });

        if (!response.ok) {
          return null;
        }

        const data = (await response.json()) as unknown;
        const text =
          data &&
          typeof data === 'object' &&
          'content' in data &&
          Array.isArray((data as Record<string, unknown>)['content']) &&
          (data as { content: Array<{ text?: unknown }> }).content[0]?.text;

        if (typeof text !== 'string') {
          return null;
        }

        return text;
      } catch {
        return null;
      }
    },

    async parseWorkoutLines(lines: string[]): Promise<ParsedMovement[] | null> {
      if (lines.length === 0) return [];
      try {
        const linesText = lines.join('\n');
        const response = await fetch(`${proxyUrl}/api/ai`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            model: MODEL,
            max_tokens: 1024,
            system:
              'You are a kettlebell workout text parser. Given lines of workout text that a simple parser could not understand, respond with ONLY valid JSON: an array of movement objects. Each object must have: "name" (string), "sets" (positive integer), "eachSide" (boolean). Optional fields: "reps" (number), "repMax" (number), "duration" (number, seconds), "load" (number, kg), "loadFallback" (number, kg). If you cannot parse a line, omit it. No explanation, no markdown, no code fences — just the JSON array.',
            messages: [{ role: 'user', content: linesText }],
          }),
        });

        if (!response.ok) return null;

        const data = (await response.json()) as unknown;
        const text =
          data &&
          typeof data === 'object' &&
          'content' in data &&
          Array.isArray((data as Record<string, unknown>)['content']) &&
          (data as { content: Array<{ text?: unknown }> }).content[0]?.text;

        if (typeof text !== 'string') return null;

        return validateParsedMovements(JSON.parse(text));
      } catch {
        return null;
      }
    },
  };
}
