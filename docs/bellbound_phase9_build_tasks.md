# Bellbound Phase 9: Quests, Items, and Titles — Build Tasks

Detailed, tickable tasks for Phase 9 on the committed stack. Phase 9 adds quests, cosmetic items, and titles unlocked by behavior. All rewards are cosmetic. Nothing here has a mechanical effect, costs currency, or drops randomly.

Prerequisite: Phase 0 through 8 complete. Stats, the Council, the status system, and classification all exist.

Goal of Phase 9: quests reward repeatable good behavior and judgment; completing them unlocks cosmetic items and titles; and none of it changes training, progression, or recommendations.

Reference: bellbound_rpg_mode_v4.md (Quests, Items), bellbound_feature_build_plan_v1.md (Phase 9), bellbound_tech_stack_committed_pwa_v1.md.

State management: as decided earlier.

---

## TDD Protocol (Phase 9)

Strict red-green-refactor on quest progress and unlock logic (pure) and persistence (fake-indexeddb).

Test-first (Vitest, pure engine):
- Quest progress evaluation: given relevant logs/behavior, compute progress toward each quest objective.
- Unlock evaluation: when an objective is met, mark the quest complete and grant its reward.

Test-first (Vitest, fake-indexeddb):
- Quest, item, and title state persisted and read back.

Verify manually:
- The quests/items/titles UI.

Discipline unchanged. Commit on green.

---

## Section A: Quest Model

- [ ] Add Dexie tables (or fields) for quests, items, and titles. A quest carries: id, name, objective, progress (current/required), reward (item and/or title and/or a cosmetic stat note), and completion state.
- [ ] RED first: write failing repository tests (fake-indexeddb) for quest read/write and completion state persistence. Then implement.

## Section B: Quest Progress Evaluation

- [ ] RED first: write failing tests for a pure progress function per quest, then implement. Suggested quests from the concept:
    - Survive the Baseline: complete the current-tier Double KB Strength twice → unlocks progression suggestion (note: the suggestion already comes from the Council; the quest reward is the cosmetic acknowledgment, not a new mechanic) and a cosmetic item.
    - Enter the Armor Foundry: complete 10 ABC sets → cosmetic item.
    - The Hundred Swings: 100 total swings at 24 kg → cosmetic item, optional swing-volume display.
    - The Push-up Bureaucracy: 100 total push-ups in a workout → cosmetic title.
    - The Good Swap: swap a workout due to fatigue/sleep/soreness/schedule and still train appropriately → Judgment-themed cosmetic reward.
    - The Wise Regression: use a lighter bell or lower volume to protect form → Control/Judgment-themed cosmetic reward.
- [ ] Progress functions are pure: they take the relevant logs/behavior and return progress. They do not read the DB.
- [ ] Quests reward judgment and repeatable behavior, not volume escalation. Confirm no quest rewards simply "more": e.g. there is no "do 500 swings" arms race quest. Judgment quests (good swap, wise regression) are first-class.

## Section C: Unlocks (Cosmetic Only)

- [ ] RED first: write failing tests that completing a quest grants its reward (item/title) exactly once and persists. Then implement.
- [ ] Items and titles are cosmetic: a name, optional flavour text, optional small art. They have NO mechanical effect, no stat bonus that gates anything, no currency cost (there is no currency).
- [ ] Confirm a granted reward cannot be re-granted (idempotent unlock), tested.

## Section D: UI

- [ ] Build a view listing active quests with progress, completed quests, unlocked items, and earned titles.
- [ ] Allow displaying an earned title on the character view (cosmetic).
- [ ] Keep the tone dry. Quest and item flavour follows the tone guide; no motivational copy.
- [ ] Verify rendering manually.

## Section E: Persistence and Offline

- [ ] Confirm quest progress, completions, items, and titles persist and evaluate offline.
- [ ] No network calls introduced in Phase 9.

## Section F: Phase 9 Done When

- [ ] Quests track progress from real logged behavior via pure, tested functions.
- [ ] Completing a quest grants a cosmetic item or title exactly once, persisted.
- [ ] No quest, item, or title has any mechanical effect on training, progression, recovery, or recommendations.
- [ ] No quest rewards raw volume escalation; judgment quests exist and are first-class.
- [ ] There is no currency and no random drop.
- [ ] All logic test-first; engine pure; no quest logic in components.
- [ ] Works offline.
- [ ] Committed on green, pushed, with a clear Phase 9 commit message.

---

## Explicit Exclusions (do not build in Phase 9)

- Currency of any kind (deferred indefinitely; was explicitly removed from the design)
- Random drops or variable rewards (forbidden; the slot-machine pattern the design avoids)
- Mechanical item effects, stat bonuses that gate anything, or buyable upgrades
- Leaderboards or social features (out of scope)
- Volume-escalation quests ("do ever more")
- Ascension, permanent lessons, challenge paths (the ascension and later phases)

## Watch-Outs

- Cosmetic means cosmetic. The single rule of Phase 9: a quest, item, or title may acknowledge behavior but never change a number, gate a workout, or alter a recommendation. The moment a reward has a mechanical effect, it becomes a reason to chase it, which is the volume/jackpot failure mode.
- No currency, no randomness. Both were deliberately cut from the design. Do not reintroduce them as "small" features; they are the exact things the product avoids.
- Reward judgment, not volume. The valuable quests are the ones that celebrate resting, regressing, and swapping wisely. A quest that rewards "more swings forever" works against the thesis. Keep volume quests bounded and modest; keep judgment quests prominent.
- Idempotent unlocks. A quest completes once. Re-evaluating after more logs must not re-grant. Test it.
