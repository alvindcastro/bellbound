# Bellbound Phase 6: Signal Flags and Progression Engine v1 — Build Tasks

Detailed, tickable tasks for Phase 6 on the committed stack. Phase 6 is the first real engine logic and the most important phase so far: the deterministic Council that recommends repeat, hold, reduce, or progress from logged data alone. Get this right and the app has a useful coaching brain that never needs AI.

Prerequisite: Phase 0 through 5 complete. In particular, the difficulty enum exists on logs (Phase 1), the `signals` field exists but is unpopulated (Phase 0), planned vs actual and the KB counter work (Phase 2), and tier resolution is in the engine (Phase 3).

Goal of Phase 6: signal flags get captured; the engine produces a deterministic, explainable recommendation per the Council priority order; a normal session with a blocking flag does not progress the flagged movement; and every rule is covered by tests. No sleep-based status effects yet (Phase 7), no ascension, no AI.

Reference: bellbound_rpg_mode_v4.md (Difficulty and Signals, Progression Rule, The Council), bellbound_feature_build_plan_v1.md (Phase 6), bellbound_build_plan_updates_v1.md (signals lifecycle, Council priority), bellbound_tech_stack_committed_pwa_v1.md.

State management: this is the phase where engine output flows through multiple screens (Today, report). If that pressure is real, adopt a light state library now (Zustand was the plan). If React state still suffices, defer it. Decide based on actual need, not anticipation.

---

## TDD Protocol (Phase 6)

Strict red-green-refactor, and this phase is where it matters most. The progression rules and Council priority order are pure logic; every rule and every priority interaction gets a test before implementation. This is the phase to be most disciplined.

Test-first (Vitest, pure engine):
- Signal-to-recommendation mappings.
- The progression eligibility rule (normal/easy twice, no blocking flag).
- The Council priority order, including conflicts (the case where multiple signals fire and the most conservative wins).
- "Stat gain is not progression eligibility" separation (relevant when stats arrive in Phase 8, but the progression decision must already be independent of any reward).

Test-first (Vitest, fake-indexeddb):
- Reading recent logs for a workout to feed the engine.

Verify manually:
- The recommendation rendering and the signal-flag toggles in the log form.

Discipline: the engine decides; the UI displays. No recommendation logic in components. Commit on green. Aim for high coverage of the rule combinations here specifically; this is the product's brain.

---

## Section A: Capture Signal Flags

- [x] Add signal-flag capture to the log form: `pressGrindy`, `breathless`, `gripCooked`, `legsSore`, as manual toggles (checkboxes or similar). Default all false.
- [x] RED first: update the `buildWorkoutLog` function (from Phase 1) and its tests so the signals object is populated from the toggles instead of always defaulting. Then implement.
- [x] The signals are captured per session. Keep the toggles simple and clearly labeled in plain terms (e.g. "presses felt grindy", "legs sore", "grip cooked", "out of breath / conditioning too hard").
- [x] Confirm signals persist on the WorkoutLog and read back correctly (extend the repository round-trip test if needed).

## Section B: Progression Eligibility Rule

- [x] RED first: write failing tests for a pure function `isProgressionEligible(recentLogsForWorkout, movement)` (name to taste) implementing: eligible when the same workout was logged at difficulty easy or normal twice, AND no blocking signal flag is set for the movement being progressed. Then implement.
- [x] Test the positive case: two normal sessions, no flags → eligible.
- [x] Test blocking-flag cases: two normal sessions but `pressGrindy` set → pressing is NOT eligible, even though the session difficulty was normal. The rest of the workout may still be eligible.
- [x] Test the difficulty gate: a `hard` or `failed` session does not count toward the "twice" → not eligible.
- [x] Test that eligibility is per-movement where a flag is movement-specific (pressing held by `pressGrindy`, squats by `legsSore`), and per-workout where difficulty governs.
- [x] Critical separation: progression eligibility must be independent of any stat gain or reward. A session can be "good" (stats gained, later phase) while progression stays locked by a flag. Encode and test this independence now, even before stats exist, by keeping the eligibility function take only logs and signals, never rewards.

## Section C: Hold / Reduce Rules

- [x] RED first: write failing tests mapping each signal and difficulty to its recommendation, then implement:
    - `hard` difficulty → repeat baseline
    - `failed` difficulty → reduce or repeat
    - `pressGrindy` → hold pressing progression
    - `breathless` → repeat conditioning baseline
    - `gripCooked` → reduce carry finisher
    - `legsSore` → keep squat volume conservative
- [x] Each mapping is a pure function or a clear data table the engine reads. Test each in isolation.

## Section D: Council Priority Order

This is the heart of Phase 6: when multiple signals fire, the most conservative recommendation wins. The priority order is the conflict resolver.

