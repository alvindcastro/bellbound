# Bellbound Phase 2: Calendar Week Template and Planned vs Actual — Build Tasks

Detailed, tickable tasks for Phase 2 on the committed stack. Phase 2 makes the app respect the fixed weekly routine and compare what was planned against what was logged. It also owns the `completedPlannedKbSessions` counter that the ascension guard reads in a later phase.

Prerequisite: Phase 0 (foundation, schema, repositories, seed) and Phase 1 (Today screen, log form, recent logs) complete.

Goal of Phase 2: the week template is calendar-anchored and does not slide when the user misses or shifts a day; the app classifies each day's log against its planned day type; the block's completed planned KB session count is maintained correctly; and weekly history can show planned vs actual. No fatigue math, no status effects, no stat effects from activities yet.

Reference: bellbound_rpg_mode_v4.md (The Week Template, Planned vs Actual), bellbound_feature_build_plan_v1.md (Phase 2), bellbound_build_plan_updates_v1.md (item 2, counter ownership), bellbound_tech_stack_committed_pwa_v1.md.

State management: still React's own state plus Dexie liveQuery. Do NOT introduce a state library yet (that is Phase 6 territory if needed).

---

## TDD Protocol (Phase 2)

Strict red-green-refactor on all logic and data, which is most of this phase. Phase 2 is logic-heavy and UI-light, so almost everything here is test-first.

Test-first (Vitest, fake-indexeddb where data is touched):
- The planned-vs-actual classification function (pure: given a planned day type and a logged result, return the case).
- The counter increment/reset logic (pure decision plus a repository write, tested with fake-indexeddb).
- Any week-template lookup helper (weekday to day type).
- The weekly history aggregation (given logs and the template for a date range, produce the planned-vs-actual summary).

Verify manually, do not unit-test:
- The weekly history screen rendering.

Discipline unchanged: extract logic out of components into tested functions. Components orchestrate, they do not compute. Commit on green.

---

## Section A: Week Template Lookup

