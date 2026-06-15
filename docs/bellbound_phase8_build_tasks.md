# Bellbound Phase 8: Campaign Stats — Build Tasks

Detailed, tickable tasks for Phase 8 on the committed stack. Phase 8 adds the six character stats, gained from training behavior. Stats are reward and reflection; they must never become a progression trigger or a reason to overtrain.

Prerequisite: Phase 0 through 7 complete. The Council recommendation and the status system exist. Progression eligibility is already independent of any reward (enforced in Phase 6).

Goal of Phase 8: completing sessions and making good decisions raises the six stats; stat gain is fully separate from progression eligibility; and stats accumulate this phase with no reset until ascension exists (a known interim state, not a bug).

Reference: bellbound_rpg_mode_v4.md (Stats, Stat Gain Rules, Stat Gain Is Not Progression Eligibility, Stats Reset on Ascension), bellbound_feature_build_plan_v1.md (Phase 8), bellbound_build_plan_updates_v1.md (item 7, stat accumulation window), bellbound_tech_stack_committed_pwa_v1.md.

State management: as decided in Phase 6/7.

---

## TDD Protocol (Phase 8)

Strict red-green-refactor on the stat-gain rules (pure) and persistence (fake-indexeddb).

Test-first (Vitest, pure engine):
- Each stat-gain rule: given a logged session (and its classification/signals), return the stat deltas.
- The independence assertion: stat gain takes logs/decisions only and never influences, and is never influenced by, progression eligibility.

Test-first (Vitest, fake-indexeddb):
- Persisting stat changes to the Character row and reading back.

Verify manually:
- The character/stats view rendering.

Discipline unchanged. Commit on green.

---

## Section A: Stat Gain Rules

- [ ] RED first: write failing tests for pure stat-gain functions mapping training behavior to the six stats, then implement:
    - Strength: completing heavy clean, press, squat, carry, or barbell work.
    - Conditioning: completing swings, burpees, EMOMs, runs, or density work.
    - Control: marking reps clean or avoiding grinding (no grindy signal).
    - Consistency: completing a planned session, or logging an extra.
    - Recovery: taking scheduled rest, deload, mobility, or avoiding unnecessary work.
    - Judgment: a smart swap, repeating baseline, reducing load, or skipping a finisher.
- [ ] Each rule is pure: it takes the log (and its Phase 2 classification and signals) and returns stat deltas. It does not read the DB or the recommendation.
- [ ] Test that a rest day grants Recovery, a completed KB session grants Strength/Consistency, a wise regression grants Judgment/Control, etc., per the table.

## Section B: Independence From Progression

- [ ] RED first: write a test asserting that stat gain and progression eligibility are computed independently: a session can gain Strength (because it was trained) while progression stays locked (because a press was grindy). The example message from the concept: "You gained Strength because you trained. You did not unlock progression because the presses were grindy." Then confirm the code structure enforces it.
- [ ] The stat-gain function must not take progression eligibility as input, and the eligibility function must not take stats as input. Keep them structurally unable to influence each other.

## Section C: Applying and Persisting Stats

- [ ] RED first: write failing tests (fake-indexeddb) that applying stat deltas to the Character updates the six stat values and persists across reload. Then implement, with the app layer applying engine-computed deltas to the Character row via the repository.
- [ ] The engine computes deltas (pure); the app persists them (I/O). Do not mutate the Character inside the engine.
- [ ] Level, if used, is derived from stats or total gains; keep any leveling rule pure and tested. Leveling is optional flavour and must not gate anything mechanical.

## Section D: Stats View

- [ ] Build a character view showing the six stats and the class (from Phase 5).
- [ ] Optionally show recent stat changes ("+1 Consistency", "+1 Recovery") as feedback after logging. Keep it dry and non-motivational.
- [ ] Verify rendering manually.

## Section E: Accumulation Window (Known Interim State)

- [ ] Note in code and a test comment: until ascension exists (a later phase), stats accumulate with no reset. This is expected for the window between Phase 8 and the ascension phase, NOT the inflation bug.
- [ ] Do NOT build a reset, decay, or cap here. The reset path is wired when block close / ascension is built. Leave a clear marker that stat reset belongs to the ascension flow.

## Section F: Persistence and Offline

- [ ] Confirm stats compute and persist offline.
- [ ] No network calls introduced in Phase 8.

## Section G: Phase 8 Done When

- [ ] Completing sessions and making good decisions raises the appropriate stats, per tested rules.
- [ ] Stat gain is structurally independent of progression eligibility, proven by function signatures and tests.
- [ ] The engine computes deltas purely; the app persists them; the Character is never mutated inside the engine.
- [ ] Stats persist across reload and display on a character view.
- [ ] The no-reset-until-ascension window is documented as intentional, not a bug, with a marker for the future reset.
- [ ] All rules written test-first; engine pure; no stat logic in components.
- [ ] Works offline.
- [ ] Committed on green, pushed, with a clear Phase 8 commit message.

---

## Explicit Exclusions (do not build in Phase 8)

- Stat reset, decay, or caps (reset belongs to the ascension phase; decay is deferred entirely)
- Permanent lessons (the ascension phase)
- Any mechanism where stats gate progression, unlock workouts, or affect recommendations (forbidden; stats are reward/reflection only)
- Class bonuses from stats (classes stay flavour)
- Quests and items (Phase 9)

## Watch-Outs

- Stats are a reward, never a trigger. The cardinal rule of Phase 8: stats must not influence what the user is told to do. If a stat ever gates a workout, unlocks progression, or changes a recommendation, that is a bug and it reintroduces the volume-chasing the design forbids.
- Independence is structural, not just behavioral. Enforce it with function signatures: the eligibility function cannot see stats, and the stat function cannot see eligibility. This makes the violation impossible to write by accident.
- The accumulation window is fine. Stats only growing until ascension is expected, because the reset is part of ascension which does not exist yet. Mark it so a future reader does not "fix" it prematurely.
- Engine computes, app persists. The engine returns deltas; it never writes to the DB or mutates the Character. Keep the purity boundary intact.