- [x] RED first: write failing tests for the Council recommendation function that takes the recent logs, the current signals, and the workout context, and returns a single recommendation following this priority:
    1. Failed or incomplete session
    2. Active recovery blocker (status effects arrive in Phase 7; for Phase 6 this slot may be empty or stubbed)
    3. Movement-specific blocking signal
    4. Hard difficulty
    5. Normal/easy repeat count (toward progression)
    6. Progression suggestion
    7. Flavour text
- [x] Test conflict cases explicitly: a normal session with `pressGrindy` returns hold-pressing (priority 3) not progress (priority 6), even though the repeat count might otherwise suggest progression. A `failed` session returns reduce/repeat (priority 1) regardless of any other signal.
- [x] The most-conservative rule: the engine applies the highest-priority applicable recommendation. It does not average, and a positive indicator never overrides a blocking one. Test that a good signal cannot cancel a bad one.
- [x] The recommendation output is structured (a type with the recommendation kind, the affected movement if any, and a plain explanation), so the UI and a later report can render it and explain it from data.

## Section E: Explainability

- [x] RED first: write tests asserting the recommendation includes a data-derived explanation, e.g. "logged normal twice with no blocking flags, progression eligible" or "presses were grindy, holding pressing". Then implement.
- [x] The explanation is generated from the structured decision, not free text. This is what lets the Council be dry-voiced later without inventing facts, and it is what makes the rule debuggable.
- [x] Bad output to avoid (and test against): "the AI thinks you should progress". There is no AI here. Good output: "you logged this workout as normal twice with no blocking flags; progression is eligible."

## Section F: Wire Into the UI

- [x] After a workout is logged, show the Council recommendation on the Today screen (or a results view): the recommendation kind, the affected movement, and the plain explanation.
- [x] The recommendation is advisory. The app does not auto-change the program. It suggests; the user decides. Tier bumps remain manual and gated (the ascension phase).
- [ ] Verify rendering manually. No recommendation logic in the component; it calls the engine and displays the result.

## Section G: Persistence and Offline

- [ ] Confirm recommendations compute offline from local logs.
- [x] No network calls introduced in Phase 6.

## Section H: Phase 6 Done When

- [x] Signal flags are captured in the log form and persisted.
- [x] The engine suggests repeat, hold, reduce, or progress from structured data alone.
- [x] A normal session with a blocking flag does not progress the flagged movement, proven by test.
- [x] The Council priority order resolves conflicts to the most conservative recommendation; a good signal cannot cancel a bad one; proven by tests covering the conflict cases.
- [x] Progression eligibility is independent of any reward/stat, proven by the function signature and tests.
- [x] Every recommendation carries a data-derived explanation; no fake-certainty or AI-attributed copy.
- [x] The recommendation is advisory; the app does not auto-progress.
- [x] All rules and priority interactions written test-first with high coverage; engine stayed pure; no recommendation logic in components.
- [ ] Works offline.
- [ ] Committed on green, pushed, with a clear Phase 6 commit message.

---

## Explicit Exclusions (do not build in Phase 6)

- Sleep-based status effects and the full status system (Phase 7) — priority slot 2 is reserved/stubbed for now
- Stats and stat gains (Phase 8); the progression decision must already be independent of them
- Ascension, the test workout, tier bumping (the ascension phase)
- AI note parsing (Phase 13); signals are captured by manual toggle in Phase 6
- DailyContext: sleep, bodyweight, food (Phase 7)
- Off-block activity effects (Phase 10)

## Watch-Outs

- This is the brain. Spend the testing effort here. The combinations of difficulty plus multiple signals plus repeat count are where bugs hide, and a wrong recommendation undermines the whole point of the app. Test the conflict matrix thoroughly, not just the happy path.
- Conservative always wins. The single most important rule: a blocking signal beats a progression suggestion, and `failed` beats everything. If you ever find a path where a positive indicator overrides a blocker, that is a bug, and it is the exact failure mode (rewarding pushing through bad signals) the design exists to prevent.
- Resolution vs recommendation vs reward, kept separate. Phase 3 resolves the workout at a tier. Phase 6 recommends whether to progress. Phase 8 rewards with stats. These are three different things and must stay three different functions. Progression eligibility takes logs and signals only, never rewards, never the tier resolver's output.
- Advisory, not automatic. The Council suggests; the human acts. Do not let a "progress" recommendation silently bump the tier. The bump is manual and gated, in the ascension phase. Auto-progression is forbidden.
- Priority slot 2 (recovery blocker) is intentionally empty until Phase 7. Leave the slot in the ordering with a clear marker so Phase 7 drops status effects into it without reworking the priority logic.
