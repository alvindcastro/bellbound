import { QUEST_DEFINITIONS, evaluateQuestProgress, shouldGrantReward } from '@bellbound/engine';
import type { WorkoutLog } from '@bellbound/engine';
import { questRepository } from '../data/repositories/questRepository.js';
import { rewardRepository } from '../data/repositories/rewardRepository.js';
import { workoutLogRepository } from '../data/repositories/workoutLogRepository.js';

export async function evaluateAndPersistQuests(today: string): Promise<void> {
  const logs = await workoutLogRepository.listRecent(500);
  for (const def of QUEST_DEFINITIONS) {
    const existing = await questRepository.getById(def.id);
    const alreadyCompleted = existing?.completed ?? false;
    const progress = evaluateQuestProgress(def.id, logs);
    const nowComplete = shouldGrantReward(progress, def.required, alreadyCompleted);
    await questRepository.upsertProgress(def.id, progress, alreadyCompleted || nowComplete);
    if (nowComplete) {
      const r = def.reward;
      if (r.type === 'item') {
        await rewardRepository.grantItem({ id: r.id, name: r.name, flavourText: r.flavourText }, today);
      } else {
        await rewardRepository.grantTitle({ id: r.id, name: r.name, flavourText: r.flavourText }, today);
      }
    }
  }
}

export async function getQuestDisplayState() {
  const rows = await questRepository.getAll();
  return QUEST_DEFINITIONS.map(def => {
    const row = rows.find(r => r.id === def.id);
    return {
      definition: def,
      progress: row?.progress ?? 0,
      completed: row?.completed ?? false,
    };
  });
}
