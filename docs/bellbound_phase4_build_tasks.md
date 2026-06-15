# Bellbound Phase 4: Weekly Review v1 — Build Tasks

Detailed, tickable tasks for Phase 4 on the committed stack. Phase 4 gives the user a useful weekly summary before any deep RPG mechanics. The first Council Report is mostly factual: planned vs actual, no progression eligibility, no ascension status, no AI prose.

Prerequisite: Phase 0 through 3 complete (schema, repositories, seed, Today screen, logging, planned vs actual classification, the KB session counter, baseline tier resolution).

Goal of Phase 4: a weekly report over the last 7 calendar days, independent of block length, that is useful even without RPG stats, easy to understand, and free of guilt copy.

Reference: bellbound_rpg_mode_v4.md (Weekly Review as Council Report), bellbound_feature_build_plan_v1.md (Phase 4), bellbound_build_plan_updates_v1.md, bellbound_tech_stack_committed_pwa_v1.md.

State management: unchanged. React state plus Dexie liveQuery. No state library yet.

---

## TDD Protocol (Phase 4)

Strict red-green-refactor on the report aggregation logic. The rendering is verified manually.

Test-first (Vitest, fake-indexeddb where data is read):
- The report aggregation function: given the week template and the logs for a 7-day window, produce the structured report data.
- The 7-day window calculation (which calendar days are included relative to a given "today").

Verify manually:
- The report screen rendering.

This phase reuses the Phase 2 planned-vs-actual classification function. Do not reimplement it. If Phase 2 produced a weekly history aggregation, Phase 4 extends it into the report structure rather than duplicating it.

Discipline unchanged. Commit on green.

---

## Section A: Report Window

- [x] RED first: write failing tests for a pure function that, given a reference date ("today"), returns the 7-day window of calendar dates it covers (decide and document: trailing 7 days inclusive of today, or the last 7 full days). Then implement.
- [x] Use the same local-date discipline established in Phase 2 to avoid timezone off-by-one at the window boundaries. Test a boundary date.

## Section B: Report Aggregation

- [x] RED first: write failing tests for a pure aggregation function that takes the week template plus the logs in the window and returns structured report data containing: planned sessions (from the template), actual sessions (from logs), completed KB workouts, missed planned sessions, rest days taken, free-day activities, extras on rest days, and a simple notes summary. Then implement.
- [x] Reuse the Phase 2 `classifyDay` function per day to derive extras and misses. Do not duplicate the four-case logic.
- [x] The aggregation is pure: it takes the template and the logs and returns data. It does not read the DB. An app-layer service fetches the template and logs and calls it.
- [x] The report data is a plain structure the UI renders. No prose generation, no judgment text yet (the dry "Council Judgment" line can be a simple static or rule-free string at this phase; full judgment is later).

## Section C: Report Screen

- [x] Build a weekly report screen rendering the aggregated data for the last 7 days. Plain and readable.
- [x] Show, at minimum: the planned week, the actual sessions, extras and misses, and a neutral summary. Mirror the v4 example structure but keep it factual.
- [x] No guilt copy. A missed session is stated neutrally, not scolded. Rest is shown as part of the plan, not a gap.
- [x] Exclude from the rendered report at this phase: progression eligibility, ascension status, detailed fatigue or recovery warnings, AI-generated prose. These are later phases.
- [x] Verify rendering manually in the browser.

## Section D: Persistence and Offline

- [x] Confirm the report computes correctly offline from local data.
- [x] No network calls introduced in Phase 4.

## Section E: Phase 4 Done When

- [x] The weekly report is useful even without RPG stats.
- [x] Planned vs actual is easy to understand at a glance.
- [x] The report avoids guilt copy entirely.
- [x] The window and aggregation functions are pure and test-first; classification is reused from Phase 2, not duplicated.
- [x] The report is independent of block length (always the last 7 days).
- [x] Works offline.
- [x] Committed on green, pushed, with a clear Phase 4 commit message.

---

## Explicit Exclusions (do not build in Phase 4)

- Progression eligibility lines (Phase 6)
- Ascension status lines (the ascension phase)
- Detailed fatigue or recovery warnings (Phase 7)
- AI-generated prose for the report (Phase 13)
- Stats, quests, RPG flavour beyond a plain title (their phases)

## Watch-Outs

- Reuse classification. The four-case logic lives in Phase 2's `classifyDay`. The report builds on it. Two copies will drift, and the report is exactly where a drift would show as wrong extras/misses counts.
- Keep the judgment line trivial for now. The dry "Council" voice is real, but rule-driven judgment (what to recommend) is Phase 6 and later. A static or near-static line is correct here; do not sneak progression logic into the report.
- Window boundaries and timezones: a log at the edge of the window must land in the right week. Test a boundary date deliberately.
