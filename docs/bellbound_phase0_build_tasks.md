# Bellbound Phase 0: Foundation and Data Model — Build Tasks

Detailed, tickable tasks for Phase 0 on the committed stack: React, TypeScript, Vite, vite-plugin-pwa, Dexie over IndexedDB, pure-TS engine package. Client-only start with manual backup. No backend yet.

Goal of Phase 0: the project exists, the data model is defined in both Dexie (persistence) and the engine (domain), the repository maps between them, config constants exist, and a seeded block plus workout template can be written to and read from IndexedDB. No UI beyond proving persistence works. No RPG, no rules.

Reference: bellbound_rpg_mode_v4.md for entity definitions, bellbound_tech_stack_committed_pwa_v1.md for the stack, bellbound_build_plan_updates_v1.md for the corrections (signals defined now but empty, counter owned by Phase 2, etc).

---

## TDD Protocol (Applies To All Coding Tasks)

Strict red-green-refactor on everything that is logic or data, which is most of this project.

1. RED: write a failing test first. Run it. Confirm it fails for the expected reason (not a typo or import error).
2. GREEN: write the minimum code to make the test pass. Nothing more.
3. REFACTOR: clean up with the test still green. Re-run after each change.

Rules:
- No production logic is written before a failing test exists for it.
- Commit on green. Small commits, each a passing state.
- Tooling: Vitest for the engine (pure, fast, no environment). Vitest plus `fake-indexeddb` for the Dexie schema, repositories, services, seed, and backup (these touch IndexedDB and must be tested against a fake IDB, not a real browser).
- Run `npm test` (or the watch mode) continuously while working.

Where strict TDD applies (test-first, non-negotiable):
- Engine entities construction and type guards (light, but still a test).
- Engine config (a test asserting the constants exist with expected defaults).
- Dexie schema initialization (test it opens and has the expected tables/indexes via fake-indexeddb).
- Every repository function (test the round-trip: write an entity, read it back, assert the mapping).
- Seed logic (test that seeding an empty DB produces the expected records, and that re-seeding does not duplicate).
- Backup export/import (test export produces valid JSON of all tables, import restores it).

Where strict TDD does NOT apply (and why):
- The PWA service-worker shell and manifest config. These are verified manually in the browser (dev tools), because test-first on Workbox/SW behavior is high-cost and low-value for a solo build. Verify, do not unit-test.
- Pure scaffolding (package.json, tsconfig, vite config). No tests; they either build or they do not.

If a task below produces logic or data behavior, its first sub-step is "write the failing test." That is implied for every Section C through H task even where not restated.

---

## Section A: Project Setup

- [x] IDE: with the JetBrains All Products Pack, use WebStorm for Phases 0 through 12 (TypeScript/React PWA) and GoLand at Phase 13 (Go backend). Each is best-in-class for its language. Open the same monorepo in both when the backend exists; the only cost is two windows, and the two languages are worked in different phases anyway.
- [x] Create a new directory `bellbound-web` and initialize a git repository in it.
- [x] Create a new remote repository (e.g. github.com/alvindcastro/bellbound-web) and set it as the origin. Push the initial commit once the scaffold exists.
- [x] Plan the repo layout to anticipate the backend: `packages/engine` and `app` now, and a sibling `server/` directory reserved for the Go AI proxy and optional backup endpoint at Phase 13. Do not create `server/` yet; just keep the root uncluttered so it slots in cleanly. Open the frontend in WebStorm; at Phase 13 open the same repo in GoLand for the `server/` directory.
- [x] Set up a monorepo with two packages: `packages/engine` (pure TypeScript) and `app` (the Vite React PWA). Use npm workspaces (root `package.json` with a `workspaces` field listing `packages/*` and `app`).
- [x] In the root `package.json`, set `"private": true` and define the workspaces array.
- [x] Scaffold the `app` package with Vite using the React + TypeScript template (`npm create vite@latest app -- --template react-ts`), then move it under the workspace layout if needed.
- [x] Scaffold `packages/engine` as a plain TypeScript package: its own `package.json` (name `@bellbound/engine`), a `tsconfig.json`, and a `src/` directory. It must NOT depend on react, dexie, or vite.
- [x] Add `@bellbound/engine` as a workspace dependency of `app` (path/workspace reference).
- [x] Install and configure Vitest at the root or per-package for running engine tests. Confirm `npm test` runs an empty/placeholder engine test successfully.
- [x] Install `fake-indexeddb` as a dev dependency in the `app` package and configure a Vitest setup file that registers it, so data-layer tests (Dexie, repositories, seed, backup) run against a fake IndexedDB with no browser. Confirm a placeholder data-layer test can open the DB under fake-indexeddb.
- [x] Confirm `npm run dev` in `app` starts the Vite dev server and serves the default page in a browser.
- [x] Add a `.gitignore` covering `node_modules`, `dist`, and Vite/editor artifacts (include `.idea/` if you do not want IDEA project files tracked, or keep shareable parts per preference).
- [x] Commit the empty scaffold as the first commit and push to the remote.

