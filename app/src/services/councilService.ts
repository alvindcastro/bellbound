import { getCouncilRecommendation } from '@bellbound/engine';
import type { Recommendation } from '@bellbound/engine';
import { workoutLogRepository } from '../data/repositories/workoutLogRepository.js';

export async function getRecommendationForTemplate(templateId: string): Promise<Recommendation> {
  const logs = await workoutLogRepository.listByTemplateId(templateId, 5);
  return getCouncilRecommendation(logs);
}
