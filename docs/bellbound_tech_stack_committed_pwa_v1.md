# Bellbound Tech Stack: Offline-Capable PWA (Committed Plan)

This is the committed stack for Bellbound. There is no native iOS or Android build for now. Bellbound is an offline-capable Progressive Web App, opened in the browser and installed to the home screen.

This decision supersedes the Flutter native plan (bellbound_tech_stack_decision_v1.md) and its build-plan addendum. Those documents are retained for reference and remain valid if a durable native version is ever wanted later, but they are not the current direction.

The one constraint that survives dropping the native build: a home-screen PWA on iOS still runs in WebKit. Opening Bellbound on an iPhone is still Safari underneath, so the 7-day offline-storage eviction risk described below still applies. "No native build" does not escape WebKit. Backup export is therefore mandatory, not optional.

---

# Why This Is the Plan

The decision was made on these grounds:

- Use the existing TypeScript skillset directly, no new language.
- Zero install friction and instant updates. No App Store, no Mac, no $99/year, no provisioning profiles.
- The offline-storage eviction risk on iOS is accepted and managed with a mandatory backup strategy.
- Learning curve is lowest; this is web development with PWA additions.

The tradeoff being accepted: offline persistence on iOS is at-risk across multi-week usage gaps (vacation, injury, deload), because iOS evicts PWA storage after 7 days of no interaction. This is mitigated, not eliminated, by home-screen install plus a persistent-storage request plus periodic backup export. The backup discipline is what makes this acceptable. If reliable multi-week offline persistence were non-negotiable, the Flutter native plan would be the choice instead; it is not the current direction.

---

# The iOS Offline-Storage Reality (2026)

This is the single most important fact for this plan.

- iOS Safari proactively evicts an origin's data if there is no user interaction in the last 7 days. When it evicts, it deletes all of the origin's data at once, not parts of it.
- Adding the PWA to the home screen reduces the likelihood of eviction and is required for any serious offline use, but it does not fully eliminate the risk on WebKit.
- The Persistent Storage API (navigator.storage.persist()) requests exemption from eviction. On iOS this is a request, not a guarantee.
- Capacity is not the problem. IndexedDB allows up to roughly 500MB on iOS, far more than a text-based training log needs.
- All iOS browsers use WebKit, so this applies regardless of which browser the user prefers. There is no Chrome-on-iOS escape hatch.

Conclusion: a PWA for a once-or-twice-daily log is usually fine if installed to the home screen and opened regularly, because each open resets the 7-day clock. The real exposure is multi-week inactivity. The defense is the same backup discipline the native plan uses: periodic export to durable storage so an eviction is recoverable, not catastrophic.

---

# Variant Decision: Offline-Capable PWA

A connected-only web app (local storage as a cache, server as source of truth) was considered and rejected because it fails at the gym with no signal, which contradicts the offline requirement.

The committed variant: local IndexedDB is the source of truth. A service worker caches the app shell so it loads offline. The app works with no connection. An optional backend exists only for backup and the AI calls. Everything below specifies this variant.

---

# Stack: Offline-Capable PWA

| Concern | Choice | Notes |
|---|---|---|
| Language | TypeScript | Existing skill, type-safe |
| Framework | React or Svelte | React if familiarity matters; Svelte if you want less ceremony for a small app |
| Build / PWA tooling | Vite plus vite-plugin-pwa (Workbox under the hood) | Service worker, manifest, offline shell |
| Local DB | IndexedDB via Dexie.js | Dexie is the most ergonomic typed wrapper over IndexedDB. Source of truth. |
| Rules engine | Pure TypeScript module | No DOM, no framework imports. Unit-tested with Vitest. Mirrors the pure-Dart engine boundary. |
| State management | React `useState` / `useEffect` | No TanStack Query or Zustand introduced; component-local state and `useEffect` proved sufficient |
| AI layer | TypeScript interface, online fetch impl plus offline no-op | Built in Phase 13. No-op default from Phase 0; real proxy client added at Phase 13. Key lives only in Go backend. |
| Backup | Periodic export of an IndexedDB dump to a file or a backend endpoint | Critical given iOS eviction risk. Not a sync engine. |
| Hosting | Static host (the app is static assets) plus an optional small Go backend for backup and AI proxy | Go proxy on Fly.io built at Phase 13. |
| Config | One TS constants file | TEST_GUARD_MIN_SESSIONS, SLEEP_OK_HOURS, soreness durations |

