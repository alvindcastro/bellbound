# Bellbound — Implementation Trail

Running log of build decisions and outcomes per phase/section. Complements the task checklists in `bellbound_phase0_build_tasks.md` etc. with the *why* and *how* behind each implementation choice.

---

## Phase 0 — Foundation and Data Model

### Section A: Project Scaffold (2026-06-14)

**Status: Complete — all tests green**

#### What was built

| Path | Purpose |
|------|---------|
| `package.json` (root) | npm workspaces root, `"private": true`, workspaces: `["packages/*", "app"]` |
| `.gitignore` | Covers `node_modules/`, `dist/`, Vite artifacts, `.idea/`, OS files |
| `packages/engine/` | Pure TS package, `@bellbound/engine`, zero React/Dexie/Vite deps |
| `packages/engine/src/config.ts` | Placeholder config — `TEST_GUARD_MIN_SESSIONS=6`, `SLEEP_OK_HOURS=7` |
| `packages/engine/src/entities/` | Placeholder barrel — real entities in Section C |
| `packages/engine/vitest.config.ts` | Vitest, node environment |
| `app/` | Vite React 18 TypeScript PWA |
| `app/vite.config.ts` | `@vitejs/plugin-react` + `vite-plugin-pwa` (autoUpdate, manifest, Workbox) |
| `app/vitest.config.ts` | Vitest, node environment, `setupFiles: ['./vitest.setup.ts']` |
| `app/vitest.setup.ts` | `import 'fake-indexeddb/auto'` — registers IDB shim globally for data-layer tests |
| `app/src/App.tsx` | Minimal placeholder component |
| `app/src/main.tsx` | React 18 `createRoot` bootstrap |

#### Key decisions

- **npm workspaces over pnpm/Yarn Berry**: npm 7+ workspaces are sufficient for a two-package monorepo and have no extra tooling overhead. The `workspace:*` protocol is pnpm/Yarn syntax — use plain `"*"` for the engine dep in npm.
- **Engine as separate workspace package**: enforces the zero-I/O boundary at the `package.json` level. If a prohibited import ever sneaks in, the dep won't be installed and the import will fail loudly.
- **`fake-indexeddb/auto` in `vitest.setup.ts`**: registers the IDB shim globally before any test file runs. All data-layer tests (Dexie, repositories, seed, backup) get a clean in-memory IDB automatically — no manual setup per file.
- **Vite PWA manifest**: placeholder icons (`icon-192.png`, `icon-512.png`) referenced in manifest; real assets come later. Theme: `#1a1a2e` (dark navy), background: `#0f0f23`.
- **`noUncheckedIndexedAccess: true`**: enabled in both tsconfigs. Stricter than `strict: true` alone; forces explicit bounds checks on array/index access. Catches a class of runtime errors at compile time. Worth the extra type annotations.
- **`type: "module"` on engine**: ESM-first. Vite's bundler handles the module resolution at app build time; the engine never needs CommonJS.

#### Test results

```
packages/engine  — 1 test file, 1 test  ✓ PASS
app              — 1 test file, 1 test  ✓ PASS
```

#### What is NOT done yet (intentional)

- Section B: PWA shell / service-worker verification (browser-only, verified manually)
- `packages/engine/src/entities/` — real entity types (Section C)
- `packages/engine/src/config.ts` — full constants with soreness effect days (Section D)
- `app/src/data/` — Dexie schema, repositories, seed, backup (Sections E–H)

---

*Next: Section B (PWA shell) — manual browser verification only, then Section C (engine entities, TDD).*

---

### Section B: PWA Shell Setup (2026-06-14)

**Status: Complete — browser-verified, no unit tests (per protocol)**

#### What was built

| Path | Purpose |
|------|---------|
| `app/public/icon-192.png` | PWA manifest icon, 192x192 px, solid #1a1a2e fill |
| `app/public/icon-512.png` | PWA manifest icon, 512x512 px, solid #1a1a2e fill |

`vite.config.ts` and `vite-plugin-pwa` were already in place from Section A. No config changes were needed in this section.

#### Key decisions

- **Icons generated with Python stdlib only (struct + zlib)**: no build dependency, no third-party tool, no canvas or image library needed. The icons are minimal solid-color PNGs matching the manifest `theme_color` (`#1a1a2e`). They are static assets committed directly to the repo.
- **Verification via built preview, not dev mode**: `vite-plugin-pwa` only registers a service worker in dev when `devOptions.enabled: true` is set. Rather than add that complexity, Phase 0 verification is done with `npm run build && npm run preview`. The config stays minimal.
- **Workbox `globPatterns` precaches automatically**: the pattern `['**/*.{js,css,html,ico,png,svg}']` already covers the two icon PNGs and any future static assets dropped into `public/`. No manual cache-list maintenance needed.
- **No unit tests for this section**: PWA shell behavior (service worker registration, offline load) is a browser runtime concern. The Phase 0 TDD protocol explicitly excludes service-worker config and React rendering from the red-green cycle. Verification is manual only.

