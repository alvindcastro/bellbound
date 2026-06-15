import { getCouncilRecommendation, isExpired, plannedDayType, resolveActiveEffects } from '@bellbound/engine';
import type { Recommendation, StatusEffect, ExpiryContext } from '@bellbound/engine';
import { workoutLogRepository } from '../data/repositories/workoutLogRepository.js';
import { statusEffectRepository } from '../data/repositories/statusEffectRepository.js';
import { dailyContextRepository } from '../data/repositories/dailyContextRepository.js';
import { weekTemplateRepository } from '../data/repositories/weekTemplateRepository.js';

function datesBetweenExclusiveInclusive(startExclusive: string, endInclusive: string): string[] {
  const dates: string[] = [];
  const cur = new Date(startExclusive + 'T00:00:00.000Z');
  cur.setUTCDate(cur.getUTCDate() + 1);
  const end = new Date(endInclusive + 'T00:00:00.000Z');
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

export async function getRecommendationForTemplate(templateId: string): Promise<Recommendation> {
  const today = new Date().toISOString().slice(0, 10);

  // Fetch all needed data
  const templateLogs = await workoutLogRepository.listByTemplateId(templateId, 5);
  const allRecentLogs = await workoutLogRepository.listRecent(30);
  const allEffects = await statusEffectRepository.listAll();
  const allDailyContext = await dailyContextRepository.listAll();
  const weekTemplate = await weekTemplateRepository.getDefault();

  // Determine which effects are still active (not expired)
  const activeEffects: StatusEffect[] = [];
  for (const effect of allEffects) {
    const logsAfterCreation = allRecentLogs.filter(l => l.date > effect.createdDate);
    const hoursSleptAfterCreation = allDailyContext
      .filter(c => c.date > effect.createdDate && c.hoursSlept !== null)
      .map(c => c.hoursSlept as number);

    let restDaysPassedSinceCreation = false;
    if (weekTemplate) {
      const dates = datesBetweenExclusiveInclusive(effect.createdDate, today);
      restDaysPassedSinceCreation = dates.some(
        d => plannedDayType(d, weekTemplate) === 'rest',
      );
    }

    const context: ExpiryContext = {
      currentDate: today,
      logsAfterCreation,
      hoursSleptAfterCreation,
      restDaysPassedSinceCreation,
    };

    if (!isExpired(effect, context)) {
      activeEffects.push(effect);
    }
  }

  // Active effects block progression even when no template logs exist yet.
  // getCouncilRecommendation returns 'maintain' when recentLogs is empty, bypassing
  // the effects check; resolve effects here so they are never silently ignored.
  if (activeEffects.length > 0 && templateLogs.length === 0) {
    return resolveActiveEffects(activeEffects);
  }

  return getCouncilRecommendation(templateLogs, activeEffects);
}
