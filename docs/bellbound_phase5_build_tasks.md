# Bellbound Phase 5: Simple RPG Skin — Build Tasks

Detailed, tickable tasks for Phase 5 on the committed stack. Phase 5 adds flavour without changing any training rules. This is where Bellbound starts to feel like Bellbound, but the RPG layer is strictly cosmetic and reflective.

Prerequisite: Phase 0 through 4 complete (the app is a useful, factual training log with a weekly report).

Goal of Phase 5: workouts have zone names, exercises have encounter text, completions show dry messages, and the user has a character class. All of it is flavour. None of it touches progression, recovery, or the numbers.

Reference: bellbound_rpg_mode_v4.md (Zones, Encounters, Classes, Tone Guide, UI Style), bellbound_feature_build_plan_v1.md (Phase 5), bellbound_tech_stack_committed_pwa_v1.md.

State management: unchanged. No state library yet.

---

## TDD Protocol (Phase 5)

This phase is mostly static content and presentation, so strict TDD applies narrowly.

Test-first (Vitest):
- Any pure mapping function (e.g. workout-to-zone lookup, exercise-to-encounter-text lookup) gets a small test confirming the mapping returns the expected value and handles an unknown key gracefully.
- The completion-message selection logic if it is anything more than a constant (e.g. picks a message by status or day type).

Verify manually:
- All rendering, theme, and layout.

Most of Phase 5 is data (maps of strings) and JSX. Keep the few lookups pure and tested; verify the rest in the browser. Commit on green.

---

## Section A: Zones

- [x] Create static zone data mapping each workout template to a zone name. Suggested: Double KB Strength → The Double-Bell Gate, Armor Building Complex → The Armor Foundry, Single KB Strength → The Single-Bell Outpost, Swings/Push-ups → The Swing Marsh, Recovery → The Recovery Inn, Burpee Conditioning → The Burpee Bog, Saturday Free Day → The Free Lands.
- [x] RED first: write a small test for the workout-to-zone lookup, including an unknown workout returning a sensible default or null. Then implement.
- [x] The zone name comes from the template's `zoneName` field (seeded in earlier phases) or a lookup; pick one source of truth and use it. Do not hardcode zone names in components.

## Section B: Encounter Text

- [x] Create static encounter text per movement (short, dry flavour lines). Examples from v4: Double Press → "You press the bells overhead. The ceiling remains unimpressed."; Front Squat → "You descend into the Squat Mines. The quads begin collective bargaining."; Rest → "You do nothing. Against all odds, this was productive."
- [x] RED first: write a test for the movement-to-encounter lookup, including a movement with no defined text returning a graceful default (empty or generic). Then implement.
- [x] Encounter text is decoration around the movement, never a replacement for it. The movement name, reps, load stay primary and fully visible.

## Section C: Completion Messages

- [x] Create dry completion messages. Examples: "You completed the workout. The bells remain unemployed."; "You rested. This confused the goblins but pleased your joints."
- [x] If completion-message selection depends on status or day type (e.g. a different line for rest vs a completed KB session), RED first: write a test for the selection function. If it is a single constant per case, a test is optional but trivial.
- [x] Match the tone guide: dry, not motivational. No "Destroy your limits" energy anywhere. The app sounds like a strange training clerk.

## Section D: Character Classes

- [x] Add class selection (or a default class) to the Character. Classes: Bellbarian, Pressomancer, Squat Squire, Recovery Rogue, Program Warlock.
- [x] At this phase, classes are flavour only. No class bonuses, no mechanical effects. The class is a field on the Character with a display name and a flavour message.
- [x] If the user can pick a class, persist the choice to the Character via the repository. RED first: write a test that setting the class persists and reads back. Then implement.
- [x] Show the class and its flavour message on a character view. No stats yet (stats are Phase 8).

## Section E: Low-Fi Theme

- [x] Apply a low-fi, text-heavy theme: simple, readable, mobile-width friendly, minimal animation. Parchment optional. Small absurd item art is optional and can wait.
- [x] The workout table remains the primary, fully readable element. RPG flavour surrounds it; it never obscures sets, rounds, reps, load, or rest.
- [ ] Verify on a narrow phone-width viewport in dev tools device mode.

## Section F: Phase 5 Done When

- [x] Workouts display a zone name (from a single source, not hardcoded in components).
- [x] Exercises display encounter text, with graceful handling of movements that have none.
- [x] Completions show dry, on-tone messages.
- [x] The user has a character class (selected or default), persisted, shown with its flavour message.
- [x] The low-fi theme is applied and the workout table is never obscured.
- [x] The few lookups/selection functions are pure and tested; rendering verified manually.
- [x] No training rules changed: no progression, recovery, or numbers touched by any of this.
- [ ] Works offline.
- [ ] Committed on green, pushed, with a clear Phase 5 commit message.

---

## Explicit Exclusions (do not build in Phase 5)

- Class bonuses or any mechanical effect from class (classes are flavour only, permanently in the design unless deliberately revisited)
- Items with mechanical effects (items are cosmetic; Phase 9)
- Random rewards or random flavour selection that affects anything (no randomness that touches state)
- Combat systems (deferred indefinitely)
- Stats (Phase 8)
- Progression, recovery, status effects (their phases)

## Watch-Outs

- Flavour is seasoning, not the meal. The single rule for Phase 5: nothing here may change a number, a recommendation, or a training decision. If a "flavour" change would affect what the user is told to do, it is not flavour and does not belong in Phase 5.
- One source for zone names. Either the template field or a lookup, not both, and not hardcoded in components.
- Tone discipline. The dry clerk voice is the product's personality. Motivational-poster copy is explicitly wrong. When in doubt, more deadpan, less hype.
- Do not introduce randomness. Even cosmetic random selection is a slippery slope toward the slot-machine pattern the design forbids. Keep flavour deterministic for now; any future random flavour must never touch stats, progression, or rewards.
