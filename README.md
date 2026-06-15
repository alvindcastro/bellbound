# bellbound

`bellbound` is a kettlebell training log with an optional RPG layer. The real workout is the product; the RPG layer makes disciplined repetition, recovery, and smart regression feel more satisfying without ever generating or replacing workouts. It runs as an offline-capable Progressive Web App with all data on the device.

> The strongest character is the one who repeats the baseline workout and goes to bed.

### 🎯 What It Rewards

Bellbound rewards showing up, repeating the baseline until it feels normal, resting when the plan says rest, reducing load when form suffers, and logging honestly. It does not reward volume, reckless progression, random workouts, guilt streaks, endless escalation, bodyweight commentary, or food scoring. These are design constraints, not preferences, and they hold across all phases.

### 🚀 Core Features

*   **Fixed-Routine Training Log:**
    *   **Today View:** Shows today's planned workout from a calendar-anchored weekly template, with every set, rep, load, and rest interval always visible.
    *   **Honest Logging:** Records completed, modified, or skipped sessions with difficulty and freeform notes. Drift from the plan is treated as data, not failure.
    *   **Baseline Tiers:** Progression is expressed as a per-workout tier the whole block runs at, bumped only by a successful test workout.
*   **Recovery as a First-Class Mechanic:** Sleep and soreness produce temporary status effects that hold or reduce recommendations. Rest is rewarded, never treated as a broken streak.
*   **Deterministic Rules Engine (The Council):** A pure-TypeScript engine recommends repeat, hold, reduce, or progress from logged data alone. It runs fully without AI.
*   **RPG Layer:** Workouts become adventures, exercises become encounters, training notes become lore, and good judgment earns character progress. Flavour wraps the log; it never obscures the real workout.
*   **Test & Ascension:** A user-invoked test workout, gated by a minimum number of completed baseline sessions, closes a block, banks a permanent lesson, and opens the next block one tier higher.
*   **Off-Block & Recovery Activities:** Runs, vest walks, yoga, and other activities are acknowledged and routed to the recovery system, with deterministic effects and no random rewards.
*   **AI Scribe (Later Phase):** When added, the Anthropic Claude API parses freeform notes into the fixed schema and writes lore prose from structured facts. It never overrides the rules, generates workouts, or invents recovery certainty.
*   **Offline-First Persistence:** All data lives in IndexedDB on the device. The app works with no connection. Manual backup export and import guard against storage eviction.

### 🛠 Tech Stack

*   **TypeScript + React 18:** Application and UI.
*   **Vite + vite-plugin-pwa:** Build tooling, service worker, offline shell, and web manifest.
*   **Dexie over IndexedDB:** Local source of truth for all training data.
*   **`@bellbound/engine`:** A pure-TypeScript rules engine package (entities, council, progression, status effects, config) with no framework or I/O dependencies.
*   **Vitest + fake-indexeddb:** Test runner, with a fake IndexedDB for data-layer tests.
*   **Go (Later Phase):** A backend AI proxy and optional backup endpoint on Fly.io, added only at the AI phase. Not present before then.

No native iOS or Android build. The app is installed to the home screen as a PWA.

### 🏗 Setup & Installation

