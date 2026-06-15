# Bellbound Phase 14: Workout Swap and Same-Day Activity Choice — Build Tasks

Detailed, tickable tasks for a post-v1 feature that closes a real gap found in use: the app shows only today's prescribed workout, with no way to substitute a different kettlebell workout or log a different activity on a training day. In reality the user substitutes (Single KB Strength for the prescribed Double KB Strength) or does something else entirely (a run). The log must represent what actually happened.

This is a documented gap in the original plan, not an oversight by the builder. Phase 1 hardcoded "KB day maps to Double KB Strength," Phase 2 built planned-vs-actual classification, and Phase 10 built off-block and free-day logging, but no phase built the case of choosing a different workout on a training day. The data model already supports it; this is a UI and routing gap, not a schema gap.

Prerequisite: Phase 0 through 13 complete. In particular: WorkoutLog already has separate `plannedWorkout` and `actualWorkout` fields (Phase 1); planned-vs-actual classification exists (Phase 2); multiple KB templates are seeded including Single KB Strength / The Single-Bell Outpost (Phase 3); off-block activity logging exists (Phase 10); the ascension guard reads the KB session counter (Phase 11).

Goal of Phase 14: on any training day, the user can keep the prescribed workout, swap it for another kettlebell workout, or log an off-block activity instead; each choice logs correctly, counts correctly toward the block, and where appropriate feeds the judgment-reward loop.

Reference: bellbound_rpg_mode_v4.md (Activities and Classes, The Good Swap quest, Judgment stat), bellbound_phase2_build_tasks.md (classification), bellbound_phase10_build_tasks.md (off-block logging), bellbound_phase11_build_tasks.md (the guard and counter), CLAUDE.md / AGENTS.md (the program is the source of truth; the app reacts to what was logged).

---

## Recommended Approach (the decision this phase encodes)

Adopt Shape B from the brainstorm: a same-day choice that is a first-class, Council-aware action, not a hidden deviation.

On a training day the Today screen offers three choices:

1. Do the prescribed workout (current behavior). Logs as a planned session, `actualWorkout === plannedWorkout`.
2. Swap for a different kettlebell workout (e.g. Single KB Strength instead of Double KB Strength). Logs as a planned KB session with `actualWorkout` differing from `plannedWorkout`. Still counts toward the block and the ascension guard.
3. Log an off-block activity instead (e.g. a run). Logs via the existing Phase 10 off-block path. Feeds Conditioning and the status engine. Does NOT count toward the KB guard.

Two decisions encoded here, both deliberate:

- A KB-for-KB swap counts toward the ascension guard. The guard cares whether the user did baseline kettlebell strength work enough times, not whether they did one exact template. For a single honest user this is correct and simple. The stricter alternative (the guard counts only sessions of the workout that will be tested) is over-engineering for one user training in good faith; do not build it unless real use shows drift.
- A swap is a judgment signal, not a deviation to hide. The design already rewards smart swaps (The Good Swap quest, Judgment stat). A swap made for a real reason (fatigue, time, preference, equipment) is exactly the kind of decision the app exists to surface positively. The swap is logged with an optional reason and can feed the existing judgment reward, never guilt.

State management: as established in prior phases.

---

## TDD Protocol (Phase 14)

Strict red-green-refactor on the logging and counting logic (pure and fake-indexeddb). UI verified manually.

Test-first (Vitest, pure / fake-indexeddb):
- Building a swapped-KB log (planned vs actual workout differ; source still planned; category KB).
- The guard counter still increments for a KB-for-KB swap (a planned, completed KB session, even if actualWorkout != plannedWorkout).
- The off-block-on-a-training-day log (source off_block; does not increment the KB counter; can carry signals).
- Classification of a swapped day and an off-block-on-training-day under the Phase 2 four-case logic.

Verify manually:
- The Today screen choice UI.

Discipline unchanged. Commit on green.

---

## Section A: Same-Day Choice on the Today Screen

- [ ] Add a choice affordance on any training day (KB or free): keep the prescribed workout, swap to another KB workout, or log an off-block activity. The prescribed workout remains the default and most prominent option; the alternatives are available but not pushed.
- [ ] The Council does not nudge the user toward swapping or away from the prescribed workout. The choice is neutral. The prescribed workout is the default because the program is the source of truth, not because deviating is discouraged.
- [ ] Keep the prescribed workout table fully visible (all movements, reps, load, rest) regardless of the choice UI, per the always-visible rule.

## Section B: KB-for-KB Swap

- [ ] Build a picker listing the other seeded KB workouts (Single KB Strength / The Single-Bell Outpost, Armor Building Complex, etc.), each resolved at the active block tier via the Phase 3 resolver so the swapped workout shows correct tier-appropriate sets/reps/load.
- [ ] RED first: extend `buildWorkoutLog` and its tests for a swapped KB session: `plannedWorkout` = the prescribed workout, `actualWorkout` = the chosen KB workout, `plannedDayType` = `kb`, `actualDayType` = `kb`, `source` = `planned`, `category` = `kb`, status/difficulty/signals as normal. Then implement.
- [ ] Optional swap reason: allow a short reason (fatigue, time, equipment, preference). Store it in `structuredNotes`. It is optional and never required; its absence is fine.
- [ ] After the swap, show the chosen workout's table (resolved at tier) for logging, replacing the prescribed one for this session only. The template and schedule are unchanged for future days (no re-alignment, consistent with the calendar-anchored design).

## Section C: Guard Counting For Swaps