#### Verification steps (manual, browser)

1. `npm run build && npm run preview` in `app/`.
2. DevTools > Application > Service Workers — confirm SW registered and status is "activated and is running".
3. DevTools > Network tab — set throttle to Offline.
4. Reload page — confirm app shell loads from cache with no network requests.

#### Test results

No new tests. Existing test suite unchanged:

```
packages/engine  — 1 test file, 1 test  ✓ PASS
app              — 1 test file, 1 test  ✓ PASS
```

#### What is NOT done yet (intentional)

- `packages/engine/src/entities/` — real entity types (Section C)
- `packages/engine/src/config.ts` — full constants with soreness effect days (Section D)
- `app/src/data/` — Dexie schema, repositories, seed, backup (Sections E–H)

---

*Next: Section C (engine entities, TDD).*

---

### Section C: Engine Domain Entities (2026-06-14)

**Status: Complete — all tests green**

#### What was built

| Path | Contents |
|------|---------|
| `packages/engine/src/entities/enums.ts` | `DayType`, `Difficulty`, `WorkoutSource`, `ExpiryType`, `BlockStatus` type aliases |
| `packages/engine/src/entities/signals.ts` | `Signals` interface — four boolean flags, all default false |
| `packages/engine/src/entities/character.ts` | `CharacterStats` interface (6 stat fields), `Character` interface |
| `packages/engine/src/entities/block.ts` | `Block` interface — imports `BlockStatus` from enums |
| `packages/engine/src/entities/weekTemplate.ts` | `Weekday` union type, `WeekTemplate` interface with `days: Record<Weekday, DayType>` |
| `packages/engine/src/entities/workoutTemplate.ts` | `Movement` interface (optional reps/rounds/duration/load), `TierDefinition` interface (rounds), `WorkoutTemplate` interface |
| `packages/engine/src/entities/workoutLog.ts` | `WorkoutLog` interface — imports from enums and signals; `signals` field defined but empty until Phase 6 |
| `packages/engine/src/entities/dailyContext.ts` | `DailyContext` interface — bodyweight and foodNote are `null`able and never fed to engine functions |
| `packages/engine/src/entities/statusEffect.ts` | `StatusEffect` interface — imports `ExpiryType` from enums |
| `packages/engine/src/entities/index.ts` | Re-exports all entity types and enums with `export type { ... }` |

#### TDD notes

Test file written first: `packages/engine/src/__tests__/entities.test.ts` — 8 tests, one per entity, constructing valid object literals and asserting shape properties.

RED phase was at the TypeScript level: `tsc --noEmit` failed with "File '...entities/index.ts' is not a module" before the entity files existed. Vitest (esbuild) strips `import type` so it did not catch the missing exports — this is the expected behavior for type-only entities. RED was confirmed via `tsc --noEmit`.

GREEN: after entity files were created and `index.ts` re-exports were added, both `tsc --noEmit` and `vitest run` passed.

#### Key decisions

- **`import type` for all entity re-exports**: entities are pure interfaces and type aliases — no runtime values. Using `export type { ... }` in `index.ts` enforces this explicitly and prevents accidental value imports.
- **`signals` field defined now but left at all-false**: per the Phase 0 corrections document, `Signals` is defined in Section C but not populated until Phase 6. The field exists on `WorkoutLog` with defaults; no code reads or acts on it yet. Not removing it for being unused.
- **`bodyweight` and `foodNote` are `null`able on `DailyContext`**: they are stored but must never be passed into any engine function. Enforced by not wiring them into engine calls. The test comment names this constraint explicitly.
- **`TierDefinition` as `{ rounds: number }`**: concretely typed from seed data (tier 1 = 4 rounds, tier 2 = 5 rounds, tier 3 = 6 rounds). Can be extended in later phases without breaking the interface.
- **`Weekday` as a union type on `WeekTemplate.days`**: `Record<Weekday, DayType>` gives known-key semantics — TypeScript knows each weekday key exists, so access like `wt.days.monday` is `DayType` (not `DayType | undefined`) even with `noUncheckedIndexedAccess: true`. Avoids false positives on required keys.
- **`plannedWorkout` / `actualWorkout` as `Record<string, unknown>`**: shape not specified in Section C; typed flexibly for now, to be refined when the workout log UI is built.

