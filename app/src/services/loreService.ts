import { getCompletionMessage } from '@bellbound/engine';
import type { WorkoutLog } from '@bellbound/engine';
import type { AiClient } from '../data/ai/types.js';
import { loreRepository } from '../data/repositories/loreRepository.js';
import type { LoreRow } from '../data/db/bellboundDb.js';

export async function generateAndStoreLore(
  log: WorkoutLog,
  aiClient: AiClient
): Promise<string> {
  const aiText = aiClient.isEnabled()
    ? await aiClient.generateLore({ date: log.date, classification: log.actualDayType, difficulty: log.difficulty })
    : null;

  const text = aiText ?? getCompletionMessage(log.actualDayType as 'kb' | 'rest' | 'free' | 'test', log.status);
  const source: LoreRow['source'] = aiText ? 'ai' : 'deterministic';

  await loreRepository.put({
    id: `lore-${log.id}`,
    logId: log.id,
    text,
    generatedAt: log.date,
    source,
  });

  return text;
}