## Why Dexie over raw IndexedDB

Raw IndexedDB is verbose and callback-heavy. Dexie gives typed tables, a clean query API, and schema versioning with migrations, which is the closest web equivalent to what drift provides on the Flutter side. For a typed-storage preference it is the right tool.

## Why the engine is a separate pure module

Same reasoning as the Flutter plan. The rules engine (Council, progression, status stacking, tier logic) is a framework-free TypeScript module that takes plain objects in and returns recommendations out. It unit-tests with Vitest at full speed, no browser, no IndexedDB. The data layer maps Dexie records to engine entities and back.

---

# Architecture: Mono-Repo, Two Packages

```
bellbound-web/
  packages/
    engine/                  # pure TypeScript, no DOM, no framework
      src/
        entities/            # plain TS types/classes
        council/
        progression/
        recovery/            # status effects, expiry, stacking
        stats/
        activities/
        ascension/
        challenges/
        flavour/
        config.ts            # tunable parameters
      package.json
  app/                       # the PWA
    src/
      data/
        db/                  # Dexie schema (versioned migrations)
        repositories/        # map Dexie records <-> engine entities
        ai/                  # AI interface + proxy impl + offline no-op
        backup/              # export/import IndexedDB dump
      services/              # app-layer logic (todayService, loreService, etc.)
      ui/
        today/
        log/
        review/
        character/
        ascension/
        quests/
        history/
        daily/
      main.tsx
    package.json
    vite.config.ts
  server/                    # Go proxy (Phase 13): Anthropic key server-side only
    handler/
      proxy.go
      proxy_test.go
    main.go
    Dockerfile
    fly.toml
```

The boundary rule: `engine` never imports Dexie, React, or anything with I/O. The repository layer is the only place that knows both Dexie records and engine entities.

---

# PWA-Specific Requirements

These have no equivalent in the native plan and are the extra work a web app adds.

## Service Worker (offline shell)

- Use vite-plugin-pwa with a Workbox strategy. Precache the app shell (HTML, JS, CSS) so the app loads with no connection.
- The data is in IndexedDB, not the service worker cache, so logging works offline independently of the shell cache.
- Handle service worker update flow: prompt or auto-update when a new version is deployed.

## Web App Manifest

- name, short_name, icons, display: standalone, theme/background color.
- Required for home-screen install, which is itself required to reduce iOS eviction.

## iOS Install Guidance

- iOS does not prompt to install. The user must use Safari's Share menu, Add to Home Screen, manually.
- Build an in-app hint explaining this, shown once on iOS Safari. Without it, the app is just a browser tab and the eviction risk is highest.

## Persistent Storage Request

- Call navigator.storage.persist() on first run. On iOS it is a request, not a guarantee, but it improves persistence odds. Log the result.

## Backup Strategy (mandatory here)

- Because iOS can evict the source of truth, backup is not optional in the web plan the way it is a nice-to-have in the native plan.
- Provide a manual export (download a JSON dump of all IndexedDB tables) and, if a backend exists, an automatic periodic push.
- Provide import to restore after an eviction or device change.
- Surface a gentle reminder if the last backup is old.

---

# Phase Mapping (Same Plan, Web Implementation)

The feature build plan and its corrections apply unchanged. Only the implementation per phase differs.

