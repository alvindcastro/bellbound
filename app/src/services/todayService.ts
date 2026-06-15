import type { Weekday, ResolvedMovement, ResolvedWorkout } from '@bellbound/engine';
import { resolveWorkoutAtTier } from '@bellbound/engine';
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
  const weekTemplate = await weekTemplateRepository.getDefault();
  const weekday = getWeekday(date);
  const dayType = weekTemplate?.days[weekday] ?? 'rest';

  if (dayType !== 'kb') {
    return { dayType: dayType as 'rest' | 'free' | 'test' };
  }

  const block = await blockRepository.getActiveBlock();
  const template = await workoutTemplateRepository.getById('dkbs');

  if (!block || !template) {
    return { dayType: 'rest' };
  }

  return {
    dayType: 'kb',
    workout: resolveWorkoutAtTier(template, block.baselineTier),
  };
}