## Section B: PWA Shell Setup

- [x] Install `vite-plugin-pwa` in the `app` package.
- [x] Configure `vite-plugin-pwa` in `vite.config.ts` with `registerType: 'autoUpdate'` and a Workbox config that precaches the app shell (HTML, JS, CSS).
- [x] Create the web app manifest fields in the plugin config: `name: "Bellbound"`, `short_name: "Bellbound"`, `display: "standalone"`, a theme color, a background color, and placeholder icon entries (real icons can come later; use a simple placeholder PNG for now).
- [x] Verify the service worker registers without errors in the browser dev tools (Application tab, Service Workers).
- [x] Verify the app still loads after going offline in dev tools (Network tab, offline checkbox) — the shell should load even with no network. Data layer is not built yet, so only the shell needs to load.
- [x] Note: do NOT build the iOS install hint or persistent-storage request yet; those are polish for a later phase. Phase 0 only proves the shell caches.

## Section C: Engine Domain Entities (pure TypeScript)

Define plain TypeScript types/interfaces in `packages/engine/src/entities`. These are the domain types the engine reasons about. They are independent of Dexie's row shapes.

- [x] Create `entities/enums.ts` with: `DayType` (`'kb' | 'rest' | 'free' | 'test'`), `Difficulty` (`'easy' | 'normal' | 'hard' | 'failed'`), `WorkoutSource` (`'planned' | 'off_block' | 'recovery_skill'`), `ExpiryType` (`'after_next_rest_day' | 'after_next_session' | 'after_n_days' | 'after_successful_light_session' | 'manual'`), `BlockStatus` (`'active' | 'completed' | 'archived'`).
- [x] Create `entities/character.ts`: `Character` with `userId`, `characterName`, `className`, `level`, and a `stats` object with the six stats (`strength`, `conditioning`, `control`, `consistency`, `recovery`, `judgment`), all numbers.
- [x] Create `entities/block.ts`: `Block` with `id`, `name`, `baselineTier` (number), `startDate` (ISO string), `status` (`BlockStatus`), `testGuardMinSessions` (number), `completedPlannedKbSessions` (number).
- [x] Create `entities/weekTemplate.ts`: `WeekTemplate` with `id` and a `days` map from weekday to `DayType` (seven entries).
- [x] Create `entities/workoutTemplate.ts`: `WorkoutTemplate` with `id`, `name`, `zoneName`, `category`, `defaultRest`, `tierStep` (string description), `tiers` (a record keyed by tier number string to a tier-definition object), and `movements` (array of movement objects with `name`, and optional `reps`, `rounds`, `duration`, `load`).
- [x] Create `entities/signals.ts`: `Signals` with the four booleans `pressGrindy`, `breathless`, `gripCooked`, `legsSore`, all defaulting to false.
- [x] Create `entities/workoutLog.ts`: `WorkoutLog` with `id`, `date` (ISO string), `blockId`, `plannedDayType` (`DayType`), `actualDayType` (`DayType`), `source` (`WorkoutSource`), `category` (string), `plannedWorkout`, `actualWorkout`, `status`, `difficulty` (`Difficulty`), `signals` (`Signals`), `originalNote`, `structuredNotes` (a record/object). The `signals` field is defined here but will be left at default until Phase 6.
- [x] Create `entities/dailyContext.ts`: `DailyContext` with `date` (ISO string, primary identity), `hoursSlept` (number, nullable), `bodyweight` (number, nullable), `foodNote` (string, nullable).
- [x] Create `entities/statusEffect.ts`: `StatusEffect` with `id`, `name`, `source`, `recommendationEffect`, `expiryType` (`ExpiryType`), `expiryParam` (number, nullable).
- [x] Create `entities/index.ts` re-exporting all entity types and enums.
- [x] Write a trivial Vitest test that imports the entities and constructs one of each with valid values, to confirm the types compile and the package is importable.

