# Bellbound Phase 10: Free Day, Off-Block, and Recovery Skill Activities — Build Tasks

Detailed, tickable tasks for Phase 10 on the committed stack. Phase 10 adds the input path for activities outside the prescribed KB workouts: free-day sessions, off-block training, and recovery/skill activities. The status engine built in Phase 7 is already source-agnostic, so this phase mostly adds logging and routing, not new engine logic.

Prerequisite: Phase 0 through 9 complete. The status effect system (Phase 7) creates effects from signals regardless of source. The Council (Phase 6) and stats (Phase 8) exist.

Goal of Phase 10: the user can log a free-day or off-routine activity; each activity has a source class (planned / off_block / recovery_skill) with a sensible default and an override; off-block training feeds the existing status engine and the relevant physical stat; and there is no numeric fatigue model and no random rewards.

Reference: bellbound_rpg_mode_v4.md (The Free Day, Activities and Classes, Two Classes No Random Rewards, The Free Lands), bellbound_feature_build_plan_v1.md (Phase 10), bellbound_build_plan_updates_v1.md (item 3 "feeds fatigue" → "can trigger status effects", item 5 off-block triggering, item 6 activity source selection), bellbound_tech_stack_committed_pwa_v1.md.

State management: as decided earlier.

---

## TDD Protocol (Phase 10)

Strict red-green-refactor on the routing and stat-mapping logic (pure) and persistence (fake-indexeddb).

Test-first (Vitest, pure engine):
- Activity-to-source default mapping.
- Activity-to-stat mapping for off_block and recovery_skill classes.
- That off_block signals create the same status effects as planned signals (already true from Phase 7; assert it through the activity path).

Test-first (Vitest, fake-indexeddb):
- Logging a free-day / off-block / recovery_skill activity and reading it back with its source and category.

Verify manually:
- The free-day and activity logging UI, including the source default and override.

Discipline unchanged. Commit on green.

---

## Section A: Free Day Logging

- [ ] Build free-day activity logging for the Saturday free slot (and any rest-day extra). The free day is NOT a rest day and does not earn the rest-day reward; resting on a free day is neutral and not a missed session (this classification already exists from Phase 2; confirm it holds for the free slot).
- [ ] The free-day UI lets the user log an activity: type (run, hike, pickleball, barbell, yoga, walk, etc.), and a freeform note. It produces a WorkoutLog with the appropriate source and category.
- [ ] RED first: update/extend `buildWorkoutLog` (and tests) to handle a free-day or off-routine activity: set `actualDayType` appropriately, set `source` and `category` from the activity, allow signals to be captured (a hard run can set `breathless`). Then implement.

## Section B: Source Classes and Defaults

- [ ] RED first: write failing tests for the activity-to-source default mapping, then implement: run → off_block, barbell → off_block, pickleball → off_block, yoga → recovery_skill, walk → recovery_skill, hike → recovery_skill. (Hike is intensity-dependent; default recovery_skill, user can override.)
- [ ] The user can override the source at log time (a hard hike reclassified to off_block conditioning). Build the override control with the default preselected.
- [ ] RED first: test that an ambiguous activity has its default and that an override is respected on save. Then implement.

## Section C: Stat and Effect Routing

- [ ] RED first: write failing tests for activity-to-stat mapping, then implement:
    - off_block training (run, vest walk, pickleball, barbell): maps to the relevant physical stat (run/conditioning → Conditioning; barbell → Strength) and to Consistency for logging the work.
    - recovery_skill (yoga, walk, hike, and the reflective ones like reading a book or solving a cube if you choose to support them): small deterministic Recovery or Judgment, or flavour only. Reading/cube give Judgment or flavour, not physical stats.
- [ ] off_block training feeds the existing status engine: a hard run sets `breathless` → Breathless Fog via the Phase 7 engine. RED first: assert that an off_block log with a signal produces the same status effect as a planned log with that signal. Then confirm (the engine is already source-agnostic; this proves the path).
- [ ] recovery_skill activities do NOT feed fatigue and do not create blocking status effects. They give small positive feedback only.

## Section D: No Fatigue Model, No Random Rewards

- [ ] Confirm and enforce: there is no numeric fatigue score anywhere. "Feeds fatigue" means "can trigger a status effect" and nothing more. Grep the codebase for any fatigue-score remnant and remove it.
- [ ] Confirm and enforce: no activity gives a random or variable reward. All off_block and recovery_skill effects are small, deterministic, and always-positive (or a neutral status effect for hard work). A random flavour line is acceptable only if it touches nothing stateful; prefer deterministic flavour for now.
- [ ] RED first: write a test asserting the same activity logged twice with the same inputs produces the same stat deltas and effects (determinism). Then confirm.

## Section E: UI and Tone

- [ ] The free-day view shows the slot as free, prompts for an activity, and reacts to what is logged. The Council does not push a specific free-day workout.
- [ ] Off-block work is acknowledged neutrally as real work that factors into recovery, never as a bonus or a guilt source. ("You trained on a rest day. That was real work. The recovery math now includes it.")
- [ ] Verify rendering manually.

## Section F: Persistence and Offline

- [ ] Confirm activities, their source/category, and resulting effects persist and compute offline.
- [ ] No network calls introduced in Phase 10.

## Section G: Phase 10 Done When

- [ ] Free-day and off-routine activities can be logged with a source class, a sensible default, and an override.
- [ ] Off-block training can trigger the same status effects as planned training through the existing Phase 7 engine, proven by test.
- [ ] Off-block training maps to the relevant physical stat and Consistency; recovery_skill gives small Recovery/Judgment or flavour, no fatigue, no blocking effects.
- [ ] There is no numeric fatigue model; "feeds fatigue" reads as "can trigger status effects" everywhere.
- [ ] No activity gives a random or variable reward; determinism proven by test.
- [ ] The free day is not a rest day; resting on it is neutral, not a miss.
- [ ] All logic test-first; engine pure and unchanged in its source-agnostic behavior; no routing logic in components.
- [ ] Works offline.
- [ ] Committed on green, pushed, with a clear Phase 10 commit message.

---

## Explicit Exclusions (do not build in Phase 10)

- A numeric fatigue model (there is none; this phase confirms its absence)
- Random or jackpot rewards for any activity (forbidden)
- Ascension, test workout, tier bump, permanent lessons (Phase 11)
- AI parsing of activity notes (Phase 13); activities are logged via the UI here
- Bodyweight or food effects (forbidden permanently)
- New status effect types beyond those defined in Phase 7 (reuse the existing set)

## Watch-Outs

- The engine should not change. Phase 7 made the status engine source-agnostic precisely so Phase 10 adds only an input path. If you find yourself editing the status or Council engine to handle off-block, stop; the Phase 7 design was supposed to prevent that. The only new logic here is routing (source defaults, stat mapping), not recommendation logic.
- No jackpots, especially on running. The design explicitly warns that a "sometimes great" reward on running turns the app into a slot machine and pulls the user off the program. Off-block effects are deterministic and modest. A great run gets a flavour line, never a stat or progression bonus.
- Off-block is real work, not free upside. A hard off-block run after a hard swing day should add to recovery load (a status effect), not pay a bonus. Acknowledge it; do not reward it as extra credit that competes with the program.
- Fatigue is not a number. If any "feeds fatigue" remnant implies a numeric meter, remove it. Recovery is status effects only.
- Recovery_skill stays light. Yoga, walks, reading, cubes give small positive feedback and never create blocking effects or fatigue. Keep them clearly separate from off_block training in both routing and effect.