- [ ] RED first: write a failing test that a completed (or modified, per the Phase 2 decision) KB-for-KB swap increments `completedPlannedKbSessions`, because it is a planned, completed KB session even though `actualWorkout != plannedWorkout`. Then confirm the Phase 2 increment rule already handles this, or adjust the rule to key on `category === 'kb' && plannedDayType === 'kb' && source === 'planned' && status completed/modified` rather than on the workout name. Update the Phase 2 increment logic if it was keyed on workout identity.
- [ ] Test the boundary: an off-block run on a KB day does NOT increment the KB counter (it is `source: off_block`).
- [ ] Re-confirm no double-count on edit (the Phase 11 guard depends on this counter being exact).

## Section D: Off-Block Activity On A Training Day

- [ ] Surface the Phase 10 off-block logging path from a training day, not only from free days. The user on a KB day can choose "log a run instead."
- [ ] RED first: write a failing test that an off-block activity on a KB day logs with `plannedDayType: 'kb'`, `actualDayType` reflecting the activity, `source: 'off_block'`, the relevant `category` (e.g. cardio), and may carry signals (a hard run sets `breathless`). It does not count toward the KB guard. Then implement (reusing the Phase 10 routing; this is a new entry point, not new routing logic).
- [ ] Confirm the Phase 2 classification treats this correctly: it is "trained on a training day" (not a miss, not a rest), but the work done was off-block. Adjust the classification test coverage if this combination was not already exercised.
- [ ] The off-block run feeds Conditioning and the status engine exactly as in Phase 10. No new engine logic.

## Section E: Judgment Reward For Swaps (Reuse, Do Not Invent)

- [ ] A swap made with a reason can feed the existing Judgment stat and The Good Swap quest (Phase 8/9). Reuse those; do not create a new reward mechanism.
- [ ] RED first: write a test that a logged swap with a reason contributes to the existing judgment reward path, and that a swap never produces guilt copy or a penalty. Then confirm via the existing reward functions.
- [ ] A swap with no reason is still fine and neutral; it simply does not trigger the judgment reward. No nagging for a missing reason.

## Section F: Persistence and Offline

- [ ] Confirm swapped sessions, off-block-on-training-day sessions, the counter behavior, and classifications persist and compute offline.
- [ ] No network calls introduced in Phase 14.

## Section G: Phase 14 Done When

- [ ] On a training day the user can keep the prescribed workout, swap to another KB workout, or log an off-block activity instead.
- [ ] A KB-for-KB swap logs with planned and actual workouts differing, counts toward the ascension guard, and shows the chosen workout resolved at the active tier.
- [ ] An off-block activity on a training day logs via the existing Phase 10 path, feeds Conditioning and the status engine, and does NOT count toward the KB guard.
- [ ] The guard counter keys on KB-session criteria, not workout identity, and does not double-count; proven by test (and the Phase 11 guard still reads it correctly).
- [ ] Swaps can feed the existing judgment reward; no new reward mechanism; never any guilt.
- [ ] The template does not re-align; a swap or off-block day changes only that day's log, not future scheduling.
- [ ] The prescribed workout stays the neutral default and remains fully visible.
- [ ] All logic test-first; engine pure; no new recommendation or routing logic (reuse Phase 3 resolver, Phase 10 routing, Phase 2 classification, Phase 8/9 rewards).
- [ ] Works offline.
- [ ] Committed on green, pushed, with a clear Phase 14 commit message.

---

## Cross-Phase Touch Points

- Phase 1: reuses `plannedWorkout` / `actualWorkout` and extends `buildWorkoutLog`.
- Phase 2: the increment rule may need to key on KB-session criteria rather than workout name; classification gains coverage for swapped and off-block-on-training-day cases.
- Phase 3: the resolver renders the swapped KB workout at the active tier.
- Phase 10: the off-block path gains a new entry point from training days; no new routing.
- Phase 11: the guard still reads the same counter; confirm swaps count and runs do not.
- Phase 8/9: swaps reuse the Judgment stat and The Good Swap quest.

If the Phase 2 counter was keyed on the prescribed workout's identity, this phase corrects it to key on KB-session criteria. Verify the Phase 11 guard tests still pass after that change.

---

## Explicit Exclusions (do not build in Phase 14)

- Per-template guard accounting (the stricter "guard counts only the to-be-tested workout" model) unless real use shows the simple model is being gamed
- New reward mechanisms (reuse Judgment and The Good Swap)
- New off-block routing or new status-effect logic (reuse Phase 10 and Phase 7)
- Editing the weekly template or re-aligning the schedule (a swap is per-day, not a schedule change)
- Random anything

## Watch-Outs

- The counter must key on criteria, not name. The most likely bug: if Phase 2 incremented only when the logged workout matched the prescribed one, a swap would silently not count, and ascension timing would drift. Re-key the increment on KB-session criteria and re-run the Phase 11 guard tests.
- A swap is judgment, not deviation. Frame it neutrally and let it feed the existing reward. Never imply the user did something wrong by not doing the prescribed workout. The whole point of the app is that smart substitution is good training.
- Reuse, do not reinvent. Everything this phase needs already exists: the resolver, the off-block path, the classification, the rewards. Phase 14 is wiring and UI plus one counter-keying correction. If you find yourself writing new engine logic, stop and check whether an existing function already does it.
- The template does not move. A swap or an off-block day changes that one day's log only. Tomorrow still shows what the calendar-anchored template prescribes. Do not let a swap shift the schedule.
