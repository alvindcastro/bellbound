# CLAUDE.md

Guidance for Claude when working in the Bellbound repository. Read this before making changes.

## What This Project Is

Bellbound is an offline-capable PWA: a kettlebell training log with an optional RPG layer. Local IndexedDB is the source of truth. A pure-TypeScript rules engine runs in the browser. No backend until the AI phase.

The guiding thesis: the app rewards training judgment (repeating the baseline, resting, regressing when form suffers), not training volume. The RPG layer is flavour and feedback over a real training log. It is never a workout generator.

## Non-Negotiable Rules

These hold regardless of what a task seems to ask. If a request conflicts with one of these, stop and raise it rather than working around it.

1. Strict TDD on all logic and data code. Red-green-refactor. Write the failing test first, run it, confirm it fails for the right reason, then write the minimum code to pass, then refactor green. This applies to the engine, repositories, services, seed, and backup. It does not apply to React rendering or service-worker config, which are verified manually; extract logic out of components so it can be tested first.

2. The engine package is pure. `packages/engine` must never import React, Dexie, Vite, or anything with I/O. It takes plain entity objects in and returns results out. If you need data in the engine, the caller passes it in.

3. The repository layer is the only boundary. Only `app/src/data/repositories` knows both Dexie rows and engine entities. It maps between them. Do not import Dexie types into the engine, and do not call Dexie directly from UI components or the engine.

4. The training program is the source of truth. The app reacts to what was logged. Never add logic that generates random workouts or auto-progresses after a single good session.

5. No bad gamification. No guilt streaks, no "train harder" messaging, no leaderboards, no punishment for rest, no random reward jackpots, no bodyweight commentary, no food scoring. Bodyweight and food are stored but must never feed any engine function.

6. The real workout stays visible. Any UI must always show exercise, sets/rounds, reps, load, and rest. The RPG layer never hides them.

7. Offline-first. Do not introduce a required network call into the core loop. The app must function with no connection. Backup export is mandatory and already part of the design.

8. AI is a scribe, never an authority. When the AI layer exists, it parses notes into the fixed schema and writes lore prose from structured facts. It must not override the deterministic rules, generate workouts, give medical advice, or invent recovery certainty. The app must remain fully functional with AI disabled.

## Architecture Summary

```
packages/engine/   pure TS: entities, council (recommendations), progression, status effects, config
app/src/data/      db (Dexie schema), repositories (mapping), backup, seed
app/src/services/  app-layer logic that does I/O, e.g. todayService
app/src/ui/        React components: today, log, review, character
server/            reserved for the Go backend at the AI phase; not present yet
```

Data flow: Dexie rows -> repository maps to engine entities -> engine computes -> UI renders. UI components orchestrate; they do not compute. If you are about to put a calculation or entity construction inside a component, extract it to a tested function.

## Key Domain Concepts

- Week template: a fixed calendar-anchored 7-day pattern (Mon KB, Tue KB, Wed Rest, Thu KB, Fri KB, Sat Free, Sun Rest). It does not re-align when the user drifts.
- Block: a span of weeks at one baseline tier, ending on a successful test workout that bumps the tier. Carries `completedPlannedKbSessions` and `testGuardMinSessions`.
- Day types: kb, rest, free, test.
- Difficulty enum: easy, normal, hard, failed. Separate from per-signal flags (pressGrindy, breathless, gripCooked, legsSore).
- Status effects: temporary flags with an expiry type; multiple can be active; the recommendation takes the most conservative combination. Built in a later phase.
- Six stats: strength, conditioning, control, consistency, recovery, judgment. Reset on ascension; permanent lessons carry over.

## Config (single source of truth)

In `packages/engine/src/config.ts`. Current defaults, all tunable:

- TEST_GUARD_MIN_SESSIONS = 6
- SLEEP_OK_HOURS = 7
- soreness effect durations (after_n_days) = 1 to 3

Poor Sleep Goblin clears on a completed rest day or a logged night at or above SLEEP_OK_HOURS, whichever comes first. There is no numeric fatigue model; fatigue is expressed through status effects.

## Working Process

- Work from the per-phase task checklists in `docs/` (bellbound_phase0_build_tasks.md, bellbound_phase1_build_tasks.md, and later phases). Tasks are tickable and ordered. Do not jump ahead a phase. The full document set and a status index are in `docs/bellbound_document_index.md`.
- Commit on green, small commits, each a passing state.
- Run `npm test` continuously.
- Respect the explicit exclusions in each phase. A field defined early but unused (e.g. signals before the signals phase) is intentional; do not remove it.
- Match the existing code style. Prefer plain, explicit TypeScript over clever abstractions.

## When Unsure

Prefer raising a question over guessing on: anything touching recovery or progression logic (these encode the design intent), anything that would couple the engine to storage or the UI, and anything that looks like it rewards volume or punishes rest. These are the areas where a plausible-looking change can quietly violate the design.


<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->
