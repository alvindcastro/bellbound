# Bellbound Phase 15: Paste-to-Template Authoring and Relative-Demand Council Integration — Build Tasks

Detailed, tickable tasks for a post-v1 feature in two connected parts:

1. Paste-to-template: type or paste a workout in plain English and have the app parse it into a structured WorkoutTemplate you confirm and save.
2. Relative-demand Council integration: when the workout actually done differs from the prescribed one, the Council compares their demand and reflects the difference honestly, gating progression for easier sessions and adding recovery load for harder ones, without rewarding either as a shortcut.

This builds on the Phase 14 gap (choosing a different workout on a training day). Phase 14 lets the user swap to an existing workout; Phase 15 lets the user author new workouts by pasting, and makes the Council aware of how a substituted or pasted workout compares to what was prescribed.

Prerequisite: Phase 0 through 14 complete. In particular: WorkoutTemplate with tiers and structured movements (Phase 3); the Council progression engine with conservative-wins and the priority order (Phase 6); the status system (Phase 7); stats and the Judgment/Control rewards and Wise Regression quest (Phase 8/9); planned-vs-actual and the swap path (Phase 2/14); the AI scribe and Go proxy (Phase 13, used here as the parser fallback).

State management: as established in prior phases.

---

## Design Decision (the principle this phase encodes)

A workout the user actually did is compared to the workout that was prescribed, and the difference affects the Council, but never as a shortcut in either direction.

- Easier than prescribed (lighter load, fewer sets, a regression like Single instead of Double, the lighter fallback load): does NOT advance progression of the prescribed baseline, even if logged "normal," because an easy substitute is not evidence the baseline is consolidated. It is not punished. It still earns Consistency, and if it was a deliberate regression for a real reason it earns Judgment and Control (the Wise Regression path).
- Harder than prescribed (heavier, more volume, a tougher variant): adds recovery load (can trigger or strengthen status effects, because more work than planned affects the next session) and does NOT buy faster progression, because overreaching on one day is not the deterministic "normal twice" signal the design trusts.
- Equivalent: normal progression logic applies unchanged.

Conservative-wins is preserved: when the demand comparison is uncertain, treat the session as NOT advancing progression rather than risk counting an easy day as progress. This is the safeguard against the gaming-down path (always do the easy variant, log normal, progress the hard baseline you never trained).

Two deliberate non-goals:
- Harder-than-prescribed does not count toward progression. Rejected because it reopens overreaching-as-shortcut.
- The demand comparison is coarse (easier / equivalent / harder), not a precise numeric model. Coarse is honest about what the data supports and less likely to mislead.

Deferred idea (not built here): offering a cosmetic item as acknowledgment for a notably harder session. Items are Phase 9 cosmetic rewards; tying them to overreaching needs care so it does not become an overreaching incentive. Record as a possible future feature, do not build in Phase 15.

---

## TDD Protocol (Phase 15)

Strict red-green-refactor. The parser and the demand comparison are pure logic and get thorough test-first coverage. The parser especially needs a broad table of input cases.

Test-first (Vitest, pure engine):
- The deterministic parser: many input phrasings to structured movements.
- The demand comparison: actual vs prescribed → easier / equivalent / harder, including the uncertain → not-advancing safeguard.
- The Council integration: easier gates progression, harder adds recovery load, equivalent unchanged, conservative-wins preserved.

Test-first (Vitest, fake-indexeddb):
- Saving a parsed workout as a WorkoutTemplate; reading it back.

Test-first (frontend + Go, only for the AI fallback path):
- The fallback calls the Phase 13 proxy when the deterministic parser fails and the user is online; offline or disabled, there is no fallback and the manual editor is used.

Verify manually:
- The paste UI, the parse-review-correct flow, and the Council's display of a demand-adjusted recommendation.

Discipline unchanged. The parser never auto-saves; the Council never auto-progresses. Commit on green.

---

# Part 1: Paste-to-Template

## Section A: The Deterministic Parser

- [x] RED first: write a broad failing test table for a pure parser `parseWorkoutText(text)` returning structured movements, then implement. Cover the real grammar from the user's actual workouts:
    - "Single-arm clean 24 kg 3x5 each side" → movement, load 24kg, 3 sets (or rounds), 5 reps, each-side true.
    - "Single-arm press 24 or 16 kg 3x3 each side" → primary load 24kg, fallback load 16kg, each-side true. PRESERVE the primary-or-fallback choice; do not flatten to one number.
    - "Goblet squat 16 or 24 kg 3x8" → primary 16kg, fallback 24kg, 8 reps, each-side false.
    - "Suitcase carry 24 kg 3x30 sec each side" → time-based (30 sec), each-side true.
    - "Push-ups 3x8-10" → bodyweight, rep range 8 to 10.
    - Rest lines ("Rest 60-90 sec after full round") → parsed as the round rest, not a movement.