- [x] RED first: write failing tests for a pure helper that, given a date and a WeekTemplate, returns the planned `DayType` for that date's weekday. Cover all seven weekdays of the default template (Mon KB, Tue KB, Wed Rest, Thu KB, Fri KB, Sat Free, Sun Rest). Then implement.
- [x] Decide where this helper lives: it is pure logic over a template plus a date, so it can live in the engine (e.g. `packages/engine/src/schedule/plannedDayType.ts`) or in an app-layer service that reads the template from the repo and calls the pure helper. Prefer the pure helper in the engine, with the app-layer service doing the I/O of fetching the template.
- [x] Ensure the weekday mapping is unambiguous (define which library/method gives the weekday and that it matches the template's key names; avoid locale or timezone surprises by deriving the weekday from a stable local date).

## Section B: Planned vs Actual Classification

The four cases from v4. This is the core of Phase 2.

- [x] RED first: write failing tests for a pure classification function `classifyDay(plannedDayType, log)` returning one of: `trained_on_training_day`, `rested_on_rest_day`, `trained_on_rest_day` (extra), `missed_training_day` (skipped). Include the edge cases below. Then implement.
- [x] Case 1 — Trained on a planned training day: planned is `kb` (or `free` with an activity), a log exists with status completed/modified. Counts toward the block.
- [x] Case 2 — Rested on a planned rest day: planned is `rest`, no training log (or an explicit rest entry). Counts as recovery.
- [x] Case 3 — Trained on a planned rest day: planned is `rest`, but a training log exists. Logged neutrally as extra. No guilt.
- [x] Case 4 — Missed a planned training day: planned is `kb`, no log or a skipped log. Resume without guilt; the template does not shift.
- [x] Edge cases to test: a `free` day with a logged activity (not a miss, not a rest reward), a `free` day with nothing logged (not a miss), a `kb` day logged as `skipped` (this is a miss/skip, not a completion), a `test` day (treat as a training day for classification; full test handling is a later phase).
- [x] Confirm the function is pure: it takes the planned day type and the log (or absence of one), and returns a case. It does not read the DB itself.

## Section C: completedPlannedKbSessions Counter (Phase 2 owns this)

This counter is defined on the Block in Phase 0 but is incremented here. The ascension guard reads it in a later phase, so it must be correct now.

- [x] RED first: write failing tests for the increment rule. The counter increments by 1 when, and only when, a WorkoutLog is saved with `plannedDayType === 'kb'`, `status === 'completed'`, and `source === 'planned'`. Test that a skipped KB day does not increment, a modified KB day's treatment is decided explicitly (decide: does `modified` count? Recommended yes if it was still the planned KB workout completed with modifications; document the decision in the test), an off_block session does not increment, and a rest day does not increment.
- [x] Decide and document: does `status === 'modified'` increment the counter? Yes — a modified-but-completed KB session still counts as a baseline session. Encoded explicitly in `shouldIncrementCounter.test.ts`.
- [x] Implement the increment as part of the log-save flow: after `workoutLogRepository.add(log)`, evaluate the rule and, if it holds, increment the active block's counter via the block repository. Keep the decision (should-increment) as a pure function tested separately from the repository write.
- [x] RED first: write a failing test that the counter persists across reload (write a qualifying log, reload the DB under fake-indexeddb, read the block, assert the counter). Then confirm it passes.
- [ ] Counter reset: the counter resets to 0 when a new block opens. New-block creation does not happen until the ascension phase, so for Phase 2 only document that the reset belongs to the block-open flow (a comment or a placeholder test marked as pending). Do NOT build block creation here.
- [x] Guard against double-counting: ensure editing or re-saving the same log does not increment again. Rule: increment only on first insert (getById check before add). Tested in counterIntegration.test.ts.

## Section D: Today Screen — Planned vs Actual Awareness

- [x] Update the Today screen to show the planned day type clearly and, once a log exists for today, reflect the classification (e.g. "Logged: completed", "Rest day", "Extra session on a rest day", "Missed").
- [x] On a planned rest day where the user chooses to train, the UI allows logging the extra session and shows it as extra, neutrally. No guilt copy anywhere.
- [x] On a missed planned KB day (the day passed with no log), the app does not nag. If surfaced at all, it is neutral and the schedule is unchanged.
- [x] Keep the real workout table fully visible on training days, unchanged from Phase 1.

## Section E: Weekly History (Planned vs Actual View)

This is a precursor to the full Weekly Council Report (Phase 4). Phase 2 just needs a factual planned-vs-actual history.

- [x] RED first: write failing tests for a pure aggregation function that, given the WeekTemplate and the set of logs for a date range (last 7 days), returns a structured summary: planned sessions, actual sessions, extras (trained on rest), and misses (skipped training days). Then implement.
- [x] Build a simple weekly history view in the UI that renders the summary for the last 7 calendar days. Plain and readable; no RPG flavour, no progression, no AI prose (those are later phases).
- [x] Use the classification function from Section B per day to build the summary; do not duplicate the logic.
- [ ] Verify rendering manually in the browser.

## Section F: Persistence and Offline

- [ ] Confirm the counter and all classifications survive a full reload (data is in IndexedDB).
- [ ] Confirm the weekly history loads and is correct offline.
- [ ] No network calls introduced in Phase 2.

## Section G: Phase 2 Done When

- [x] The week stays calendar-anchored; missing a day or training on a rest day does not shift the schedule.
- [x] `classifyDay` correctly returns all four cases plus the edge cases, all covered by tests.
- [x] `completedPlannedKbSessions` increments only for a planned, completed (or modified, per the documented decision) KB session; it does not double-count on edit; it persists across reload; all covered by tests.
- [x] The counter reset is documented as belonging to the block-open flow, not built here.
- [x] Weekly history shows planned vs actual for the last 7 days, built from the tested classification and aggregation functions.
- [x] All logic was written test-first; the engine stayed pure; no Dexie calls in components.
- [ ] Everything works offline.
- [ ] Committed on green, pushed, with a clear Phase 2 commit message.

---

## Explicit Exclusions (do not build in Phase 2)

- Fatigue math or any numeric fatigue model (there is none; recovery is status effects, Phase 7)
- Stat effects from the free day or any activity (Phase 8 and 10)
- Status effects (Phase 7)
- Progression recommendations and eligibility (Phase 6)
- Signal flags population (Phase 6)
- The full Weekly Council Report with judgment and progression (Phase 4 for the factual report, later for progression/ascension lines)
- Block creation, ascension, the counter reset flow (the test/ascension phase)
- Quests, items, RPG flavour (Phases 5, 9)

## Watch-Outs

- The counter is the single most important output of Phase 2 because a later guard depends on it. Get the increment rule, the no-double-count rule, and the persistence test right. A wrong counter silently breaks ascension much later, far from where the bug lives.
- Keep classification pure and reuse it in both the Today screen and the weekly history. Two copies of the four-case logic will drift.
- The reset-to-zero on block open is intentionally deferred. Leave a clear marker (pending test or comment) so the ascension phase wires it up rather than forgetting it exists.
- Timezone/weekday derivation: be deliberate. A log saved late at night and a weekday computed in UTC can disagree about which day it was. Derive the weekday from the user's local date consistently, and test a date that would expose an off-by-one.
