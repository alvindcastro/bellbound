# Bellbound Phase 11: Test Workout and Ascension — Build Tasks

Detailed, tickable tasks for Phase 11 on the committed stack. Phase 11 is the keystone: it closes every loop deferred since Phase 2. The test workout, the ascension guard that reads the KB session counter, the tier bump, the stat reset, the counter reset, and permanent lessons all land here.

Prerequisite: Phase 0 through 10 complete. Specifically: the counter `completedPlannedKbSessions` is maintained (Phase 2), tier resolution is in the engine and a tier change propagates (Phase 3), stats accumulate with no reset (Phase 8), and the Council/status systems exist (Phase 6/7).

Goal of Phase 11: a user-invoked test workout, gated by a numeric completion guard, closes the current block, banks a permanent lesson, resets stats and the counter, and opens the next block one tier higher. The week template keeps running; ascension is a checkpoint, not a calendar event.

Reference: bellbound_rpg_mode_v4.md (Blocks and Baseline, The Test Workout, Ascension Guard, Ascension Is Block-End, Permanent Lessons), bellbound_feature_build_plan_v1.md (Phase 11), bellbound_build_plan_updates_v1.md (counter ownership and reset), and the deferred markers left in Phases 2, 3, and 8.

State management: as decided earlier.

---

## TDD Protocol (Phase 11)

Strict red-green-refactor, and like Phase 6 and 7 this is a high-stakes phase: it mutates block, tier, stats, and counter together. Test the guard and the transition thoroughly.