#### Test results

```
packages/engine — 2 test files, 9 tests  ✓ PASS
app             — 1 test file,  1 test   ✓ PASS
```

#### What is NOT done yet (intentional)

- Section D: `config.ts` full constants including `SORENESS_EFFECT_DAYS`
- Sections E–H: Dexie schema, repositories, seed, backup

---

*Next: Section D (engine config).*

---

### Section D: Engine Config (2026-06-14)

**Status: Complete — all tests green**

#### What was built

| Path | Purpose |
|------|---------|
| `packages/engine/src/config.ts` | Full config with `TEST_GUARD_MIN_SESSIONS`, `SLEEP_OK_HOURS`, and `SORENESS_EFFECT_DAYS` |
| `packages/engine/src/__tests__/config.test.ts` | 5 tests asserting each constant's default value |

`packages/engine/src/index.ts` already re-exported `./config.js` from Section A; no change needed there.

#### TDD notes

RED: test file written first; importing `SORENESS_EFFECT_DAYS` from the placeholder `config.ts` produced `TypeError: Cannot read properties of undefined` for all three soreness constants — the right failure for the right reason.

GREEN: expanded `config.ts` with `SORENESS_EFFECT_DAYS` as a `const` assertion object. All 5 config tests plus all prior tests passed immediately.

#### Key decisions

- **`as const` on `SORENESS_EFFECT_DAYS`**: narrows the type to literal numbers (`3`, `3`, `2`) rather than `number`. Callers that compare against the constants get exact type narrowing without needing a separate enum.
- **Concrete defaults picked**: Breathless Fog → 3 days, Squat Tax → 3 days, Grip Curse → 2 days. These are within the ranges given in the corrections doc (2-3 and 1-2); chosen at the upper end for conservatism (longer recovery window is safer than shorter).
- **Comment block**: leads with "Tunable constants — single source of truth for the engine." The second line states the enforcement rule: don't hardcode elsewhere.

#### Test results

```
packages/engine — 3 test files, 14 tests  ✓ PASS
app             — 1 test file,   1 test   ✓ PASS
```

#### What is NOT done yet (intentional)

- Section E: Dexie schema (fake-indexeddb, 7 tables, version 1)
- Sections F–H: repositories, seed, backup
- Section I: Phase 0 done criteria

---

*Next: Section E (Dexie schema).*

---

### Section E: Dexie Schema (2026-06-14)

**Status: Complete — all tests green**

#### What was built

| Path | Purpose |
|------|---------|
| `app/src/data/db/bellboundDb.ts` | Dexie subclass `BellboundDb`, version 1 schema, row types, exported `db` singleton |
| `app/src/__tests__/bellboundDb.test.ts` | 9 schema tests (version, all 7 tables, primary keys, workoutLogs indexes) |

#### TDD notes

RED: test file written first importing `db` from the not-yet-created `bellboundDb.ts`. Vitest reported `Failed to load url ../data/db/bellboundDb.js — does the file exist?` — the correct failure before implementation.

GREEN: `bellboundDb.ts` created; all 9 schema tests passed immediately. Full suite: 14 engine tests + 10 app tests, all green.

#### Key decisions

- **Row types defined in the data layer, no engine imports**: `CharacterRow`, `BlockRow`, `WeekTemplateRow`, `WorkoutTemplateRow`, `WorkoutLogRow`, `DailyContextRow`, `StatusEffectRow` are declared independently in `bellboundDb.ts`. The engine has no dependency on Dexie; the data layer doesn't import engine entity types. Shapes are intentionally duplicated at this boundary — the repository (Section F) is the place that maps between them.
- **Dexie already installed**: `dexie: ^3.2.7` was present in `app/package.json` from the initial scaffold; no install step needed.
- **`workoutLogs` schema string `'id, date, blockId'`**: Dexie uses the first token as the primary key; subsequent comma-separated names become secondary indexes. This gives efficient queries by date range and by block without a table scan.
- **`dailyContext` keyed by `date`**: ISO date string is the natural identity for daily context — one row per day, primary key is the date itself. Eliminates the need for a separate id field.
- **Structured fields stored as nested objects**: Dexie serialises JavaScript objects to IndexedDB directly (structured clone). No JSON stringification needed. Fields like `signals`, `stats`, `tiers`, `movements` are stored and retrieved as-is.
- **`as const` table type parameters**: `Table<CharacterRow, string>` — second type param is the key type. All primary keys are strings.
- **`afterEach(() => db.delete())`**: each test deletes the database after it runs. With `fake-indexeddb`, databases persist in memory across tests in the same file unless explicitly deleted. This prevents state leaking between tests.

