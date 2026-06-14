# Bellbound Phase 1: Real Workout Log MVP — Build Tasks

Detailed, tickable tasks for Phase 1 on the committed stack. Phase 1 makes the app useful: open it, see today's real workout, log what happened. No RPG layer, no rules engine, no stats. The engine package is NOT called in this phase.

Prerequisite: Phase 0 complete (project, PWA shell, entities, Dexie schema, repositories, seed data, backup foundation).

Goal of Phase 1: a Today screen rendering the seeded Double KB Strength workout from the current block tier, and a log form that writes a WorkoutLog to IndexedDB and survives reload. Recent logs viewable.

State management: start with React's own state (`useState`, `useEffect`) and Dexie's `liveQuery` where reactivity helps. Do NOT introduce Zustand or any state library yet.

Reference: bellbound_rpg_mode_v4.md (Core Loop, UI Style), bellbound_feature_build_plan_v1.md (Phase 1), bellbound_tech_stack_committed_pwa_v1.md.

---

## TDD Protocol (Phase 1)

Phase 1 is UI-heavy, so apply TDD where it pays and verify manually where it does not. The rule is to extract logic out of components so the logic can be tested first, leaving components thin.

Test-first (red-green-refactor, Vitest, fake-indexeddb where data is involved):
- `todayService`: resolving today's planned day type from the week template, and resolving the concrete workout from the block tier and template. This is pure-ish logic over data and is the heart of Phase 1. Test it before writing it.
- The log-form submit logic: the function that builds a `WorkoutLog` entity from form inputs (status, rounds, difficulty, note, defaults for signals/source/etc). Extract this into a pure function and test it first, separate from the React component.
- `workoutLogRepository.listRecent(n)` ordering (newest first) if not already covered in Phase 0.

Verify manually, do not unit-test:
- React component rendering and layout. Open it in the browser. Test-first on JSX is high-cost, low-value here for a solo build.
- Offline behavior and persistence-across-reload. Verified in browser dev tools.

Discipline: if you are about to write logic inside a component (a calculation, a mapping, an entity construction), stop, extract it to a tested function, and have the component call it. Components orchestrate; they do not compute.

---

## Section A: App Shell and Routing

- [ ] Decide navigation: for Phase 1 a single Today screen plus a Recent Logs view is enough. Use minimal routing (React Router) or simple conditional rendering; do not over-build navigation.
- [ ] Create `app/src/ui/today/TodayScreen.tsx` and `app/src/ui/log/RecentLogs.tsx`.
- [ ] Wire a basic layout: a header with the app name, the Today screen as the default view, and a way to reach Recent Logs.
- [ ] Apply a minimal low-fi base style (system font, readable sizing, generous spacing, mobile-width friendly). Do not theme heavily yet; the workout table readability is the priority.

## Section B: Resolve Today's Workout

- [ ] RED first: write failing tests for `todayService` covering a KB day (resolves to Double KB Strength at the active tier), a rest day, and a free day. Then implement to pass.
- [ ] Create a small app-layer service `app/src/services/todayService.ts` (not in the engine) that determines today's planned day type and, if it is a KB day, the workout template to show.
- [ ] Implement: get today's date, read the default WeekTemplate, look up the weekday to get the planned `DayType`.
- [ ] If the day type is `kb`, read the active Block to get `baselineTier`, then read the relevant WorkoutTemplate (for Phase 1, hardcode that a KB day maps to Double KB Strength; template-per-day selection is a later concern).
- [ ] Resolve the concrete workout from the tier: given `baselineTier`, read the matching entry in the template's `tiers` (e.g. tier 1 = 4 rounds) and combine with the movements to produce the displayable workout (each movement with its reps/duration/load and the resolved round count). Extract this as a pure function with its own failing test first; it is the piece that moves into the engine in Phase 3, so keep it pure and well-tested now.
- [ ] For non-KB day types (rest, free, test), return a simple marker the Today screen can render differently (rest message, free-day activity prompt, test option). Full handling of these is later phases; Phase 1 just needs to not crash on a non-KB day.

## Section C: Today Screen UI

- [ ] Render the zone title (e.g. "The Double-Bell Gate") above the workout, but keep it secondary; the workout table is the primary element.
- [ ] Render the real workout table clearly: each movement with rounds x reps (or duration) and load, plus the rest prescription. Example layout target:
  ```
  Double clean        4 x 5       double 20 kg
  Double press        4 x 3       double 20 kg
  Double front squat  4 x 5       double 20 kg
  Push-ups            4 x 8-10    bodyweight
  Farmer carry        4 x 30 sec  double 20 kg
  Rest                90-120 sec after full round
  ```
