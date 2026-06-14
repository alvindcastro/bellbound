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