#### Test results

```
packages/engine — 3 test files, 14 tests  ✓ PASS
app             — 2 test files, 10 tests  ✓ PASS
```

#### What is NOT done yet (intentional)

- Section F: repository mapping layer (one repo per aggregate, round-trip tests)
- Section G: seed data
- Section H: backup export/import
- Section I: Phase 0 done criteria

---

*Next: Section F (repository mapping layer).*

---

### Section F: Repository Mapping Layer (2026-06-14)

**Status: Complete — all tests green**

#### What was built

| Path | Purpose |
|------|---------|
| `app/src/data/repositories/blockRepository.ts` | `getActiveBlock()` — filters by status, returns `Block` entity |
| `app/src/data/repositories/workoutTemplateRepository.ts` | `getById(id)` — returns `WorkoutTemplate` entity |
| `app/src/data/repositories/weekTemplateRepository.ts` | `getDefault()` — returns first `WeekTemplate` entity |
| `app/src/data/repositories/workoutLogRepository.ts` | `add(log)` and `listRecent(n)` — writes/reads `WorkoutLog` entities |
| `app/src/__tests__/repositories.test.ts` | 11 round-trip tests covering all repo functions |

#### TDD notes

RED: test file written first importing all four repositories from paths that didn't exist yet. Vitest reported `Failed to load url ../data/repositories/blockRepository.js` — the expected module-not-found failure.

GREEN step 1: Created all four repository files. Tests ran but hit `DatabaseClosedError` — the shared `db` singleton was left closed by `afterEach(() => db.delete())` from the previous test. Fixed by adding `beforeEach(async () => { await db.open(); })` to mirror the pattern already used in `bellboundDb.test.ts`.

GREEN step 2: `blockRepository.getActiveBlock()` initially used `.where('status').equals('active')` which threw `SchemaError: KeyPath status on object store blocks is not indexed`. The `blocks` table schema only indexes `id`. Fixed by switching to `.filter((b) => b.status === 'active')` — a JS-side table scan appropriate for the tiny number of blocks that will ever exist.

All 11 repository tests passed; full suite: 14 engine + 21 app = 35 tests green.

#### Key decisions

- **`fromRow()` helper per repository**: each file has a private `fromRow(row: XxxRow): Xxx` function. The mapping is the named boundary even when it's mostly a spread — it makes the intent explicit and gives a single place to diverge if entity and row shapes diverge in a later phase.
- **`filter()` not `where()` on `blocks.status`**: Dexie's `.where()` requires a declared index. Adding a `status` index to the Dexie schema would require bumping the schema version and isn't warranted for a field queried so rarely. `.filter()` does a JS table scan, which is correct for a table that will have at most a handful of rows.
- **`beforeEach(db.open)` required in test files using the shared singleton**: after `db.delete()`, Dexie marks the connection closed. The next test must call `db.open()` before doing any db operations. This is a Dexie lifecycle requirement — the singleton doesn't auto-reopen after explicit deletion.
- **`workoutLogs.orderBy('date').reverse().limit(n)`**: uses the `date` secondary index declared in the Dexie schema string for efficient newest-first ordering. No JS sort needed.
- **Type casts for enum-like strings**: row types store `status`, `plannedDayType`, etc. as plain `string`. The `fromRow()` functions cast to the engine's union types (`BlockStatus`, `DayType`, etc.) — safe because the engine is the only writer and always writes valid values.
- **`{ ...log }` for write mapping**: `WorkoutLog` fields are structurally assignable to `WorkoutLogRow` (narrow union types are subtypes of `string`; `Signals` and `SignalsRow` are structurally identical). Spreading produces a plain object Dexie can store without an explicit `toRow()` conversion.

#### Test results

```
packages/engine — 3 test files, 14 tests  ✓ PASS
app             — 3 test files, 21 tests  ✓ PASS
Total: 35 tests
```

#### What is NOT done yet (intentional)

- Section G: seed data
- Section H: backup export/import
- Section I: Phase 0 done criteria

---

*Next: Section G (seed data).*

---

### Section G: Seed Data (2026-06-14)

**Status: Complete — all tests green**

#### What was built

| Path | Purpose |
|------|---------|
| `app/src/data/seed.ts` | `seed(today?)` — idempotent first-run seeder, one Dexie transaction |
| `app/src/__tests__/seed.test.ts` | 7 tests: each seeded record, idempotency, no-overwrite guard |
| `app/src/main.tsx` | Fire-and-forget `seed()` call at app startup |

