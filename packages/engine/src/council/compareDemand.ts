export type DemandResult = 'easier' | 'equivalent' | 'harder' | 'uncertain';

type MovementSnap = { load?: number; reps?: number; duration?: number };
type WorkoutSnap = { templateId?: string; rounds?: number; movements?: MovementSnap[] };

function avgLoad(movements: MovementSnap[]): number | null {
  const loaded = movements.filter(m => m.load !== undefined);
  if (loaded.length === 0) return null;
  return loaded.reduce((s, m) => s + (m.load ?? 0), 0) / loaded.length;
}

export function compareDemand(
  actual: Record<string, unknown>,
  prescribed: Record<string, unknown>,
): DemandResult {
  const a = actual as WorkoutSnap;
  const p = prescribed as WorkoutSnap;

  // Same templateId → no swap, demand is equivalent
  if (a.templateId && p.templateId && a.templateId === p.templateId) return 'equivalent';

  // Neither has any data → legacy log (pre-Phase 15) or no swap; treat as equivalent
  // so the pre-existing progression logic for sessions without workout snapshots is unchanged.
  const hasAny = (w: WorkoutSnap) => w.templateId !== undefined || w.rounds !== undefined || w.movements !== undefined;
  if (!hasAny(a) && !hasAny(p)) return 'equivalent';

  // Need movement data from both to compare
  if (a.rounds === undefined || p.rounds === undefined || !a.movements || !p.movements) {
    return 'uncertain';
  }

  const roundsSignal = Math.sign(a.rounds - p.rounds);

  const aLoad = avgLoad(a.movements);
  const pLoad = avgLoad(p.movements);
  const loadSignal = (aLoad !== null && pLoad !== null) ? Math.sign(aLoad - pLoad) : 0;

  const nonZero = [roundsSignal, loadSignal].filter(s => s !== 0);

  if (nonZero.length === 0) return 'equivalent';
  if (nonZero.every(s => s < 0)) return 'easier';
  if (nonZero.every(s => s > 0)) return 'harder';
  return 'uncertain';
}
