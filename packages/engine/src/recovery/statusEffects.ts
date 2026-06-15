import type { StatusEffect } from '../entities/statusEffect.js';
import type { Signals } from '../entities/signals.js';
import { SORENESS_EFFECT_DAYS } from '../config.js';
import { compareDemand } from '../council/compareDemand.js';

export function createStatusEffectsFromSignals(signals: Signals, createdDate: string): StatusEffect[] {
  const effects: StatusEffect[] = [];

  if (signals.pressGrindy) {
    effects.push({
      id: crypto.randomUUID(),
      name: 'Press Gremlin',
      source: 'pressGrindy',
      recommendationEffect: 'hold_pressing',
      expiryType: 'after_next_session',
      expiryParam: null,
      createdDate,
    });
  }

  if (signals.breathless) {
    effects.push({
      id: crypto.randomUUID(),
      name: 'Breathless Fog',
      source: 'breathless',
      recommendationEffect: 'hold_conditioning',
      expiryType: 'after_n_days',
      expiryParam: SORENESS_EFFECT_DAYS.breathlessFog,
      createdDate,
    });
  }

  if (signals.gripCooked) {
    effects.push({
      id: crypto.randomUUID(),
      name: 'Grip Curse',
      source: 'gripCooked',
      recommendationEffect: 'hold_carry',
      expiryType: 'after_n_days',
      expiryParam: SORENESS_EFFECT_DAYS.gripCurse,
      createdDate,
    });
  }

  if (signals.legsSore) {
    effects.push({
      id: crypto.randomUUID(),
      name: 'Squat Tax',
      source: 'legsSore',
      recommendationEffect: 'hold_squat',
      expiryType: 'after_n_days',
      expiryParam: SORENESS_EFFECT_DAYS.squatTax,
      createdDate,
    });
  }

  return effects;
}

export function createEffectsFromDemand(
  actual: Record<string, unknown>,
  prescribed: Record<string, unknown>,
  createdDate: string,
): StatusEffect[] {
  if (compareDemand(actual, prescribed) !== 'harder') return [];
  return [{
    id: crypto.randomUUID(),
    name: 'Overreached',
    source: 'demand_harder',
    recommendationEffect: 'repeat',
    expiryType: 'after_next_session',
    expiryParam: null,
    createdDate,
  }];
}

export function createPoorSleepGoblin(createdDate: string): StatusEffect {
  return {
    id: crypto.randomUUID(),
    name: 'Poor Sleep Goblin',
    source: 'poor_sleep',
    recommendationEffect: 'repeat',
    expiryType: 'manual',
    expiryParam: null,
    createdDate,
  };
}