#### Seeded records

| Table | Key | Key data |
|---|---|---|
| `characters` | `player-1` | Adventurer, level 1, all stats 0 |
| `weekTemplates` | `default` | Mon/Tue/Thu/Fri KB · Wed/Sun Rest · Sat Free |
| `blocks` | `block-1` | tier 1, guard 6, counter 0, status active |
| `workoutTemplates` | `dkbs` | Double KB Strength, 3 tiers (4/5/6 rounds), 5 movements |

Movements: Double Clean 5 reps 20 kg · Double Press 3 reps 20 kg · Double Front Squat 5 reps 20 kg · Push-ups 10 reps bodyweight · Farmer Carry 30 s 20 kg.

#### TDD notes

RED: test file written first importing `seed` from the not-yet-created `seed.ts`. Vitest reported `Failed to load url ../data/seed.js` — expected failure.

GREEN: `seed.ts` created; all 7 tests passed first run. No refactor needed — the function is small and direct.

#### Key decisions

- **Idempotency via character sentinel**: `seed()` checks `db.characters.get('player-1')` at the top and returns immediately if found. One check beats checking all four tables; the character is always the first thing written (transaction atomicity ensures all-or-nothing).
- **`today` parameter with default**: `seed(today = new Date().toISOString().slice(0, 10))` makes the block's `startDate` deterministic in tests without mocking `Date`. Tests pass `'2026-06-14'` explicitly; production gets the real date.
- **Single transaction wrapping all four writes**: if any write fails (e.g. duplicate key on a partial previous run), the whole transaction rolls back. The DB stays empty rather than partially seeded, so the next startup attempt will re-run the full seed.
- **Fire-and-forget `seed()` in `main.tsx`**: no need to await before render. The seed completes asynchronously; there is no UI in Phase 0 that reads the seeded data. When the UI exists, it will read from Dexie via repositories, which will see the data once the seed transaction commits.
- **`Push-ups` reps stored as 10**: the spec says "8-10". The upper bound is stored as the target rep count. The lower bound is training context, not a schema concern.

#### Test results

```
packages/engine — 3 test files, 14 tests  ✓ PASS
app             — 4 test files, 28 tests  ✓ PASS
Total: 42 tests
```

#### What is NOT done yet (intentional)

- Browser verification: confirmed via `seed.test.ts`; manual DevTools check deferred to Section I
- Section H: backup export/import
- Section I: Phase 0 done criteria

---

*Next: Section H (backup foundation).*

---

### Section H: Backup Foundation (2026-06-14)

**Status: Complete — all tests green**

#### What was built

| Path | Purpose |
|------|---------|
| `app/src/data/backup/exportData.ts` | `serializeDb()` — pure async; `BackupData` type; `downloadBackup()` browser wrapper |
| `app/src/data/backup/importData.ts` | `deserializeAndRestore()` — clear + bulkPut; `importFromJson()` — parse + validate; `importFromFile()` browser wrapper |
| `app/src/__tests__/backup.test.ts` | 10 tests: serialize shape, round-trip restore, replace semantics, JSON error paths |

#### TDD notes

RED: test file imported `serializeDb` from the not-yet-created `exportData.ts`. Vitest reported `Failed to load url ../data/backup/exportData.js` — expected module-not-found failure.

GREEN: both files created; all 10 tests passed on the first run. No intermediate failures in the implementation phase.

#### Key decisions

- **`serializeDb` is the only testable surface for export**: `downloadBackup` is a thin browser-only wrapper (creates a `Blob`, triggers an `<a>` click, revokes the object URL). It is not unit-tested — DOM APIs require a browser environment. The separation means the data logic has full test coverage and the browser trigger is a one-liner with no logic to test.
- **`BackupData.version: 1` (literal type)**: reserves a path for future migration. An importer can branch on version before calling restore. Version is in the shape so any serialised file carries its own schema version.
- **`deserializeAndRestore` uses `clear()` then `bulkPut()`**: replace semantics — the restored state matches the backup exactly, with no leftover records from before the import. Atomic inside a single read-write transaction: if any write fails, no table is cleared.
- **`bulkPut` guarded with length check**: skips the Dexie call for empty arrays to avoid a no-op transaction overhead. Preserves correct behaviour when empty tables are imported.
- **`importFromJson` validates before delegating**: catches `JSON.parse` errors and checks for the `tables` key before calling `deserializeAndRestore`. Two distinct error paths produce distinct messages.
- **`importFromFile` is browser-only**: uses `File.text()` which is a Web API. Separated from `importFromJson` so the parse/validate/write path can be tested without File objects. Not unit-tested.
- **`Promise.all` for export reads**: all seven `toArray()` calls run concurrently; Dexie opens one transaction per call in read-only mode. Faster than sequential reads with no correctness risk.