- [x] The parser is pure and offline. It does not call the network. It returns a structured result plus a per-line confidence/unparsed marker so the UI can flag lines it could not parse.
- [x] Preserve primary-or-fallback loads as a first-class field on the movement (e.g. `load: { primary, fallback? }`). This feeds the regression/judgment logic later and the demand comparison.
- [x] Handle the common variations deliberately and test them: "x" vs "×" vs "by", "kg" vs "kgs", "each side" vs "e/s" vs "per side", sets-x-reps vs rounds, rep ranges, time vs reps. Decide which variations to support and test the supported set; flag the rest as unparsed rather than guessing.

## Section B: Parse-Review-Correct-Save Flow

- [x] Build a paste UI: a text area where the user pastes or types a workout, and a parse action.
- [x] After parsing, show the structured result for review: each movement with its parsed fields editable, and any unparsed lines clearly flagged for manual fixing. The parser NEVER auto-saves; the user always confirms and corrects first (same rule as Phase 13 note parsing).
- [x] RED first: write failing tests that saving the confirmed result creates a WorkoutTemplate (with a name the user provides, structured movements, and either fixed values or tier definitions). Then implement. Decide and document: does a pasted workout get tiers, or is it a fixed single-tier workout? Recommendation: pasted workouts default to a single fixed tier; the user can add tiers later if they want it to progress. This keeps pasting fast.
- [x] Once saved, the pasted workout is a real WorkoutTemplate: assignable, selectable in the Phase 14 swap picker, and counted like any other template when done on a KB day.

## Section C: AI Fallback (optional, online only)

- [x] RED first: write failing tests that when the deterministic parser leaves lines unparsed AND the user is online with AI enabled, an AI fallback (via the Phase 13 Go proxy) can attempt the unparsed text; its output is validated against the same structured schema and shown for confirmation, never auto-saved. Then implement.
- [x] Offline or AI-disabled: there is no fallback. The user fixes unparsed lines manually in the review UI. The feature is fully usable with no network and no AI; the AI only reduces manual correction when available.
- [x] The Anthropic key stays server-side (Phase 13 rule). The client calls the proxy, not the API.

---

# Part 2: Relative-Demand Council Integration

## Section D: Demand Comparison (coarse)

- [x] RED first: write failing tests for a pure function `compareDemand(actualWorkout, prescribedWorkout)` returning `easier | equivalent | harder`, then implement. Coarse signals:
    - Lower load (including choosing the fallback over the primary) → leans easier.
    - Fewer sets/rounds or lower reps/time → leans easier.
    - A known regression variant (Single vs Double, goblet vs front squat) → leans easier.
    - Higher load, more volume, a tougher variant → leans harder.
    - Roughly matching → equivalent.
- [x] The comparison is coarse and conservative: when signals conflict or data is insufficient, return a result that does NOT advance progression (treat as easier/uncertain for progression-gating purposes). RED first: test the uncertain case resolves to not-advancing.
- [x] The comparison reads structured movements (loads incl. primary/fallback, sets, reps/time, variant). A workout with no structured data cannot be compared; ensure pasted workouts produce comparable structure (Part 1 guarantees this) and handle a missing-structure case by treating it as uncertain → not-advancing.

## Section E: Council Integration

- [x] RED first: write failing tests wiring the demand result into the Council, then implement:
    - Easier-than-prescribed session: does not contribute to the "normal twice" progression count for the prescribed baseline, even if logged normal. Still grants Consistency; if a deliberate regression with a reason, grants Judgment/Control and can satisfy the Wise Regression quest (reuse Phase 8/9, do not reinvent).
    - Harder-than-prescribed session: adds recovery load (may create or strengthen a status effect via the Phase 7 engine) and does not contribute to the progression count. Acknowledged as real work, not rewarded as faster progress.
    - Equivalent session: normal Phase 6 progression logic applies unchanged.
- [x] Conservative-wins is preserved end to end: an easier or uncertain session never advances progression; a blocking status effect still beats any progression suggestion; a good signal never cancels a blocker. RED first: test that an easier session logged normal twice does NOT make the prescribed baseline progression-eligible.
- [x] The Council's explanation reflects the demand honestly and neutrally: e.g. "this was lighter than the prescribed workout, so it does not count toward progressing the baseline, but it counts as training and as a smart regression." No guilt copy for going easier; no praise-as-shortcut for going harder.

