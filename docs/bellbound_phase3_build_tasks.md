# Bellbound Phase 3: Workout Templates and Baseline Tiers — Build Tasks

Detailed, tickable tasks for Phase 3 on the committed stack. Phase 3 represents progression as baseline tiers rather than one-off workout edits, and moves tier resolution into the pure engine where it belongs.

Prerequisite: Phase 0 (schema, repositories, seed), Phase 1 (Today screen rendering a workout, including an extracted tier-resolution function), and Phase 2 (planned vs actual, the KB session counter) complete.

Goal of Phase 3: a block runs at one baseline tier; each workout template defines what that tier means for it; today's workout is generated from the active block's tier through a pure engine function; and a future tier bump would update every workout without editing each day. No automatic tier bumping, no ascension, no permanent lessons yet.

Reference: bellbound_rpg_mode_v4.md (Blocks and Baseline, Baseline Tiers, per-template tier definitions), bellbound_feature_build_plan_v1.md (Phase 3), bellbound_tech_stack_committed_pwa_v1.md.

State management: unchanged. React state plus Dexie liveQuery. No state library yet.

---

## TDD Protocol (Phase 3)

Strict red-green-refactor. Phase 3 is almost entirely pure engine logic, so it is the cleanest TDD phase so far. Nearly everything is test-first in the engine with Vitest, no fake-indexeddb needed except where a repository reads a template.

Test-first (Vitest, pure engine):
- Tier resolution: given a workout template and a tier number, return the concrete workout (resolved rounds/sets/reps/load per movement).
- Tier-step semantics per template (add a round, add sets, add volume).
- Out-of-range and missing-tier handling.

Test-first (Vitest, fake-indexeddb):
- The app-layer service that fetches the active block and template from the repo and calls the pure resolver.

Verify manually:
- The Today screen still renders correctly from the resolved workout.

Discipline unchanged: pure logic in the engine, I/O in the app layer, components orchestrate. Commit on green.

---

## Section A: Tier Model in the Engine

- [x] RED first: write failing tests for a pure function `resolveWorkoutAtTier(template, tier)` in the engine (e.g. `packages/engine/src/progression/resolveWorkoutAtTier.ts`) that returns the concrete workout for that tier: each movement with its resolved rounds/sets, reps or duration, and load.
- [x] Define the resolved-workout return type in the engine entities (e.g. `ResolvedWorkout` with a list of resolved movements, plus the rest prescription). Keep it a plain type.
- [x] Implement `resolveWorkoutAtTier` to read the template's `tiers` map for the given tier and combine it with the template's `movements`.
- [x] If Phase 1 already produced a tier-resolution function in the app layer, move it into the engine here as `resolveWorkoutAtTier`, port its tests, delete the app-layer copy, and have the app call the engine version. There must be exactly one tier resolver and it lives in the engine.

## Section B: Per-Template Tier Semantics

The whole-baseline bump applies one tier up to everything, but each template expresses its tier differently. Encode that the tier step is a property of the template, not a global rule.

- [x] RED first: write failing tests for Double KB Strength: tier 1 = 4 rounds, tier 2 = 5 rounds, tier 3 = 6 rounds, with reps and load constant across tiers. Confirm `resolveWorkoutAtTier` returns the right round count per tier. Then confirm it passes (the resolver from Section A should already handle this if the template encodes rounds per tier).
- [x] RED first: write failing tests for Armor Building Complex: tiers map to sets (10, 12, 15, 20). Confirm resolution returns the right set count per tier.
- [x] RED first: write failing tests for a conditioning/swing template where the tier step is total reps or density. Confirm resolution returns the right volume per tier.
- [x] Confirm the `tierStep` field on each template is descriptive (human-readable, e.g. "add one round") and the `tiers` map is the machine-readable source the resolver uses. The resolver reads `tiers`, not `tierStep`.

## Section C: Initial Template Set

Build a small set of templates with tier definitions. Seed them (extend the Phase 0 seed).

- [x] Confirm/extend the seed to include these templates with tier definitions and movements:
    1. Double KB Strength (tiers by rounds)
    2. Armor Building Complex (tiers by sets)
    3. Single KB Strength (tiers by round, reps, or load per its own rule)
    4. Swing / Push-up Conditioning (tiers by total reps or density)
    5. Rest / Recovery (no tier progression; a marker template)