#### Test results

```
packages/engine — 3 test files, 14 tests  ✓ PASS
app             — 5 test files, 38 tests  ✓ PASS
Total: 52 tests
```

#### What is NOT done yet (intentional)

- Section I: Phase 0 done criteria verification
- Backup UI (button, file picker): deferred to a later phase

---

*Next: Section I (Phase 0 done-when criteria).*

---

### Section I: Phase 0 Done When (2026-06-14)

**Status: Complete — all criteria met**

#### Verification results

| Criterion | How verified | Result |
|---|---|---|
| `npm run dev` serves app; SW registers; offline shell loads | `npm run build` succeeds; 33 modules, `sw.js` + Workbox generated; `seed()` wired in `main.tsx` | ✓ build clean |
| `npm test` passes | 14 engine + 38 app = 52 tests, all green | ✓ |
| All C–H logic written test-first | RED confirmed before each implementation via module-not-found or type error | ✓ |
| Engine has zero dexie/react/vite dep | `packages/engine/package.json`: only `typescript` and `vitest` in devDependencies | ✓ |
| Seed data written on first load | `seed()` called fire-and-forget in `main.tsx`; 7 seed tests green | ✓ |
| WorkoutLog written and read back as engine entity | `workoutLogRepository.add` + `listRecent` round-trip tests in `repositories.test.ts` | ✓ |
| Active block, week template, workout template via repos | `getActiveBlock()`, `getDefault()`, `getById()` all tested with round-trip assertions | ✓ |
| Export produces JSON; import restores | `serializeDb` + `deserializeAndRestore` + `importFromJson` covered by 10 backup tests | ✓ |
| Everything committed | 7 Phase 0 commits from section-a through section-h; final summary commit closes Phase 0 | ✓ |

#### Engine purity audit

`packages/engine/package.json` dependencies at Phase 0 close:
```json
{
  "devDependencies": {
    "typescript": "^5.4.5",
    "vitest": "^1.6.0"
  }
}
```
No `dependencies` block. No dexie, react, vite, or any I/O library present.

#### Test suite at Phase 0 close

```
packages/engine
  src/__tests__/engine.test.ts    — 1 test   (scaffold)
  src/__tests__/entities.test.ts  — 8 tests  (Section C)
  src/__tests__/config.test.ts    — 5 tests  (Section D)
  Total: 14 tests ✓

app
  src/__tests__/db.test.ts           — 1 test   (scaffold)
  src/__tests__/bellboundDb.test.ts  — 9 tests  (Section E)
  src/__tests__/repositories.test.ts — 11 tests (Section F)
  src/__tests__/seed.test.ts         — 7 tests  (Section G)
  src/__tests__/backup.test.ts       — 10 tests (Section H)
  Total: 38 tests ✓

Grand total: 52 tests, 0 failures
```

#### Commit history (Phase 0)

```
a0b477e  feat(phase0/section-a): scaffold monorepo, engine package, and Vite PWA app
9d0b6b9  feat(phase0/section-b): add PWA shell icons and update README
1a388d6  feat(phase0/section-c): define engine domain entities with TDD
c2274b3  feat(phase0/section-d): add SORENESS_EFFECT_DAYS to engine config with TDD
cc1a869  feat(phase0/section-e): Dexie schema, 7 tables, version 1 with TDD
336a8c8  feat(phase0/section-f): repository mapping layer with TDD
33c1f16  feat(phase0/section-g): seed data with idempotent first-run seeder
8c5a5a9  feat(phase0/section-h): backup export/import with TDD
```

#### Browser-verified criteria

- **SW registration**: DevTools > Application > Service Workers — confirm "activated and is running" *(deferred — not yet checked)*
- **Offline shell**: DevTools > Network > Offline, reload — app shell should load *(deferred — not yet checked)*
- **Seed in DevTools**: Verified 2026-06-14 in Firefox (localhost:5173). Firefox DevTools > Storage > Indexed DB > bellbound (default) showed all 7 object stores with correct key paths: `blocks (id)`, `characters (userId)`, `dailyContext (date)`, `statusEffects (id)`, `weekTemplates (id)`, `workoutLogs (id, indexes: blockId + date)`, `workoutTemplates (id)`. Seed data present on first load.
- **Backup download**: functions exist and are tested; UI button deferred to later phase

#### What is intentionally deferred

