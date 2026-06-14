# AGENTS.md

Instructions for coding agents (Codex and others) working in the Bellbound repository. This is the agent-facing companion to README.md and CLAUDE.md. Read it before editing.

## Project In One Paragraph

Bellbound is an offline-capable Progressive Web App: a kettlebell training log with an optional RPG layer. TypeScript, React, Vite, vite-plugin-pwa, Dexie over IndexedDB. Local storage is the source of truth; no backend until the AI phase. A pure-TypeScript rules engine runs in the browser. The app rewards training judgment, not volume. The RPG layer is feedback and flavour over a real log, never a workout generator.

## Setup Commands

```
npm install        # installs all workspaces
npm run dev        # Vite dev server for the app
npm test           # Vitest across packages
npm run build      # production build of the app
```

Node and npm required. The repo uses npm workspaces: `packages/engine` and `app`. A `server/` directory is reserved for the Go backend at the AI phase and is not present yet.

## Hard Rules

Do not violate these. If a task requires breaking one, stop and surface it.

1. TDD is mandatory for logic and data code. Write a failing test first, then the minimum code to pass, then refactor. Covers: `packages/engine`, `app/src/data/repositories`, `app/src/services`, `app/src/data/seed.ts`, `app/src/data/backup`. Use Vitest; use `fake-indexeddb` for anything touching IndexedDB. React rendering and service-worker config are verified manually, not unit-tested. Extract logic out of components so it can be tested first.

2. `packages/engine` is pure. No imports of React, Dexie, Vite, or any I/O. Inputs are plain objects; outputs are plain results. Never reach into storage or the DOM from the engine.

3. Mapping lives only in `app/src/data/repositories`. That layer alone knows both Dexie rows and engine entities. UI and engine never call Dexie directly.

4. Components orchestrate, they do not compute. No calculations or entity construction inline in JSX. Extract to a tested function and call it.

5. The program is the source of truth. No random workout generation. No auto-progression after a single good session. Progression follows the deterministic rules only.

6. No bad gamification. No guilt streaks, "train harder" copy, leaderboards, rest punishment, random reward jackpots, bodyweight commentary, or food scoring. Bodyweight and food are stored but never passed into engine functions.

7. The real workout is always visible in the UI: exercise, sets/rounds, reps, load, rest.

8. Offline-first. Do not add a required network call to the core loop. Backup export is part of the design and stays.

9. AI is a scribe, not an authority (relevant only at the AI phase). Parses notes, writes lore from structured facts. Never overrides rules, generates workouts, gives medical advice, or fabricates recovery certainty. App must work fully with AI off.

## Project Structure

```
packages/engine/src/
  entities/      plain TS domain types and enums
  council/       recommendation engine
  progression/   tier resolution and progression eligibility
  status/        status effect creation, expiry, stacking
  config.ts      tunable constants (single source of truth)

app/src/
  data/db/            Dexie schema
  data/repositories/  Dexie <-> engine entity mapping
  data/backup/        export / import
  data/seed.ts        first-run seed
  services/           app-layer logic with I/O (e.g. todayService)
  ui/                 React: today, log, review, character

server/   reserved for the Go AI proxy + optional backup endpoint; added at the AI phase
```

Data flow: Dexie row -> repository -> engine entity -> engine computes -> UI renders.

## Testing Instructions

- Run `npm test`. All logic and data code must have tests written before the implementation.
- For data-layer tests, ensure the Vitest setup registers `fake-indexeddb`.
- A change to engine logic without an accompanying test (added or updated) is incomplete.
- Commit only on green. Keep commits small, each a passing state.

## Domain Quick Reference

- Week template: fixed calendar-anchored 7-day pattern; does not re-align on drift.
- Block: weeks at one baseline tier; a successful guarded test workout bumps the tier and opens the next block. Tracks `completedPlannedKbSessions` vs `testGuardMinSessions`.
- Day types: kb, rest, free, test.
- Difficulty: easy | normal | hard | failed. Separate per-signal flags: pressGrindy, breathless, gripCooked, legsSore.
- Status effects: temporary, typed expiry, multiple active, most-conservative recommendation wins. No numeric fatigue model.
- Stats: strength, conditioning, control, consistency, recovery, judgment. Reset on ascension; permanent lessons persist.

## Config Defaults (tunable, in engine/src/config.ts)

- TEST_GUARD_MIN_SESSIONS = 6
- SLEEP_OK_HOURS = 7
- soreness effect durations (after_n_days) = 1 to 3
- Poor Sleep Goblin clears on a rest day or a night at/above SLEEP_OK_HOURS, whichever first.

## Workflow For Agents

- Work from the per-phase task checklists in `docs/`, in order. Do not skip ahead a phase. The document index at `docs/bellbound_document_index.md` lists what is current versus reference.
- Respect explicit per-phase exclusions. A defined-but-unused field (e.g. signals before its phase) is intentional; do not delete it.
- Do not introduce dependencies or state libraries beyond what the current phase specifies. (No state library before the phase that calls for one.)
- Prefer plain, explicit TypeScript. Match existing style.

## Escalate Before Acting

Raise a question rather than guessing when a change touches recovery or progression logic, would couple the engine to storage or UI, or could be read as rewarding volume or punishing rest. These encode the product's intent and are the easiest to break with a reasonable-looking change.

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