## Section D: Engine Config

- [x] Create `packages/engine/src/config.ts` exporting the tunable constants: `TEST_GUARD_MIN_SESSIONS = 6`, `SLEEP_OK_HOURS = 7`, and a `SORENESS_EFFECT_DAYS` object or constants for the after_n_days durations (Breathless Fog 2-3, Squat Tax 2-3, Grip Curse 1-2 — pick concrete defaults, e.g. 3, 3, 2).
- [x] Add a brief comment block noting these are tunable and are the single source of truth for the engine.
- [x] Export config from the engine package index so the app can read the same values.

## Section E: Dexie Schema (persistence)

Define the IndexedDB schema in `app/src/data/db`. These are the stored row shapes. They mirror the entities but are Dexie's concern, not the engine's.

- [x] RED first: write a failing test (fake-indexeddb) asserting the DB opens at version 1 and exposes the seven expected tables with the expected primary keys/indexes. Then build the schema to pass it.
- [x] Install `dexie` in the `app` package.
- [x] Create `data/db/bellboundDb.ts` defining a Dexie subclass with these tables: `characters`, `blocks`, `weekTemplates`, `workoutTemplates`, `workoutLogs`, `dailyContext`, `statusEffects`.
- [x] Define the schema version 1 with appropriate primary keys and indexes: `workoutLogs` keyed by `id` and indexed by `date` and `blockId`; `dailyContext` keyed by `date`; `blocks` keyed by `id`; others keyed by `id` (or `userId` for `characters`).
- [x] Store structured fields (`tiers`, `movements`, `structuredNotes`, `signals`, the character `stats`) as nested objects; Dexie stores objects directly, so no JSON stringification is needed, but keep them typed.
- [x] Define TypeScript row types for each table (these may mirror the entity types but live in the data layer; do not import engine types into the Dexie file to keep the boundary clean — duplicate the shape or use a shared plain type if you prefer, but the engine must not depend on Dexie).
- [x] Export a single `db` instance.
- [x] Confirm the schema test from the first sub-step is green.

## Section F: Repository Mapping Layer

The repository is the ONLY place that knows both Dexie rows and engine entities. It maps between them.

- [x] Create `app/src/data/repositories`.
- [x] Create a repository per aggregate (e.g. `blockRepository.ts`, `workoutTemplateRepository.ts`, `workoutLogRepository.ts`, `characterRepository.ts`, `dailyContextRepository.ts`, `statusEffectRepository.ts`, `weekTemplateRepository.ts`).
- [x] Each repository exposes typed functions returning engine entity types (not Dexie row types) for reads, and accepting engine entity types for writes, performing the mapping inside.
- [x] For each repository function, RED first: write a failing round-trip test (fake-indexeddb) that writes an engine entity, reads it back, and asserts the mapping is correct. Then implement to pass.
- [x] Implement at minimum for Phase 0: `blockRepository.getActiveBlock()`, `workoutTemplateRepository.getById(id)`, `weekTemplateRepository.getDefault()`, `workoutLogRepository.add(log)` and `workoutLogRepository.listRecent(n)`.
- [x] Keep mapping functions pure and small; if a Dexie row and an engine entity are identical in shape, the mapping is a passthrough but should still exist as the named boundary.