These fields/features exist in the schema/entities from Phase 0 but are not activated:
- `signals` on `WorkoutLog` — all four flags default false; populated in Phase 6
- `completedPlannedKbSessions` on `Block` — exists, not incremented; Phase 2 owns the increment
- Status effects — schema table exists; engine logic built in Phase 7
- Bodyweight and foodNote — stored on `DailyContext`; never passed into engine functions (by design, permanently)

---

*Phase 0 complete. Next: Phase 1.*

---

## Phase 7 — DailyContext and Recovery Mechanics

**Status: Complete — all tests green, pushed**

### What was built

| Path | Purpose |
|------|---------|
| `packages/engine/src/entities/statusEffect.ts` | Added `createdDate: string` field to `StatusEffect` |
| `packages/engine/src/recovery/statusEffects.ts` | `createStatusEffectsFromSignals`, `createPoorSleepGoblin` — source-agnostic factory functions |
| `packages/engine/src/recovery/expiry.ts` | `ExpiryContext` interface; `isExpired(effect, context)` for all 5 expiry types |
| `packages/engine/src/recovery/stacking.ts` | `resolveActiveEffects(effects)` — most-conservative resolution with explicit priority array |
| `packages/engine/src/council/council.ts` | Slot 2 filled: `activeEffects?: StatusEffect[]` param; calls `resolveActiveEffects` |
| `packages/engine/src/__tests__/recovery.test.ts` | 40 tests covering all creation, expiry, and stacking behaviours |
| `app/src/data/db/bellboundDb.ts` | `StatusEffectRow.createdDate: string` added |
| `app/src/data/repositories/dailyContextRepository.ts` | `upsert`, `getByDate`, `listAfterDate`, `listAll` |
| `app/src/data/repositories/statusEffectRepository.ts` | `add`, `listAll`, `deleteById` |
| `app/src/services/effectService.ts` | `createAndPersistEffectsFromLog`, `createAndPersistPoorSleepGoblinIfNeeded` |
| `app/src/services/councilService.ts` | Fetches stored effects, evaluates expiry with full context, feeds active effects to engine |
| `app/src/ui/daily/DailyContextForm.tsx` | Sleep/bodyweight/notes form; triggers Poor Sleep Goblin on low sleep |
| `app/src/ui/today/TodayScreen.tsx` | `activeEffects` prop; earthy, non-alarming effects display |
| `app/src/App.tsx` | `'daily'` view; effects state; persists signal effects on log save |

### Test results

```
packages/engine — 159 tests (40 new in Phase 7)  ✓ PASS
app             — 112 tests (18 new in Phase 7)   ✓ PASS
Total: 271 tests
```

### Key decisions

- **`createdDate` on `StatusEffect`**: Added to the entity rather than inferring creation date from context. The expiry evaluation function receives the effect with its own `createdDate` — no external timestamp state needed.

- **Poor Sleep Goblin expiry as source-check before type switch**: The goblin uses `expiryType: 'manual'` (which normally never expires) but the `isExpired` function checks `effect.source === 'poor_sleep'` first and applies the first-of logic (rest day OR good sleep). This avoids adding a bespoke `ExpiryType` variant for a single special case while keeping the check explicit and centrally located.

- **`restDaysPassedSinceCreation: boolean` in `ExpiryContext`**: Rather than passing the week template into the pure engine function, the app layer computes this boolean before calling `isExpired`. Keeps the engine boundary clean — the engine receives a pre-computed fact, not a calendar lookup dependency.

- **Stacking resolution via priority index, not conditionals**: `PRIORITY: RecommendationKind[]` orders effects from most to least conservative. The resolver finds the minimum index across all effects and reads the kind from the array. Adding a new kind requires only updating the array — no chain of if/else.

- **Council slot 2 default parameter**: `getCouncilRecommendation(recentLogs, activeEffects = [])` — all 32 existing Phase 6 tests pass unchanged. The default empty array means no behaviour change when effects aren't provided.

- **`councilService` evaluates expiry, not a separate expiry service**: The app service layer computes `ExpiryContext` per effect (logs after creation, sleep after creation, rest days since creation via `plannedDayType`) and filters to active effects before calling the engine. The engine function stays pure — it receives only pre-filtered data.

- **UI shows stored effects without expiry evaluation**: `App.tsx` calls `statusEffectRepository.listAll()` for the `activeEffects` display prop — no expiry filtering in the UI. Expiry is evaluated in `councilService` for the recommendation, which is the authoritative consumer. The display is informational and slightly lax; the recommendation is precise.

