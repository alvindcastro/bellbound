import type { DayType } from './enums.js';

export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface WeekTemplate {
  id: string;
  days: Record<Weekday, DayType>;
}
