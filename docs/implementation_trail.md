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