## Section F: Recovery Load From Harder Sessions

- [x] RED first: write failing tests that a harder-than-prescribed session feeds the Phase 7 status engine the same way off-block extra work does (via signals or a demand-derived effect), so the next session's recommendation accounts for the extra load. Then implement, reusing the Phase 7 engine; no new status logic.
- [x] Do not invent a numeric fatigue model (there is none). Harder-than-prescribed expresses through status effects only, consistent with Phase 7 and 10.

## Section G: Persistence and Offline

- [x] Confirm parsing, template saving, demand comparison, and Council integration all work offline (the AI fallback is the only online-dependent part, and it is optional).
- [x] No required network calls in the core flow.

## Section H: Phase 15 Done When

- [x] A workout pasted in plain English is parsed deterministically into structured movements, with unparsed lines flagged, reviewed and corrected by the user, and saved as a real WorkoutTemplate. Never auto-saved.
- [x] Primary-or-fallback loads ("24 or 16 kg") are preserved as structured data, not flattened.
- [x] An optional AI fallback assists with unparsed text when online and enabled; the feature is fully usable offline without it.
- [x] The Council compares the actual workout's demand to the prescribed one (coarse: easier / equivalent / harder), erring to not-advancing when uncertain.
- [x] Easier-than-prescribed gates progression of the prescribed baseline, is not punished, and can earn Consistency/Judgment/Control and the Wise Regression quest.
- [x] Harder-than-prescribed adds recovery load via the existing status engine and does not buy faster progression.
- [x] Equivalent sessions run normal progression logic.
- [x] Conservative-wins preserved: an easier or uncertain session never advances progression; blockers still win; proven by test.
- [x] No new reward mechanism, no numeric fatigue model, no auto-save, no auto-progression.
- [x] All logic test-first; engine pure; parser offline; AI fallback optional and behind the proxy.
- [x] Works offline.
- [x] Committed on green, pushed, with a clear Phase 15 commit message.

---

## Cross-Phase Touch Points

- Phase 3: pasted workouts become WorkoutTemplates; the resolver renders them (single fixed tier by default).
- Phase 6: the progression count now gates on demand comparison; easier/uncertain does not advance it.
- Phase 7: harder-than-prescribed feeds the existing status engine; no new status logic.
- Phase 8/9: easier deliberate regressions reuse Judgment/Control and the Wise Regression quest.
- Phase 13: the AI scribe proxy is reused as the optional parser fallback; same key-server-side rule, same validate-and-confirm rule.
- Phase 14: pasted templates appear in the swap picker and count like any other workout when done on a KB day.

---

## Explicit Exclusions (do not build in Phase 15)

- Harder-than-prescribed counting toward progression (rejected; reopens overreaching-as-shortcut)
- A precise numeric demand or fatigue model (coarse comparison only; no numeric fatigue)
- New reward mechanisms (reuse Judgment/Control and existing quests)
- Item rewards for harder sessions (deferred idea; build later if at all, carefully, so it is not an overreaching incentive)
- Auto-saving parsed workouts or auto-progressing from substitutes
- Shipping the Anthropic key in the client (the fallback uses the Phase 13 proxy)
- Random anything

## Watch-Outs

- The demand comparison must err conservative. The single biggest risk: a too-generous comparison lets an easy substitute count as progress, which is the gaming-down path the design forbids. When signals conflict or data is thin, return not-advancing. Test the uncertain case explicitly.
- Easier is not punished, harder is not rewarded. The honest middle: reflect reality without making either a shortcut. No guilt for regressing, no acceleration for overreaching. The copy must stay neutral.
- Preserve the fallback load. "24 or 16 kg" is meaningful: choosing 16 is a regression signal that feeds Judgment/Control. Flattening it to one number loses that. Parse it as primary-with-fallback and carry it through to the demand comparison and the reward logic.
- Parser is offline-first; AI is optional polish. The deterministic parser is the product; the AI fallback only reduces manual fixing when online. At the gym with no signal, pasting and correcting manually must work fully. Do not make the AI the default path.
- Reuse, do not reinvent. Demand-harder feeds the existing status engine; deliberate regressions feed the existing Judgment/Control rewards and the existing Wise Regression quest. If you are writing new status or reward logic here, check whether an existing function already does it.
- Never auto-save, never auto-progress. The parser proposes a template for confirmation; the Council proposes a recommendation. Both are advisory. The user saves the template; the user (gated, in the ascension phase) bumps the tier. Phase 15 changes none of that.