| Phase | Web implementation |
|---|---|
| 0 | Dexie schema for the v4 entities; pure-TS engine entity types; repository mapping; config.ts. Set up Vite plus vite-plugin-pwa, manifest, service worker shell. |
| 1 | Today screen (React/Svelte) reads current block tier and template, renders the workout table; log form writes to Dexie. Engine not called. Verify offline load via the service worker. |
| 2 | Repository computes planned vs actual; increments completedPlannedKbSessions in the Block record. |
| 3 | Tier resolution as a pure engine function used to render today's workout. |
| 4 | Weekly review screen querying the last 7 days from Dexie. Factual only. |
| 5 | Zones, encounter text, completion messages as static TS data. Low-fi theme. |
| 6 | Populate signal flags via manual toggles; build progression and Council priority order in the engine, tested with Vitest. Introduce Zustand if state now spans screens. |
| 7 | DailyContext as its own Dexie table; status package with expiry-type and most-conservative stacking. Poor Sleep Goblin clears on rest day or a night at/above SLEEP_OK_HOURS, whichever first. Status triggers are source-agnostic. |
| 8 | Stat gain functions in the engine; persist to the Character record. Stats accumulate with no reset until Phase 11. |
| 9 | Quests, items, titles as Dexie tables or fields on Character. Cosmetic only. |
| 10 | Replace "feeds fatigue" with "can trigger status effects." Activity source selection with per-type default and override. Off-block logs feed the Phase 7 engine. |
| 11 | Ascension guard reads completedPlannedKbSessions vs TEST_GUARD_MIN_SESSIONS. Successful test closes block, banks lesson, resets stats and counter, opens next block at tier N+1. |
| 12 | Challenge path as a modifier field on the new block. |
| 13 | AI interface gets its real fetch implementation behind an online check. Offline no-op exists from Phase 0. App fully functional with AI disabled, verified. |

---

# Config Constants (config.ts)

| Constant | Default |
|---|---|
| TEST_GUARD_MIN_SESSIONS | 6 |
| SLEEP_OK_HOURS | 7 |
| soreness effect durations (after_n_days) | 1 to 3 |

Same values as the native plan, single source of truth in the engine package.

---

# Engine Portability (Kept Deliberately)

The rules engine is a framework-free TypeScript module. This is partly good architecture and partly insurance: the engine is pure logic, so if the iOS eviction risk ever proves too annoying in real use and a durable native version becomes worthwhile, the engine ports cleanly to Dart and only the shell is rebuilt. The engine is the expensive, high-judgment part, and it is the part that survives a stack switch. Keeping the boundary clean costs little now and preserves that option without committing to it.

This is not the plan. The plan is the PWA. It is a note that the boundary discipline has a second payoff.

---

# Backend: Go Proxy, Built at Phase 13

The app was client-only through Phase 12. At Phase 13, the Go backend landed as a minimal proxy:

- `POST /api/ai` — verifies a client auth token, forwards the request body to the Anthropic API with `x-api-key` from a server-side env var, returns the response. The Anthropic key never reaches the client.
- `GET /health` — returns `{"status":"ok"}`

The backend is not a data backend. IndexedDB on the device remains the source of truth. The Go proxy exists because an Anthropic API key cannot ship in a web client. The app remains fully functional with the backend offline or unreachable; AI is disabled by default and falls back to deterministic flavour.

Deployed on Fly.io (`bellbound-server`, region `lax`). Key in `ANTHROPIC_API_KEY` env var / Fly secret. The client auth token is in `APP_TOKEN` / Fly secret (the client sends this as `Authorization: Bearer <token>`; it is not the Anthropic key).

Durable backup (automatic push instead of file management) is a later addition if wanted. The manual JSON export added in Phase 0 is the current baseline.

---

# Choices Resolved

1. **React or Svelte** — React was chosen. Familiarity and ecosystem size outweighed Svelte's lower ceremony for a solo project that grew to 13 phases.
2. **Client-only or small backend** — Client-only through Phase 12; Go backend (AI proxy) built at Phase 13. See the Backend section above.

---

# First Build Target

Phase 0 plus a hardcoded Phase 1 Today screen showing the real Double KB Strength workout from a seeded block, with a working log form writing to IndexedDB via Dexie, and the service worker shell so it loads offline. That produces something that runs in the browser end to end and is already a useful log, before any RPG or rules.
