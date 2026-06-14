# Bellbound

A kettlebell training log with an optional RPG layer. The real workout is the product. The RPG layer exists to make disciplined repetition, recovery, and smart progression feel more satisfying.

Bellbound is an offline-capable Progressive Web App. The data lives on the device in IndexedDB. The rules engine runs in the browser. There is no backend until the AI layer arrives in a later phase.

> The strongest character is the one who repeats the baseline workout and goes to bed.

## What It Is

The serious layer is a fixed-routine training log: show today's workout, log what actually happened, track progression by baseline tier, respect recovery. The RPG layer wraps that: workouts become adventures, exercises become encounters, training notes become lore, recovery is a real mechanic, and good judgment earns progress. Consistency is rewarded without streak guilt.

The app rewards showing up, repeating the baseline until it feels normal, resting when the plan says rest, reducing load when form suffers, and logging honestly. It does not reward reckless progression, endless volume, random workouts, guilt streaks, bodyweight commentary, food scoring, or random rewards that pull the user off the routine.

## Status

Early build. Working through a phased plan, client-only, test-driven.

- Phase 0: foundation, data model, persistence.
- Phase 1: today's workout and logging.
- Later phases: planned vs actual, baseline tiers, weekly review, RPG skin, progression engine, recovery mechanics, stats, quests, off-block activities, test/ascension, challenge paths, AI scribe.

See the planning documents for the full picture.

## Tech Stack

- TypeScript
- React
- Vite with vite-plugin-pwa (service worker, offline shell, manifest)
- Dexie over IndexedDB (local source of truth)
- A pure-TypeScript rules engine package with no framework or I/O dependencies
- Vitest, with fake-indexeddb for data-layer tests
- A Go backend (AI proxy on Fly.io, optional backup endpoint) is added only at the AI phase, not before

No native iOS or Android build. The app is installed to the home screen as a PWA.

## Repository Layout

```
bellbound-web/
  packages/
    engine/                # pure TypeScript: entities, council, progression, status, config
  app/                     # the Vite React PWA
    src/
      data/
        db/                # Dexie schema
        repositories/      # map Dexie rows <-> engine entities
        backup/            # export / import
        seed.ts            # first-run seed data
      services/            # app-layer logic (e.g. todayService)
      ui/                  # today, log, review, character
  server/                  # reserved for the Go backend (added at the AI phase, not present yet)
  docs/                    # planning and design documents; start with the document index
```

The engine package never imports React, Dexie, or Vite. The repository layer is the only place that knows both Dexie rows and engine entities.

## Getting Started

Requires Node and npm. Uses npm workspaces.

```
npm install
npm run dev      # start the Vite dev server
npm test         # run Vitest
```

Open the dev URL in a browser. On first run the app seeds a default character, the default week template, an active training block, and the Double KB Strength workout, then renders today's workout.

## Development Principles

- Test-driven. Strict red-green-refactor on all logic and data code: engine, repositories, services, seed, backup. No production logic is written before a failing test. React rendering and service-worker behavior are verified manually, not unit-tested; logic is extracted out of components so it can be tested first.
- The training program is the source of truth. The RPG layer is interpretation and feedback, never a workout generator.
- The rules engine is deterministic and runs fully without AI. AI, when added, is a scribe (parsing notes, writing lore prose), never a decision-maker.
- Offline-first. The app works with no connection. Backup export is mandatory because iOS WebKit can evict local storage after periods of inactivity.
- The real workout is always visible: exercise, sets/rounds, reps, load, rest. The RPG layer never hides them.

## Documentation

Planning and design documents live in `docs/`: the concept (v4), the feature build plan and its corrections, the tech stack decision, the per-phase task checklists, and a document index. Start with `docs/bellbound_document_index.md`, which lists what is current and what is reference.

## License

TBD.