- [ ] Use a real table or a styled grid; ensure it is readable on a narrow phone-width viewport (test in dev tools device mode).
- [ ] Show today's date and the planned day type.
- [ ] Add a clear "Log this workout" action that opens the log form (modal, drawer, or separate view).
- [ ] On a rest day, show a plain rest message instead of a workout table. On a free day, show a simple prompt to log an activity (the activity classification logic is Phase 10; here just allow a freeform note). On a test day option, defer — a stub is fine.
- [ ] Critical rule: never hide reps, rest, or load behind any decoration. The workout details are always fully visible.

## Section D: Log Form

- [ ] Create `app/src/ui/log/LogForm.tsx`.
- [ ] Capture: status (`completed` / `skipped` / `modified`), actual rounds or sets (number input, prefilled with the planned value), difficulty (`easy` / `normal` / `hard` / `failed` as a clear selector), and a freeform note (text area).
- [ ] Do NOT capture signal flags in Phase 1. The `signals` object is written at its default (all false). Signal capture is Phase 6.
- [ ] Do NOT capture sleep, bodyweight, or food here. DailyContext is Phase 7.
- [ ] RED first: extract the WorkoutLog construction into a pure function `buildWorkoutLog(inputs, context)` and write failing tests for it (correct id/date/blockId, source planned on a KB day, default signals all false, difficulty and status set, note as originalNote, roundsCompleted in structuredNotes). Then implement to pass. The React component calls this function; it does not build the entity inline.
- [ ] On submit, construct a `WorkoutLog` entity with: a generated `id`, today's `date`, the active `blockId`, `plannedDayType` and `actualDayType` (equal for now unless the day type differs from what was done), `source: 'planned'` for a KB day, `category` from the template, `plannedWorkout` and `actualWorkout` names, the chosen `status`, the chosen `difficulty`, default `signals`, the note as `originalNote`, and `structuredNotes` holding `roundsCompleted` (and any parsed extras, though Phase 1 keeps this minimal).
- [ ] Write via `workoutLogRepository.add(log)`.
- [ ] After save, return to the Today screen and reflect that today is logged (e.g. show a "logged" state).
- [ ] Validate inputs minimally: rounds is a non-negative number, difficulty is required if status is completed/modified.

## Section E: Recent Logs View

- [ ] Implement `workoutLogRepository.listRecent(n)` usage in `RecentLogs.tsx` to show the last N logs (e.g. 10), newest first.
- [ ] For each log, show date, workout name, status, difficulty, and the note.
- [ ] Use Dexie `liveQuery` so the list updates reactively after a new log is saved, or re-query on mount; either is acceptable for Phase 1.
- [ ] Keep it a plain readable list. No charts, no stats, no RPG flavour.

## Section F: Persistence and Reload

- [ ] Confirm a logged workout persists across a full page reload (data is in IndexedDB, not memory).
- [ ] Confirm the app loads and shows Today and Recent Logs while offline (dev tools offline mode), since the shell is cached and data is local.
- [ ] Confirm logging works offline (no network calls in Phase 1 at all).

## Section G: Phase 1 Done When

- [ ] The Today screen renders the seeded Double KB Strength workout, resolved from the active block's tier, with all movements, reps/duration, load, and rest visible.
- [ ] A workout can be logged with status, actual rounds, difficulty, and a note.
- [ ] The log is written to IndexedDB and survives a page reload.
- [ ] Recent logs are viewable, newest first.
- [ ] The app is genuinely useful as a plain training log with no RPG mechanics.
- [ ] Everything works offline.
- [ ] The engine package was not imported or called anywhere in Phase 1 (verify).
- [ ] `todayService`, the tier-resolution function, and `buildWorkoutLog` were written test-first and have passing tests. No computation lives inside components; components call tested functions.
- [ ] No signal flags, no sleep/bodyweight/food, no stats captured.
- [ ] Committed to git with a clear Phase 1 commit message.

---

## Explicit Exclusions (do not build in Phase 1)

- Progression recommendations (Phase 6)
- Status effects (Phase 7)
- Stats (Phase 8)
- Signal flags (Phase 6)
- DailyContext: sleep, bodyweight, food (Phase 7)
- Zones beyond a title, encounter text, completion messages (Phase 5)
- AI note parsing (Phase 13)
- Planned vs actual comparison and the KB session counter (Phase 2)
- Quests, items, titles (Phase 9)

## Watch-Outs

- Keep `todayService` in the app layer, not the engine. It does I/O (reads the DB). The engine stays pure and uncalled this phase.
- The tier-to-workout resolution is the one piece of logic that will later move into or be shared with the engine (Phase 3 makes tier resolution a pure function). For Phase 1, a simple app-layer resolution is fine; just keep it isolated so it can move cleanly later.
- Do not let the log form write anything into engine-only concerns. It writes a WorkoutLog row via the repository, nothing more.
