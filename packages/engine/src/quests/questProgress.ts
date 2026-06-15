import type { WorkoutLog } from '../entities/workoutLog.js';

export function evaluateQuestProgress(questId: string, logs: WorkoutLog[]): number {
  const active = (l: WorkoutLog) => l.status === 'completed' || l.status === 'modified';

  switch (questId) {
    case 'survive_baseline':
      return logs.filter(l => active(l) && l.source === 'planned' && l.actualDayType === 'kb').length;
    case 'wise_regression':
      return logs.filter(l => active(l) && l.actualDayType === 'kb' && l.difficulty === 'easy').length;
    case 'good_swap':
      return logs.filter(l => active(l) && l.source === 'off_block').length;
    default:
      return 0;
  }
}