Test-first (Vitest, pure engine):
- The ascension guard decision (is a test eligible to count).
- The block-transition computation (given a closing block, produce the next block's tier and the banked lesson; pure).

Test-first (Vitest, fake-indexeddb):
- The full ascension transaction: close block, reset stats, reset counter, open next block, persist permanent lessons.

Verify manually:
- The test-workout invocation UI and the ascension confirmation/celebration screen.

Discipline: the engine decides (eligibility, next tier, lesson); the app performs the persistence transaction. Keep them separate. Commit on green.

---

## Section A: Test Workout

- [x] Add a `test` day capability: the test workout is the current baseline workout done at test intensity (a heavier load or top effort of the same movements), invoked by the user in place of a KB day. It is not a separate prescribed workout and not a scheduled day.
- [x] RED first: write failing tests that a test log is recorded with `actualDayType: 'test'` and carries its result (completed/failed, the loads/reps achieved). Then implement the test-log path, reusing `buildWorkoutLog` extended for the test case.
- [x] The test is user-invoked. Build a clear "attempt test" action available on a KB day. Invoking it does not automatically ascend; it produces a test result that the guard then evaluates.

## Section B: Ascension Guard

- [x] RED first: write failing tests for the guard decision `isTestEligibleForAscension(block)` (name to taste): the test counts toward ascension only if `block.completedPlannedKbSessions >= block.testGuardMinSessions` (default 6). Then implement.
- [x] Test the decline case: invoking a test before the guard is met returns not-eligible; the Council declines; nothing changes (no block close, no tier bump, rotation continues).
- [x] Test the eligible case: guard met and the test was completed successfully → eligible to ascend.
- [x] Test that a failed test, even with the guard met, does not ascend (decide and document: a failed test holds the baseline; it does not bump).
- [x] The guard reads the counter maintained since Phase 2. If the counter is wrong, ascension is wrong; this is why Phase 2 emphasized counter correctness. Add a test that constructs a block with a known counter and asserts the guard result.

## Section C: Block Transition (Pure Computation)

- [x] RED first: write failing tests for a pure function that, given the closing block and the successful test, computes the next block: `baselineTier = closingBlock.baselineTier + 1`, a fresh `completedPlannedKbSessions = 0`, status active, a new start date, and the permanent lesson(s) banked from this block. Then implement.
- [x] The computation is pure: it returns the next-block spec and the lesson(s). It does not write to the DB.
- [x] Whole-baseline bump: the next block runs every workout one tier higher via the existing Phase 3 resolver. Confirm by test that resolving any template under the new block yields the N+1 definition (reuse the Phase 3 propagation test).

## Section D: Ascension Transaction (Persistence)

- [x] RED first: write failing tests (fake-indexeddb) for the full transaction performed by the app layer when a test is eligible and successful:
    1. Close the current block (status completed).
    2. Reset the six stats to baseline (this is the reset deferred in Phase 8).
    3. Reset `completedPlannedKbSessions` to 0 (the reset deferred in Phase 2; it is part of opening the new block).
    4. Open the next block at tier N+1 (active).
    5. Persist the banked permanent lesson(s).
   Then implement. The transaction must be atomic in effect: a partial ascension (e.g. block opened but stats not reset) is a bug. Use a Dexie transaction so all writes commit together.
- [x] Test the post-state: after ascension, the active block is the new one at N+1, stats are at baseline, the counter is 0, and the lesson list grew by the banked lesson(s).
- [x] Test that ascension is not re-triggerable from the same test (idempotent): re-evaluating does not ascend again.

## Section E: Permanent Lessons

- [x] Add a permanent lessons store (Dexie table) that is NOT reset on ascension; lessons persist across blocks.
- [x] RED first: write failing tests that a banked lesson persists across the ascension transaction and into subsequent blocks. Then implement.
- [x] Lessons are user-specific training rules that carry across blocks (e.g. Press Before Squat, Repeat Before Increase, Sleep Is Real). Decide which lessons are banked by which behavior; for Phase 11, banking at least one lesson per ascension (themed to the block's notable behavior) is sufficient. The lesson's effect on future recommendations can be minimal at this phase (display and record); deeper lesson effects can be a refinement.
- [x] Confirm lessons never reset. The stat reset and counter reset must not touch the lessons table; test this explicitly.

## Section F: UI

- [x] Build the test-workout invocation flow on a KB day (attempt test → log result).
- [x] Build the ascension outcome screen: on eligible success, show the dry celebration, the banked lesson(s), and that the next block begins one tier heavier (mirror the v4 example tone). On decline (guard not met) or failure, state it neutrally; nothing changes.
- [x] No guilt copy on a declined or failed test. "The baseline is not yet consolidated" is neutral, not a scold.
- [x] Verify rendering manually.

## Section G: Persistence and Offline

- [x] Confirm the entire ascension transaction works offline and persists across reload.
- [x] No network calls introduced in Phase 11.

## Section H: Phase 11 Done When

- [x] A user-invoked test workout (current baseline at test intensity) can be attempted on a KB day.
- [x] The ascension guard reads `completedPlannedKbSessions` against `testGuardMinSessions`; a test before the guard declines and changes nothing.
- [x] A successful, guarded test closes the block, resets stats, resets the counter, opens the next block at tier N+1, and banks a permanent lesson, all in one atomic transaction.
- [x] A failed test does not ascend; the baseline holds.
- [x] Permanent lessons persist across blocks and are never reset; tested explicitly.
- [x] The tier bump propagates to all workouts via the existing resolver (no per-workout edits).
- [x] Ascension is idempotent; the same test cannot ascend twice.
- [x] No guilt copy on decline or failure.
- [x] Engine decides (guard, next tier, lesson); app performs the atomic persistence; all test-first; engine pure.
- [x] Works offline.
- [x] Committed on green, pushed, with a clear Phase 11 commit message.

---

## Loops This Phase Closes (cross-phase)

- Phase 2 deferred the counter reset to the block-open flow → done here in the ascension transaction.
- Phase 3 deferred the tier bump trigger and noted the bump flow would set `baselineTier` → done here; resolution already propagated, this phase sets the new tier.
- Phase 8 deferred the stat reset to ascension → done here in the transaction.
- The test-workout day type stubbed across earlier phases → fully handled here.

Verify each deferred marker left in those phases is now resolved and the placeholder/pending tests are made real.

---

## Explicit Exclusions (do not build in Phase 11)

- Challenge paths (Phase 12; they modify the next block but are a separate phase)
- Deep permanent-lesson effects on recommendations (a later refinement; Phase 11 records and displays lessons and may apply minimal effects)
- AI prose for the ascension screen (Phase 13)
- Currency, decay (deferred/forbidden as before)

## Watch-Outs

- Atomicity. The ascension transaction mutates block, stats, counter, and lessons together. A partial apply (new block opened but stats not reset, or counter not zeroed) is a real bug that corrupts later guards and stat meaning. Use a single Dexie transaction and test the all-or-nothing property.
- The guard depends on a counter built nine phases earlier. If ascension behaves oddly, suspect the Phase 2 counter first. The guard test should construct explicit counter values rather than relying on accumulated state, so a counter bug elsewhere does not hide here.
- Failed and pre-guard tests change nothing. Only a successful, guarded test ascends. A failed test holds the baseline; an early test declines. Neither bumps the tier, resets stats, or banks a lesson. Test both negative paths.
- Lessons are the one thing that survives. Stats reset, the counter resets, the block closes, but permanent lessons persist. The reset logic must be surgical: it touches stats and counter, never lessons. Test that lessons survive an ascension.
- Idempotency. Re-evaluating the same successful test must not ascend twice. Tie ascension to a one-time transition, not to a recomputed condition that stays true.
- Ascension is a checkpoint, not a calendar event. The week template keeps running throughout. Do not pause or reset the schedule on ascension; only the block, tier, stats, and counter change.