1.  **Install Prerequisites:**
    *   [Node.js 20+](https://nodejs.org/) and npm
    *   [WebStorm](https://www.jetbrains.com/webstorm/) (recommended IDE; GoLand is used later for the Go backend phase)

2.  **Clone the Repository:**
    ```bash
    git clone https://github.com/alvindcastro/bellbound-web.git
    cd bellbound-web
    ```

3.  **Install Dependencies:**
    ```bash
    npm install
    ```
    The repo uses npm workspaces; this installs the `app` and `packages/engine` workspaces together.

### 📋 Configuration

#### Frontend

No secrets in the frontend. Two optional Vite env vars tell the app where the Go proxy lives:

```bash
# app/.env.local  (create locally; never commit)
VITE_AI_PROXY_URL=http://localhost:8080   # Go proxy URL (omit to keep AI disabled)
VITE_AI_AUTH_TOKEN=your-app-token         # shared token the proxy checks; see server/.env
```

The Anthropic key is never in the frontend. AI is **disabled by default** and the app is fully usable without these vars.

#### Backend (server/)

The Go proxy reads secrets from environment variables. For local dev, create `server/.env` (not committed):

```bash
# server/.env
ANTHROPIC_API_KEY=sk-ant-...   # Anthropic API key — server-side only, never sent to the client
APP_TOKEN=your-app-token        # Auth token the frontend sends; must match VITE_AI_AUTH_TOKEN
```

For production on Fly.io, set these as Fly secrets:
```bash
fly secrets set ANTHROPIC_API_KEY=sk-ant-... APP_TOKEN=your-app-token
```

The Anthropic key lives **only on the server**. It is read from the env var, never logged, never returned to the client, and never committed to the repository.

Tunable behaviour lives in one place, `packages/engine/src/config.ts`, the single source of truth for the engine:

```ts
// packages/engine/src/config.ts
export const TEST_GUARD_MIN_SESSIONS = 6;   // baseline KB sessions required before a test counts
export const SLEEP_OK_HOURS = 7;            // a night at/above this clears the Poor Sleep effect

// after_n_days durations for soreness-driven status effects
export const SORENESS_EFFECT_DAYS = {
  breathlessFog: 3,
  squatTax: 3,
  gripCurse: 2,
};
```

The Poor Sleep effect clears on a completed rest day or a logged night at or above `SLEEP_OK_HOURS`, whichever comes first. There is no numeric fatigue model; fatigue is expressed entirely through status effects.

### 🏃 How to Run

#### 1. Dev Server (Default)
Starts the Vite dev server with hot reload. On first run the app seeds a default character, the default week template, an active training block, and the Double KB Strength workout, then renders today's workout.
```bash
npm run dev
```
Open the printed dev URL in a browser. To test offline behaviour, use the browser dev tools Network tab (offline) and Application tab (Service Workers, IndexedDB).

#### 2. Tests
Runs Vitest across the workspaces. All logic and data code is written test-first.
```bash
npm test
```

#### 3. Go Proxy (AI features)
The Go proxy holds the Anthropic key server-side. It is optional — the app runs fully without it.

```bash
# Run locally
cd server
ANTHROPIC_API_KEY=sk-ant-... APP_TOKEN=your-token go run .

# Deploy to Fly.io (after fly auth login and fly apps create)
fly deploy --config server/fly.toml
```

The proxy exposes:
- `POST /api/ai` — forwards requests to the Anthropic API; requires `Authorization: Bearer <APP_TOKEN>`
- `GET /health` — returns `{"status":"ok"}`

#### 4. Production Build
Builds the static PWA assets for hosting.
```bash
npm run build
```

### 🧱 Repository Layout

```
bellbound/
  packages/
    engine/            # pure TypeScript: entities, council, progression, status, config
  app/                 # Vite React PWA
    src/
      data/
        db/            # Dexie schema
        repositories/  # map Dexie rows <-> engine entities (only boundary that knows both)
        backup/        # export / import
        ai/            # AI client: interface, no-op, proxy implementation, parse validator
        seed.ts        # first-run seed data
      services/        # app-layer logic with I/O (e.g. todayService, loreService)
      ui/              # React components: today, log, review, character
  server/              # Go proxy: forwards AI calls server-side so the key never ships in the client
  docs/                # planning and design documents
```

The engine package never imports React, Dexie, or Vite. The repository layer is the only place that knows both Dexie rows and engine entities; no Dexie types leak into the engine, and no Dexie calls happen directly from UI components.

### 🧪 Development Principles

*   **Strict TDD on all logic and data code.** Red-green-refactor for the engine, repositories, services, seed, and backup. No production logic before a failing test. React rendering and service-worker behaviour are verified manually; logic is extracted out of components so it can be tested independently.
*   **The engine is pure.** It takes plain entity objects in and returns results out, with no concept of storage or the network.
*   **The training program is the source of truth.** The app reacts to what was logged; it never generates workouts or auto-progresses after a single good session.
*   **Deterministic first, AI optional.** The rules engine runs fully without AI. AI is a scribe, never an authority, and the app works with it disabled.
*   **Offline-first.** Backup export is mandatory because iOS WebKit can evict IndexedDB after periods of inactivity.
*   **The real workout is always visible.** Exercise, sets/rounds, reps, load, and rest are never hidden behind RPG flavour.

### 📄 Documentation

Planning and design documents live in `docs/`.

*   [bellbound_document_index.md](./docs/bellbound_document_index.md) - Index of all documents; what is current and what is reference-only. Start here.
*   [bellbound_rpg_mode_v4.md](./docs/bellbound_rpg_mode_v4.md) - The concept: entities, mechanics, week template, blocks, ascension, stats, status effects.
*   [bellbound_feature_build_plan_v1.md](./docs/bellbound_feature_build_plan_v1.md) - Phase-by-phase feature build plan (Phases 0 to 13).
*   [bellbound_build_plan_updates_v1.md](./docs/bellbound_build_plan_updates_v1.md) - Corrections to the build plan.
*   [bellbound_tech_stack_committed_pwa_v1.md](./docs/bellbound_tech_stack_committed_pwa_v1.md) - The committed tech stack and the backend deferral.
*   [bellbound_phase0_build_tasks.md](./docs/bellbound_phase0_build_tasks.md) - Tickable Phase 0 tasks: foundation, data model, persistence.
*   [bellbound_phase1_build_tasks.md](./docs/bellbound_phase1_build_tasks.md) - Tickable Phase 1 tasks: today's workout and logging.
*   [CLAUDE.md](./CLAUDE.md) - Guidance for Claude Code in this repo.
*   [AGENTS.md](./AGENTS.md) - Instructions for coding agents.
