import type { Weekday, ResolvedMovement, ResolvedWorkout } from '@bellbound/engine';
import { resolveWorkoutAtTier, applyChallengePath } from '@bellbound/engine';
import { blockRepository } from '../data/repositories/blockRepository.js';
import { weekTemplateRepository } from '../data/repositories/weekTemplateRepository.js';
import { workoutTemplateRepository } from '../data/repositories/workoutTemplateRepository.js';

export type { ResolvedMovement, ResolvedWorkout };

export type TodayResult =
  | { dayType: 'kb'; workout: ResolvedWorkout }
  | { dayType: 'rest' | 'free' | 'test' };

const WEEKDAYS: Weekday[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export function getWeekday(isoDate: string): Weekday {
  const d = new Date(isoDate + 'T00:00:00');
  return WEEKDAYS[d.getDay()]!;
}

export async function resolveToday(date: string): Promise<TodayResult> {
  const [weekTemplate, block] = await Promise.all([
    weekTemplateRepository.getDefault(),
    blockRepository.getActiveBlock(),
  ]);

  // Apply challenge path to get the effective day schedule for this block
  const effectiveTemplate = (weekTemplate && block)
    ? applyChallengePath(weekTemplate, block.challengePath)
    : weekTemplate;

  const weekday = getWeekday(date);
  const dayType = effectiveTemplate?.days[weekday] ?? 'rest';

  if (dayType !== 'kb') {
    return { dayType: dayType as 'rest' | 'free' | 'test' };
  }

  const template = await workoutTemplateRepository.getById('dkbs');

  if (!block || !template) {
    return { dayType: 'rest' };
  }

  return {
    dayType: 'kb',
    workout: resolveWorkoutAtTier(template, block.baselineTier),
  };
}
