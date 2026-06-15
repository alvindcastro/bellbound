# Bellbound Phase 7: DailyContext and Recovery Mechanics — Build Tasks

Detailed, tickable tasks for Phase 7 on the committed stack. Phase 7 builds the status effect system: the recovery brain that fills the priority slot Phase 6 left empty. It implements the expiry-type enum, multi-effect stacking with most-conservative resolution, and the DailyContext entity for sleep, bodyweight, and food.

Prerequisite: Phase 0 through 6 complete. The Council priority order exists with slot 2 (recovery blocker) stubbed (Phase 6). Signal flags are captured (Phase 6).

Goal of Phase 7: sleep and soreness produce typed, expiring status effects; multiple effects stack to the most conservative recommendation; the Council reads them through the slot reserved in Phase 6; and bodyweight and food are stored but never feed any engine logic.

Reference: bellbound_rpg_mode_v4.md (Status Effects, DailyContext, Recovery as a First-Class Mechanic), bellbound_feature_build_plan_v1.md (Phase 7), bellbound_build_plan_updates_v1.md (item 3 fatigue collapsed, item 4 Poor Sleep Goblin expiry pinned, item 5 source-agnostic triggers), bellbound_tech_stack_committed_pwa_v1.md.

State management: as decided in Phase 6. If Zustand was adopted, use it; if not, React state still.

---

## TDD Protocol (Phase 7)

Strict red-green-refactor. The status system is pure logic plus a DailyContext table; almost all test-first.

Test-first (Vitest, pure engine):
- Status effect creation from signals and sleep.
- Expiry evaluation per expiry type against a given date/state.
- Multi-effect stacking and most-conservative resolution.
- The Council integration: effects fed into priority slot 2.

Test-first (Vitest, fake-indexeddb):
- DailyContext read/write.
- Active status effects persisted and queried.

Verify manually:
- The DailyContext input UI (sleep, bodyweight, food) and the effect display.

Discipline unchanged. Commit on green. This phase is second only to Phase 6 in how much the testing matters.

---

## Section A: DailyContext Entity

- [x] Confirm the DailyContext Dexie table exists (defined in Phase 0): `date` (primary), `hoursSlept`, `bodyweight`, `foodNote`, all nullable. If not present, add it now with a migration.
- [x] RED first: write failing repository tests (fake-indexeddb) for DailyContext write and read by date, including upsert behavior (logging sleep then later adding bodyweight for the same date updates, not duplicates). Then implement the repository.
- [x] Build a simple UI to log DailyContext: hours slept (number), bodyweight (number, optional), food note (freeform, optional). This is logged independently of whether a workout happened.
- [x] Critical: bodyweight and foodNote are stored only. Write a test or an explicit code-level guard ensuring neither is ever passed into a status-effect or recommendation function. They never produce effects, scores, or commentary.

## Section B: Status Effect Creation

- [x] RED first: write failing tests for pure functions that create status effects from inputs, then implement:
    - From `hoursSlept` below a threshold → Poor Sleep Goblin (recommendation: block aggressive progression).
    - From `pressGrindy` → Press Gremlin (hold/reduce pressing).
    - From `breathless` → Breathless Fog (add rest / repeat conditioning).
    - From `gripCooked` → Grip Curse (reduce carry finisher).
    - From `legsSore` → Squat Tax (keep squat volume conservative).
- [x] Each created effect carries: id, name, source, recommendationEffect, expiryType, expiryParam.
- [x] Triggers are source-agnostic: an effect is created from a signal regardless of whether the log was `planned` or `off_block`. Test that a signal on an off_block log creates the same effect as on a planned log. (The off_block input path itself arrives in Phase 10; the engine must already be source-agnostic here.)

## Section C: Expiry Types

- [x] RED first: write failing tests for an expiry evaluation function `isExpired(effect, context)` for each expiry type, then implement:
    - `after_next_rest_day`: expired once a completed rest day has occurred since creation.
    - `after_next_session`: expired once the relevant work is trained again normally.
    - `after_n_days`: expired when `expiryParam` days have passed.
    - `after_successful_light_session`: expired when a light/technique session is logged.
    - `manual`: never auto-expires.
- [x] Map the existing effects to expiry types: Press Gremlin → after_next_session; Breathless Fog → after_n_days (param 3); Squat Tax → after_n_days (param 3); Grip Curse → after_n_days (param 2); Poor Sleep Goblin → see Section D.
- [x] Test boundary conditions: exactly N days (decide inclusive/exclusive and document), a rest day occurring vs not, etc.

