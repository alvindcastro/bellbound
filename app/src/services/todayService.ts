import type { Weekday, WorkoutTemplate } from '@bellbound/engine';
import { blockRepository } from '../data/repositories/blockRepository.js';
import { weekTemplateRepository } from '../data/repositories/weekTemplateRepository.js';
import { workoutTemplateRepository } from '../data/repositories/workoutTemplateRepository.js';

export type ResolvedMovement = {
  name: string;
  rounds: number;
  reps?: number;
  duration?: number;
  load?: number;
};

export type ResolvedWorkout = {
  templateId: string;
  name: string;
  zoneName: string;
  category: string;
  rounds: number;
  movements: ResolvedMovement[];
  defaultRest: number;
};

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

export function resolveTierWorkout(template: WorkoutTemplate, tier: number): ResolvedWorkout {
  const tierDef = template.tiers[String(tier)];
  if (!tierDef) {
    throw new Error(`Tier ${tier} not found in template ${template.id}`);
  }
  const rounds = tierDef.rounds;
  const movements: ResolvedMovement[] = template.movements.map((m) => ({
    name: m.name,
    rounds,
    ...(m.reps !== undefined ? { reps: m.reps } : {}),
    ...(m.duration !== undefined ? { duration: m.duration } : {}),
    ...(m.load !== undefined ? { load: m.load } : {}),
  }));
  return {
    templateId: template.id,
    name: template.name,
    zoneName: template.zoneName,
    category: template.category,
    rounds,
    movements,
    defaultRest: template.defaultRest,
  };
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
    workout: resolveTierWorkout(template, block.baselineTier),
  };
}
