# Bellbound Build Plan: Updates and Corrections

These are corrections to the v1 feature build plan. They resolve sequencing problems, undefined quantities, and consistency gaps with the v4 concept. Apply these on top of the existing plan; nothing here replaces the phase structure, which is sound.

---

# 1. Signal Flags Lifecycle Across Phases 0, 1, 6

The `signals` field on WorkoutLog is touched by three phases. State the lifecycle explicitly so no one drops or misuses the field.

- Phase 0 defines the WorkoutLog schema including `signals`, with all flags defaulting to false.
- Phase 1 leaves `signals` at default. The user logs difficulty and a freeform note only. The field exists but is not populated.
- Phase 6 begins populating `signals`, either through manual toggles in the log UI or, later, the AI parser in Phase 13.
- Phase 7 reads `signals` to trigger status effects.

The field is defined once and stays in the schema from Phase 0. Do not add or remove it between phases. It is intentionally empty until Phase 6.

---

# 2. completedPlannedKbSessions Counter Ownership

The Block field `completedPlannedKbSessions` is defined in Phase 0 and read by the ascension guard in Phase 11, but no phase maintained it. Assign the increment.

- Phase 2 owns the increment. Phase 2 is where planned vs actual is computed, so it is where the app knows a session was both planned KB and completed.
- Rule: when a WorkoutLog is saved with plannedDayType = kb, status = completed, and source = planned, increment the current block's completedPlannedKbSessions by 1.
- The counter resets to 0 when a new block opens (Phase 11).

Without this, the Phase 11 guard reads a counter nothing has been writing. Phase 2's Done When should add: the block's completed planned KB session count increments correctly and survives app reload.

---

# 3. Fatigue: Define It or Collapse It

The plan uses "feeds fatigue" in Phase 10 but never defines fatigue as an entity, score, or accumulation rule. "Feeds fatigue" is currently undefined behavior, and Phase 10's Done When cannot be verified against an undefined quantity.

Decision: collapse fatigue into the existing status effect system. Do not build a separate fatigue score.

- Replace every instance of "feeds fatigue" with "can trigger status effects" throughout Phase 10.
- An off-block run that was hard can set the breathless signal, which triggers Breathless Fog. That is the entire mechanism. There is no numeric fatigue meter.
- This keeps the recovery model to one system (status effects with conservative stacking) instead of two (status effects plus a fatigue score that would need its own decay, thresholds, and tuning).

Phase 10 Done When, revised: off-block training can trigger the same status effects as planned training, and those effects influence the next recommendation through the existing Council priority order.

If a numeric fatigue model is wanted later, it is a deferred feature with its own phase, not an undefined side effect of Phase 10.

---

# 4. Poor Sleep Goblin Expiry: Pinned

v4 left this as "after_next_rest_day or after_next_session." An OR is not executable. Pin it in Phase 7, which is where the effect is built.

Decision: Poor Sleep Goblin expires after_next_rest_day.

Reasoning: sleep debt is resolved by rest, not by training through it. Clearing the goblin on the next normal session would let the user train past poor sleep and have the warning disappear, which is the opposite of the intent. Tying expiry to a completed rest day means the effect persists across training days until the user actually rests, which is the conservative and correct behavior.

If poor sleep recovers before the next scheduled rest day (the user logs good sleep on a subsequent night), that is a separate clear condition the engine may apply: a logged night at or above a sleep threshold also clears the goblin. State the threshold as a tunable parameter, e.g. SLEEP_OK_HOURS = 7. So the effect clears on whichever comes first: a completed rest day, or a logged night at or above SLEEP_OK_HOURS.

This replaces the OR with a defined first-of rule.

---

# 5. Off-Block Activities Can Trigger Status Effects in Phase 7

Phase 7 status effect examples are all planned-session signals. Phase 10 (which ships later) assumes off-block training can affect recommendations. Clarify the boundary.

- Phase 7 status effects are triggered by signals on any WorkoutLog, regardless of source, as long as the log carries the signal. The trigger reads the signal flag, not the source.
- However, off-block logging UI does not exist until Phase 10. So in practice, between Phase 7 and Phase 10, only planned and rest logs exist to carry signals.
- This means the Saturday-barbell-wrecks-Monday case (a hard free-day session setting legsSore, triggering Squat Tax, pulling back Monday) does not function until Phase 10 ships the off-block logging path. The status effect engine is ready in Phase 7; the input path arrives in Phase 10.

State in Phase 7: the status effect trigger is source-agnostic and reads signal flags only. State in Phase 10: off-block logs now carry signals into the existing Phase 7 status engine, which enables free-day activity to affect subsequent recommendations.

---

# 6. Activity Source Selection for Ambiguous Activities

Hiking appears as both off_block (light Conditioning) and recovery_skill depending on intensity. The plan does not say who decides the source for an ambiguous activity.

- The user selects the source class when logging a free-day or off-routine activity.
- Provide a sensible default per activity type so the common case is one tap: run defaults to off_block, yoga defaults to recovery_skill, walk defaults to recovery_skill, hike defaults to recovery_skill, barbell defaults to off_block, pickleball defaults to off_block.
- The user can override the default at log time (a hard hike can be reclassified to off_block Conditioning).

This belongs in Phase 10, where off-block and free-day logging is built. Add to Phase 10 Done When: ambiguous activities have a default source and the user can override it before saving.

---

# 7. Phase 8 Stat Accumulation Window

Phase 8 defines campaign stats and a reset-on-block-close behavior, but block close does not exist until Phase 11. Between Phase 8 and Phase 11, stats only grow with no reset path. This is expected, not the inflation bug, but note it so it is not mistaken for one.

- Add to Phase 8: until ascension exists (Phase 11), campaign stats accumulate without resetting. This is acceptable for the 8-to-10 build window. The reset path is wired when block close is built in Phase 11.

No code change in Phase 8. This is a documentation note to prevent a false bug report during the interim window.

---

# Summary of Changes by Phase

| Phase | Change |
|---|---|
| 0 | Note that `signals` is defined now, defaults false, populated later |
| 1 | Note that `signals` stays at default; only difficulty and note are logged |
| 2 | Owns the completedPlannedKbSessions increment; add to Done When |
| 6 | Begins populating `signals` |
| 7 | Pin Poor Sleep Goblin expiry to after_next_rest_day or SLEEP_OK_HOURS, first-of; state status triggers are source-agnostic |
| 8 | Note stats accumulate with no reset until Phase 11 |
| 10 | Replace "feeds fatigue" with "can trigger status effects"; add source default/override for ambiguous activities; note off-block now feeds the Phase 7 engine |
| 11 | Counter resets to 0 on new block open |

---

# Tunable Parameters Introduced

| Parameter | Default | Used In |
|---|---|---|
| TEST_GUARD_MIN_SESSIONS | 6 | Phase 11 ascension guard (already in v4) |
| SLEEP_OK_HOURS | 7 | Phase 7 Poor Sleep Goblin clear condition (new) |
| Soreness effect durations (after_n_days) | 1 to 3 | Phase 7 Squat Tax, Grip Curse, Breathless Fog (from v4) |

All three should be defined in one config location, not scattered across the engine.