## Section D: Poor Sleep Goblin Expiry (Pinned Decision)

- [x] Implement the pinned rule: Poor Sleep Goblin clears on whichever comes first — a completed rest day, OR a logged night at or above `SLEEP_OK_HOURS`.
- [x] RED first: write failing tests for both clear paths and the first-of behavior: clears on a rest day before any good-sleep night; clears on a good-sleep night before any rest day; persists across a training day with continued poor sleep. Then implement.
- [x] This replaces the earlier unresolved OR. Implement as a first-of check, not a single expiry type. `SLEEP_OK_HOURS` comes from engine config.

## Section E: Multi-Effect Stacking

The real case: poor sleep after a hard session with soreness produces several effects at once, each with its own expiry, resolved to the most conservative recommendation.

- [x] RED first: write failing tests for the stacking resolver: given a set of active effects, apply every restriction and return the most conservative combined recommendation. Then implement.
- [x] Test the canonical case: Poor Sleep Goblin + Squat Tax + Press Gremlin active together → repeat baseline, keep squats light, hold pressing, all applied. Not averaged. A good indicator does not cancel any of them.
- [x] Test independence of expiry: each effect clears on its own schedule; clearing one does not clear the others.
- [x] The resolver never lets a positive signal override an active blocker (same most-conservative principle as Phase 6).

## Section F: Council Integration

- [x] Feed active, non-expired status effects into Council priority slot 2 (reserved in Phase 6: "active recovery blocker", above movement-specific signals and difficulty).
- [x] RED first: write failing tests that an active Poor Sleep Goblin blocks aggressive progression even when the session was logged normal twice (slot 2 beats slot 5/6). Then confirm via the integrated Council function.
- [x] Confirm the Phase 6 priority order did not need restructuring; the effects drop into the existing slot. If restructuring was needed, the Phase 6 slot was wrong; fix and re-test both.

## Section G: Recovery Rewards Intact

- [x] Confirm rest-day rewards and deload framing (from the concept) are not touched by status effects or by decay logic (decay is deferred entirely). Resting correctly is always positive.
- [x] No guilt copy anywhere in the recovery system. A status effect is framed as context ("presses were grindy, holding pressing"), not as a scold.

## Section H: Persistence and Offline

- [x] Confirm DailyContext, active effects, and their expiry evaluation all work offline from local data.
- [x] No network calls introduced in Phase 7.

## Section I: Phase 7 Done When

- [x] DailyContext stores sleep, bodyweight, and food independently of workouts; bodyweight and food never feed any engine function (guarded and tested).
- [x] Poor sleep can block aggressive progression via a status effect.
- [x] Each effect has a typed expiry that evaluates correctly, including the pinned Poor Sleep Goblin first-of rule.
- [x] Multiple effects stack and the most conservative recommendation wins; a good signal cannot cancel a blocker; effects expire independently.
- [x] Status effects feed Council priority slot 2 without restructuring the Phase 6 order.
- [x] Rest rewards remain positive; no guilt copy.
- [x] All logic written test-first; engine pure; no effect logic in components.
- [x] Works offline.
- [x] Committed on green, pushed, with a clear Phase 7 commit message.

---

## Explicit Exclusions (do not build in Phase 7)

- Stat decay (deferred entirely; strict rules recorded for if it is ever added)
- Any numeric fatigue model (there is none; recovery is status effects only)
- Off-block activity logging UI (Phase 10; the engine is source-agnostic now, but the input path comes later)
- Stats (Phase 8)
- Bodyweight or food commentary, scoring, or effects (forbidden permanently)
- Ascension, quests, items (their phases)

## Watch-Outs

- Source-agnostic now, input path later. The status engine must create effects from any log's signals regardless of source, even though off_block logging does not exist until Phase 10. Test this now so Phase 10 only adds the input, not engine changes.
- The canonical multi-effect case is the reason the whole expiry-type design exists. Poor sleep + soreness + grindy press at once, each clearing on its own schedule, resolved most-conservatively. If your design cannot represent that cleanly, the schema is wrong, not the test.
- Bodyweight and food are inert by design. The most likely accidental violation in this phase is wiring bodyweight into some "insight". Do not. Guard it. This protects against the disordered-eating failure mode the design explicitly avoids.
- Conservative still wins, now across effects too. Same principle as Phase 6, extended: a blocking effect is never overridden by a positive signal, and stacked effects combine restrictions rather than averaging.
- Decay stays out. It is tempting to add "stat decay after inactivity" here since this is the recovery phase. Do not. It is deferred with strict rules for a reason; adding it now risks the guilt mechanic the design forbids.
