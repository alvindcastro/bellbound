# Bellbound Phase 12: Challenge Paths — Build Tasks

Detailed, tickable tasks for Phase 12 on the committed stack. Phase 12 lets the user start a new block (after ascension) with a modifier that changes emphasis. Challenge paths are a small, optional layer on top of the block system; they adjust the template emphasis, never bypass recovery or generate random workouts.

Prerequisite: Phase 0 through 11 complete. Ascension opens a new block (Phase 11); challenge paths attach a modifier to that new block.

Goal of Phase 12: after ascension, the user may select a challenge path; the selected path modifies the next block's emphasis deterministically; and no path overrides the recovery rules or the deterministic Council.

Reference: bellbound_rpg_mode_v4.md (Challenge Paths), bellbound_feature_build_plan_v1.md (Phase 12), bellbound_tech_stack_committed_pwa_v1.md.

State management: as decided earlier.

---

## TDD Protocol (Phase 12)

Strict red-green-refactor on the path-modifier logic (pure) and persistence (fake-indexeddb).

Test-first (Vitest, pure engine):
- How a selected path modifies block emphasis (which day types or templates are emphasized).
- That a path never disables a recovery rule or a status-effect restriction.

Test-first (Vitest, fake-indexeddb):
- The path selection persisted on the block and read back.

Verify manually:
- The path selection UI on the post-ascension screen.

Discipline unchanged. Commit on green.

---

## Section A: Challenge Path Model

- [ ] Add a `challengePath` field (nullable) on the Block. A block with no path is the default block. A block with a path carries a modifier.
- [ ] Define the paths from the concept as data:
    - The Clean Press Path: more emphasis on clean and press.
    - The Swing Marsh Path: more conditioning focus.
    - The Recovery Rogue Path: mandatory light day after hard conditioning.
    - The Minimalist Path: only 3 workouts per week.
    - The Double-Bell Path: two double-bell days per week.
- [ ] RED first: write failing repository tests (fake-indexeddb) that a path selected on a block persists and reads back, and that a block can have no path. Then implement.

## Section B: Path Modifiers (Deterministic Emphasis Only)

- [ ] RED first: write failing tests for a pure function that, given a base week template and a challenge path, returns the modified emphasis (e.g. Minimalist reduces to 3 training days; Double-Bell marks two days as double-bell; Recovery Rogue inserts a mandatory light day after hard conditioning). Then implement.
- [ ] A path modifies emphasis or the week template's day types for the block; it does not generate new random workouts and does not change the tier system.
- [ ] Critical: a path never overrides recovery. RED first: write a test that with the Recovery Rogue Path active, the mandatory light day is additive to (not a replacement for) status-effect restrictions; and that no path can cause the Council to recommend progression while a blocking status effect is active. A path changes emphasis; it cannot defeat the conservative-wins rule. Then confirm.

## Section C: Selection at Ascension

- [ ] On the post-ascension screen (Phase 11), offer an optional challenge path for the new block. Default is no path (the standard block).
- [ ] Persist the selected path on the newly opened block.
- [ ] A path is chosen per block, at block open. Changing path mid-block is out of scope (decide and document; simplest is path is fixed for the block's life).
- [ ] Verify selection UI manually.

## Section D: Applying the Path

- [ ] The Today screen and the weekly report reflect the path's emphasis (e.g. Minimalist shows 3 training days; the report's planned sessions match the modified template).
- [ ] The classification (Phase 2) and counter still work under a modified template: confirm a planned KB session under a Minimalist week still counts toward the guard correctly. RED first: write a test for the counter under a modified template. Then confirm.
- [ ] The tier resolver (Phase 3) is unaffected; a path changes which workouts appear, not how a tier resolves.

## Section E: Persistence and Offline

- [ ] Confirm path selection and its effects persist and compute offline.
- [ ] No network calls introduced in Phase 12.

## Section F: Phase 12 Done When

- [ ] After ascension, the user can optionally select a challenge path for the new block; no path is the default.
- [ ] A selected path modifies block emphasis deterministically (day types / template), persisted on the block.
- [ ] No path overrides recovery rules or lets progression happen while a blocking status effect is active, proven by test.
- [ ] Classification and the KB counter work correctly under a modified template, proven by test.
- [ ] No path generates random workouts or changes the tier system.
- [ ] All logic test-first; engine pure; no path logic in components.
- [ ] Works offline.
- [ ] Committed on green, pushed, with a clear Phase 12 commit message.

---

## Explicit Exclusions (do not build in Phase 12)

- Random workout generation of any kind
- Any path effect that disables or weakens recovery, status effects, or the conservative-wins rule
- Mid-block path switching (path is per block; document the decision)
- Currency, decay (deferred/forbidden as before)
- AI involvement (Phase 13)

## Watch-Outs

- Emphasis, not override. A challenge path changes what the week emphasizes; it never defeats a recovery rule or lets the Council progress through a blocker. If a path could override conservative-wins, it is a bug. The Recovery Rogue Path in particular is additive recovery, not a license to ignore status effects.
- The counter must still be right under a modified template. The Minimalist Path changes how many KB days a week has, which changes how fast the guard fills. Confirm the counter counts planned KB sessions correctly under any path, or ascension timing breaks.
- Deterministic only. A path's effect is fixed and predictable. No randomness, no surprise workouts. The user opting into a path knows exactly what it changes.
