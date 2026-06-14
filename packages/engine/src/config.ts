// Tunable constants — single source of truth for the engine.
// Change here and the effect propagates everywhere; do not hardcode these values elsewhere.
export const TEST_GUARD_MIN_SESSIONS = 6;
export const SLEEP_OK_HOURS = 7;

// Days until a soreness-derived status effect expires (after_n_days expiry type).
export const SORENESS_EFFECT_DAYS = {
  breathlessFog: 3,
  squatTax: 3,
  gripCurse: 2,
} as const;
