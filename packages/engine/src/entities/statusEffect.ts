import type { ExpiryType } from './enums.js';

export interface StatusEffect {
  id: string;
  name: string;
  source: string;
  recommendationEffect: string;
  expiryType: ExpiryType;
  expiryParam: number | null;
}