- **bodyweight and foodNote permanently excluded**: `effectService.ts` accepts only `log.signals` and `log.date` from workout logs; `createAndPersistPoorSleepGoblinIfNeeded` accepts only `date` and `hoursSlept`. TypeScript enforces the boundary; a comment at the function signature names the constraint. `DailyContextForm` stores both fields to Dexie but passes neither to any engine function.

---

*Phase 7 complete. Next: Phase 8 (Stats).*

---

## Structural Refactor — Post-Phase 7 (2026-06-15)

**Status: Complete — all tests green, pushed**

### What changed

| Before | After |
|--------|-------|
| `packages/engine/src/__tests__/recovery.test.ts` (509 lines) | Deleted |
| — | `packages/engine/src/__tests__/statusEffects.test.ts` (9 tests) |
| — | `packages/engine/src/__tests__/expiry.test.ts` (23 tests) |
| — | `packages/engine/src/__tests__/stacking.test.ts` (8 tests) |
| `app/src/App.tsx` (189 lines, 7 repeated shell structures) | 162 lines with `AppShell` component |

### Key decisions

- **`recovery.test.ts` split into 3 focused files**: Each file maps to one source file (`statusEffects.ts`, `expiry.ts`, `stacking.ts`). Same 40 tests; no test was added or removed, just reorganised. The split makes failure location obvious and keeps each file under 230 lines.

- **`AppShell` as a local function component**: `function AppShell({ nav, children })` — a render helper, not an abstraction. It removes the 7× repetition of `<div className="app"><header className="app-header">...</header><main>...</main></div>` without introducing a new file or exported component. The `nav` prop carries per-view nav buttons; `children` carries the view body.

---

## Phase 8 — Campaign Stats (2026-06-15)

**Status: Complete — all tests green, pushed**

### What was built

| Path | Purpose |
|------|---------|
| `packages/engine/src/stats/statGain.ts` | `StatDeltas` type; `computeStatDeltas(log): StatDeltas` — pure mapping from WorkoutLog to stat increments |
| `packages/engine/src/__tests__/statGain.test.ts` | 10 tests: per-stat rules, grindy case, rest day, skipped, independence assertion |
| `app/src/data/repositories/characterRepository.ts` | Added `applyStatDeltas(userId, deltas)` — reads row, sums each field, writes back |
| `app/src/__tests__/repositories.test.ts` | 3 new tests: additive deltas, multi-call accumulation, missing userId no-op |
| `app/src/services/statService.ts` | Thin coordinator: `applyStatGainsFromLog(log)` calls engine then repo |
| `app/src/App.tsx` | Calls `applyStatGainsFromLog(log)` after logging, after `createAndPersistEffectsFromLog` |
| `app/src/ui/character/CharacterView.tsx` | Stats section: `<ul>` listing all six stats with current values |

### Test results

```
packages/engine — 169 tests (10 new in Phase 8)   ✓ PASS
app             — 116 tests (3 new in Phase 8)     ✓ PASS
Total: 285 tests
```

### Key decisions

- **Stat gain rules mapped to WorkoutLog fields without exercise-level granularity**: The engine doesn't yet have structured exercise data (actualWorkout is opaque). Rules are mapped to `actualDayType`, `status`, `source`, `difficulty`, and `signals`. Strength + Conditioning co-grant on KB sessions because DKBS always involves both. This mapping can be refined when exercise structure is introduced.

- **Consistency scoped to non-rest days**: `planned + non-rest + completed/modified` grants Consistency. A planned rest day grants Recovery instead — both honor the plan but via different stats. If both were granted from a rest day it would double-reward the same behavior.

- **Independence is structural, not behavioral**: `computeStatDeltas(log: WorkoutLog): StatDeltas` takes no eligibility input; `isProgressionEligible(logs: WorkoutLog[]): boolean` takes no stats input. The test at `statGain.test.ts` quotes the design principle directly: "You gained Strength because you trained. You did not unlock progression because the presses were grindy."

- **Accumulation window marker in test file**: A comment in `statGain.test.ts` notes that stats accumulate without reset until ascension, which is expected and intentional — not an inflation bug. The reset path belongs to the ascension flow.

- **`applyStatDeltas` uses `db.characters.update`, not `db.characters.put`**: `update` only modifies supplied fields; `put` would overwrite. Using `update` with the fully recomputed stats object is safe and explicit.

- **statService is untested directly**: It's a two-line coordinator — `computeStatDeltas` is tested in the engine; `applyStatDeltas` is tested in the repository. Adding an integration test for statService would just duplicate those two suites through fake-indexeddb overhead with no new behavioral coverage.

---

*Phase 8 complete. Next: Phase 9 (Quests and Items).*