- [x] RED first: write failing seed tests (fake-indexeddb) asserting each new template seeds with its tiers and movements, and that re-seeding does not duplicate. Then implement the seed additions.
- [x] Keep each template's tier definitions explicit and small. Do not over-build tiers beyond what is needed (3 to 4 tiers per template is plenty for now).

## Section D: Today's Workout From the Active Tier

- [x] RED first: write a failing test (fake-indexeddb) for the app-layer flow: given an active block at tier N and a KB day resolving to Double KB Strength, the service returns the resolved workout at tier N. Then implement, having the service fetch the block and template from the repos and call `resolveWorkoutAtTier`.
- [x] Update `todayService` (from Phase 2) to use the engine resolver for the displayed workout, replacing any interim resolution.
- [x] Confirm the Today screen renders the resolved workout for the active tier with all movements, reps/duration, load, and rest visible (no regression from Phase 1 visibility rules).

## Section E: Tier Bump Readiness (no automation yet)

The tier bump itself (on a successful test) is a later phase. Phase 3 only proves that a bump would propagate correctly.

- [x] RED first: write a test demonstrating that changing the active block's `baselineTier` from N to N+1 causes every template to resolve to its N+1 definition, with no per-day editing. This is a test of `resolveWorkoutAtTier` plus the service reading the block tier; it proves propagation.
- [x] Do NOT build the bump trigger, the test workout, ascension, or the counter reset. Those belong to the ascension phase. Phase 3 only proves the tier drives resolution.
- [x] Leave a clear marker (comment or pending test) noting that the bump flow is owned by the ascension phase and will set `baselineTier` and reset the counter.

## Section F: Persistence and Offline

- [ ] Confirm the seeded templates and their tiers persist and load offline.
- [ ] Confirm today's workout resolves correctly offline from the local block tier and template.
- [x] No network calls introduced in Phase 3.

## Section G: Phase 3 Done When

- [x] Today's workout is generated from the active block's tier via the single engine resolver `resolveWorkoutAtTier`.
- [x] There is exactly one tier resolver and it lives in the engine; any Phase 1 app-layer copy has been removed.
- [x] Each template controls its own tier expression (rounds, sets, or volume), and the resolver reads the machine-readable `tiers` map.
- [x] The initial template set is seeded with tiers and movements, with no duplication on re-seed.
- [x] A change to the block's `baselineTier` propagates to all workouts with no per-day editing, proven by test.
- [x] All tier logic written test-first; the engine stayed pure; I/O stayed in the app layer.
- [ ] Everything works offline.
- [x] The bump/ascension flow is documented as deferred, not built.
- [x] Committed on green, pushed, with a clear Phase 3 commit message.

---

## Explicit Exclusions (do not build in Phase 3)

- Automatic tier bumping (the ascension phase)
- The test workout and ascension guard (the ascension phase)
- Permanent lessons (the ascension phase)
- The counter reset on block open (the ascension phase)
- Challenge paths (a later phase)
- Progression recommendations and eligibility (Phase 6) — note: progression eligibility is a separate concern from tier resolution; Phase 3 only resolves the workout at the current tier, it does not decide when to advance
- Status effects, stats, quests, RPG flavour (their respective phases)

## Watch-Outs

- One resolver, in the engine. The single most important Phase 3 outcome is that tier resolution is pure, lives in the engine, and is the only copy. If Phase 1 left a resolver in the app layer, deleting it after porting is part of the work, not optional. Two resolvers will drift.
- The resolver reads `tiers`, not `tierStep`. `tierStep` is human-readable description; `tiers` is the data. Do not parse `tierStep`.
- Resolution is not progression. Phase 3 answers "what is the workout at tier N." It does not answer "should the user move to tier N+1." That decision is Phase 6 (recommendation) and the ascension phase (the actual bump). Keep them separate; conflating them reintroduces the auto-progression risk the design forbids.
- Handle a missing or out-of-range tier deliberately (e.g. tier above the highest defined): decide whether to clamp to the highest tier, error, or hold, and test it. Do not let an undefined tier produce an undefined workout.
- Rest/Recovery templates have no tier progression. Make sure the resolver and the service handle a non-progressing template cleanly rather than assuming every template has a tiers map with the active tier.