## Section G: Seed Data

- [x] RED first: write failing tests (fake-indexeddb) asserting that seeding an empty DB produces the expected character, default week template, active block (tier 1, guard 6, counter 0), and Double KB Strength template with its tiers and movements; and that calling seed again does NOT duplicate or overwrite existing data. Then implement to pass.
- [x] Create `app/src/data/seed.ts` that seeds, on first run only (check if the DB is empty), a default user/character, the default week template (Mon KB, Tue KB, Wed Rest, Thu KB, Fri KB, Sat Free, Sun Rest), an active block at `baselineTier: 1` with `testGuardMinSessions: 6` and `completedPlannedKbSessions: 0`, and the Double KB Strength workout template with its tier definitions (tier 1 = 4 rounds, tier 2 = 5 rounds, tier 3 = 6 rounds) and its five movements (double clean 5, double press 3, double front squat 5, push-ups 8-10, farmer carry 30 sec, all at double 20 kg except push-ups bodyweight).
- [x] Call the seed function once at app startup, guarded so it does not overwrite existing data.
- [x] Verify in browser dev tools (Application tab, IndexedDB) that the seeded records appear after first load.

## Section H: Backup Foundation (manual, minimal)

- [x] RED first: write a failing test (fake-indexeddb) asserting export produces a JSON object containing all seven tables' data, and that import of that JSON into an empty DB restores every record. Then implement both to pass.
- [x] Create `app/src/data/backup/exportData.ts` that reads all tables and serializes them to a single JSON object, then triggers a browser download of a `.json` file. (Separate the pure serialize step from the browser download trigger so the serialize step is unit-testable without a DOM.)
- [x] Create `app/src/data/backup/importData.ts` that accepts a JSON file, validates it minimally, and writes the tables back (replacing or merging — for Phase 0, replace is fine). (Separate the parse/validate/write step from the file-reading step for testability.)
- [x] These do not need UI yet; expose them as functions callable from the console or a temporary button. Full backup UX is a later phase.
- [x] Note in a code comment: backup is mandatory for this app because iOS WebKit can evict IndexedDB after 7 days of inactivity. This foundation is built early on purpose.

## Section I: Phase 0 Done When

- [x] `npm run dev` serves the app; the service worker registers and the shell loads offline.
- [x] `npm test` runs engine tests; entity and config tests pass.
- [x] All Section C through H logic was written test-first (red-green-refactor); every repository, the schema, seed, and backup have passing tests under Vitest/fake-indexeddb. No production logic exists without a prior failing test.
- [x] The engine package has zero dependency on dexie, react, or vite (verify its `package.json`).
- [x] On first load, seed data is written to IndexedDB and visible in dev tools.
- [x] A WorkoutLog can be written via the repository and read back, mapped to an engine entity.
- [x] The active block, default week template, and Double KB Strength template load via their repositories.
- [x] Manual export produces a JSON file; manual import restores it.
- [x] Everything committed to git with a clear Phase 0 commit message.

---

## Notes Carried From The Corrections

- The `signals` field exists in both the entity and the Dexie row from now, defaulting all four flags to false. It is NOT populated until Phase 6. Do not remove it for being unused.
- `completedPlannedKbSessions` exists on the block now but is NOT incremented in Phase 0. Phase 2 owns the increment logic.
- No fatigue field or model. Recovery is expressed through status effects only, built in Phase 7.
- Bodyweight and foodNote are stored but must never be passed into any engine function. Enforce by not wiring them into engine calls.
