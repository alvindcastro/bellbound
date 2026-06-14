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
