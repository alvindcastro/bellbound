import type { DayType } from '../entities/enums.js';

export function getCompletionMessage(dayType: DayType, status?: string): string {
  if (dayType === 'kb') {
    if (status === 'completed') return 'You completed the workout. The bells remain unemployed.';
    if (status === 'modified') return 'You completed a modified session. The bells accept this, narrowly.';
    if (status === 'skipped') return 'Session logged as skipped. The bells noted it without comment.';
    return 'Session logged. The clerk makes a note.';
  }
  if (dayType === 'rest') return 'You rested. This confused the goblins but pleased your joints.';
  if (dayType === 'free') return 'Free day recorded. The ledger is satisfied.';
  return 'Session logged. The clerk makes a note.';
}
