# Bellbound

A kettlebell training log with an optional RPG layer. The real workout is the product. The RPG layer exists to make disciplined repetition, recovery, and smart regression feel more satisfying — not to replace or generate workouts.

Bellbound is an offline-capable Progressive Web App. Data lives on the device in IndexedDB. The rules engine runs entirely in the browser. There is no backend until the AI phase.

> The strongest character is the one who repeats the baseline workout and goes to bed.

## What It Rewards

The app rewards showing up, repeating the baseline until it feels normal, resting when the plan says rest, reducing load when form suffers, and logging honestly.

It does not reward volume, reckless progression, random workouts, guilt streaks, endless escalation, or any form of bodyweight commentary or food scoring. These are design constraints, not preferences — they hold across all phases.

The serious layer is a fixed-routine training log: show today's workout, log what happened, track progression by baseline tier, respect recovery. The RPG layer wraps that — workouts become adventures, training notes become lore, good judgment earns character progress. Consistency is rewarded without streak guilt.

## Status

Early build. Working through a phased plan, client-only, test-driven.

- Phase 0: foundation, data model, persistence
- Phase 1: today's workout and logging
- Later phases: planned vs actual, baseline tiers, weekly review, RPG skin, progression engine, recovery mechanics, stats, quests, off-block activities, test/ascension, challenge paths, AI scribe

See `docs/bellbound_document_index.md` for the full picture.

## Tech Stack

- TypeScript, React 18
- Vite with vite-plugin-pwa (service worker, offline shell, web manifest)
- Dexie over IndexedDB — the local source of truth
- `@bellbound/engine` — a pure-TypeScript rules engine package with no framework or I/O dependencies
- Vitest with fake-indexeddb for data-layer tests
- Go backend (AI proxy, optional backup endpoint) — added only at the AI phase, not before

No native iOS or Android build. The app is installed to the home screen as a PWA.

## Repository Layout

```
bellbound/
  packages/
    engine/          # pure TypeScript: entities, council, progression, status effects, config
  app/               # Vite React PWA
    src/
      data/
        db/          # Dexie schema
        repositories/  # map Dexie rows <-> engine entities (only boundary that knows both)
        backup/      # export / import
        seed.ts      # first-run seed data
      services/      # app-layer logic with I/O (e.g. todayService)
      ui/            # React components: today, log, review, character
  server/            # reserved for the Go backend; not present yet
  docs/              # planning and design documents
```

The engine package never imports React, Dexie, or Vite. The repository layer is the only place that knows both Dexie rows and engine entities — no Dexie types leak into the engine, and no Dexie calls happen directly from UI components.

## Getting Started

Requires Node and npm. Uses npm workspaces.

```bash
npm install
npm run dev    # start the Vite dev server
npm test       # run Vitest
```

Open the dev URL in a browser. On first run the app seeds a default character, the default week template, an active training block, and the Double KB Strength workout, then renders today's workout.

## Development Principles

**Strict TDD on all logic and data code.** Red-green-refactor, no exceptions, for the engine, repositories, services, seed, and backup. No production logic is written before a failing test exists and fails for the right reason. React rendering and service-worker behavior are verified manually; logic is extracted out of components so it can be tested independently.

**The engine is pure.** `packages/engine` takes plain entity objects in and returns results out. It has no concept of storage or the network. Callers pass data in; the engine does not reach for it.

**The training program is the source of truth.** The app reacts to what was logged. It never generates workouts or auto-progresses after a single good session.

**The rules engine is deterministic and runs fully without AI.** When AI arrives, it is a scribe — parsing notes into the fixed schema and writing lore prose from structured facts. It does not override the deterministic rules, generate workouts, give medical advice, or invent recovery certainty. The app remains fully functional with AI disabled.

**Offline-first.** The app works with no connection. Backup export is mandatory because iOS WebKit can evict IndexedDB after periods of inactivity.

**The real workout is always visible.** Exercise, sets/rounds, reps, load, and rest are always shown. The RPG layer never obscures them.

## Documentation

Planning and design documents live in `docs/`. Start with `docs/bellbound_document_index.md`, which lists what is current and what is reference-only, including the concept document, per-phase task checklists, and tech stack decisions.
