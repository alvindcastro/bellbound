# Bellbound Phase 13: AI Scribe Layer and Go Backend — Build Tasks

Detailed, tickable tasks for Phase 13 on the committed stack. Phase 13 adds the optional AI scribe: natural-language note parsing into the fixed schema, and lore prose from structured facts. It also introduces the first backend, a Go proxy on Fly.io that holds the Anthropic key. The app must remain fully functional with AI disabled.

Prerequisite: Phase 0 through 12 complete. The entire deterministic app works without AI. The AI interface in `app/src/data/ai` has existed as a no-op offline implementation since Phase 0; this phase adds the real implementation behind it.

Goal of Phase 13: a Go backend proxies AI calls so no key ships in the client; the AI parses freeform notes into the difficulty enum plus signal flags (the same fixed schema captured manually since Phase 6); the AI writes lore prose from structured facts only; the AI is attempted only when online; and the deterministic engine and manual toggles remain the fallback and the source of truth.

Reference: bellbound_rpg_mode_v4.md (AI Use Cases, the scribe-not-coach principle), bellbound_feature_build_plan_v1.md (Phase 13), bellbound_tech_stack_committed_pwa_v1.md (Backend section: Go proxy on Fly.io), CLAUDE.md / AGENTS.md (AI is a scribe, never an authority).

State management: as decided earlier.

IDE note: this phase introduces the `server/` directory. Open it in GoLand; keep the frontend in WebStorm.

---

## TDD Protocol (Phase 13)

Strict red-green-refactor on both sides.

Test-first (Vitest, frontend):
- The AI client interface: the online implementation calls the proxy; the offline/no-op implementation is selected when offline or disabled.
- Parsing-result validation: the parsed difficulty/signals are validated against the fixed schema before use; invalid AI output is rejected and falls back to manual values.
- That the app's behavior is identical with AI disabled (the deterministic path is unchanged).

Test-first (Go, backend):
- The proxy handler: forwards a request, attaches the key server-side, returns the response; rejects unauthorized callers; never logs the key.
- Standard Go table tests for request validation and error paths.

Verify manually:
- End-to-end note parsing with a real key in a dev environment.
- Lore prose generation and display.

Discipline: TDD applies to the Go backend too (it is logic, and Go has first-class testing). Commit on green on both sides.

---

## Section A: Go Backend Proxy (server/)

- [ ] Create the `server/` directory as a Go module (the sibling reserved since Phase 0). Open it in GoLand.
- [ ] RED first: write failing Go tests for an HTTP handler that accepts a chat/parse request from the client, attaches the Anthropic key from a server-side env var, forwards to the Anthropic API, and returns the response. Then implement.
- [ ] The key lives only on the server, in an env var (`.env` for local, Fly secret in production). It is never sent to or stored in the client. Test that the handler reads the key from env and that the key never appears in logs.
- [ ] Add minimal auth on the proxy endpoint (a token the client sends) so the proxy is not an open relay. Test unauthorized requests are rejected.
- [ ] Add a health endpoint. Keep the service small and single-purpose: it proxies AI calls and (optionally, later) accepts backup pushes. It is not a data backend; the source of truth stays in the client's IndexedDB.
- [ ] Write a Dockerfile / Fly config for deployment to Fly.io (matching the CiteSearch adapter / ask-banner.fly.dev pattern). Deployment itself can be verified manually.

## Section B: AI Client (frontend)

- [ ] Replace the Phase 0 no-op AI implementation's online path with a real client that calls the Go proxy (not the Anthropic API directly; the client has no key).
- [ ] RED first: write failing tests that the client selects the online implementation when online and the no-op when offline or when AI is disabled by a setting. Then implement.
- [ ] Add an AI on/off setting (default off or user-controlled). When off, the app uses manual toggles and deterministic logic exclusively, exactly as Phases 6 to 12 do.
- [ ] The client never holds the Anthropic key. Confirm by inspection and a test that no key is referenced client-side.

## Section C: Note Parsing Into the Fixed Schema

- [ ] The AI parses a freeform workout note into the SAME fixed schema captured manually since Phase 6: the difficulty enum (easy/normal/hard/failed) and the four signal flags (pressGrindy, breathless, gripCooked, legsSore).
- [ ] RED first: write failing tests for the parse-result validator: given the AI's structured output, validate it strictly against the enum and the four booleans; reject anything off-schema; on rejection, fall back to manual/default values. Then implement.
- [ ] The parsed values are a suggestion the user confirms before saving. RED first: test that parsed values populate the log form for review and are not silently committed. Then implement the review step.
- [ ] The parser's target is fixed and small (one enum plus four booleans), which is why the deterministic engine never depends on it. Confirm the engine still receives the same schema whether the values came from manual toggles or AI parsing.

## Section D: Lore Prose From Structured Facts

- [ ] The AI generates lore/flavour prose from structured facts (the log, the classification, the recommendation), never inventing facts or advice.
- [ ] RED first: write tests that lore generation is fed only structured data and that its output is stored as a LoreEntry linked to the log, separate from the factual record. Then implement.
- [ ] Lore is cosmetic. It does not change any number, recommendation, stat, or status effect. Confirm by test that generating lore does not mutate the log, stats, or recommendations.
- [ ] If offline or AI disabled, lore falls back to the deterministic/templated flavour from Phase 5. The app never blocks on lore.

## Section E: Guardrails (AI Is a Scribe, Never an Authority)

- [ ] The AI must not: generate workouts, recommend progression, override the Council, give medical advice, invent recovery certainty, or apply guilt. RED first: structure the integration so the AI's output is confined to (a) parsed schema values for user confirmation and (b) cosmetic lore. It is never wired into the recommendation, progression, stat, or status logic. Add tests asserting these paths do not consume AI output.
- [ ] The deterministic engine remains the source of truth. The AI annotates and flavors; it does not decide.
- [ ] Verify the full app works with AI disabled (toggle off, or offline): logging, recommendations, recovery, stats, ascension, all function exactly as before. This is a release gate, tested and manually confirmed.

## Section F: README and Env Updates

- [ ] Update the README: add a Configuration section for the backend `.env` (Anthropic key, proxy auth token) and a server run mode (run the Go proxy locally, deploy to Fly.io). The frontend remains client-only; only the new backend has secrets.
- [ ] Document that the Anthropic key lives server-side only, never in the client, and that the app is fully usable with AI disabled and no backend running.
- [ ] Add the `server/` directory to the documented repo layout (it now exists).

## Section G: Persistence and Offline

- [ ] Confirm the app is fully functional offline with AI disabled (the default path).
- [ ] Confirm AI features degrade gracefully: offline or proxy-unreachable falls back to manual toggles and templated lore with no errors blocking the user.
- [ ] The source of truth remains the client's IndexedDB; the backend does not become a data dependency.

## Section H: Phase 13 Done When

- [ ] A Go proxy on Fly.io forwards AI calls with the key server-side; the client never holds the key; unauthorized requests are rejected; the key never appears in logs. All tested.
- [ ] The AI parses notes into the fixed difficulty+signals schema; output is validated and confirmed by the user before saving; invalid output falls back to manual values.
- [ ] The AI generates cosmetic lore from structured facts only and never mutates logs, stats, recommendations, or status effects.
- [ ] The AI is confined to parsing-for-confirmation and lore; it is never wired into recommendation, progression, stat, or status logic, proven by tests.
- [ ] The app is fully functional with AI disabled or offline, verified as a release gate.
- [ ] The README documents the backend env, the server run mode, and the key-server-side-only rule.
- [ ] Backend and frontend logic both test-first; the deterministic engine unchanged and still pure.
- [ ] Committed on green, pushed, with a clear Phase 13 commit message.

---

## Explicit Exclusions (do not build in Phase 13)

- Any AI authority over training decisions (forbidden by design)
- AI-generated workouts or programs (forbidden)
- Shipping the Anthropic key in the client (forbidden)
- Making the backend the source of truth (it is a proxy; IndexedDB stays authoritative)
- Currency, decay (deferred/forbidden as before)
- A full data-sync backend (single user; out of scope; the backend is a proxy plus optional backup push)

## Watch-Outs

- AI is a scribe, full stop. The entire risk of this phase is letting the AI creep into decisions. It parses notes into the existing schema (for user confirmation) and writes flavour. It does not recommend, progress, diagnose, or decide. If AI output ever reaches the recommendation or progression logic, that is the failure this phase must prevent. The tests asserting those paths do not consume AI output are the guard.
- The deterministic app is the product; AI is polish. The release gate is that everything works with AI off. If the app degrades to unusable without AI, the layering is wrong. The whole architecture since Phase 0 (no-op AI implementation from the start) exists to make this true.
- Key server-side only. The single security rule: the Anthropic key never touches the client. The proxy exists for this reason. Test that the client has no key reference and the server never logs it.
- Validate AI output strictly. The AI's parse must be validated against the fixed enum and booleans and rejected if off-schema, falling back to manual. Never trust AI output into the schema unchecked. The user confirms parsed values before they are saved.
- Offline must never block. Any AI call is attempted only when online and degrades silently to manual/templated behavior. The user at the gym with no signal must never hit an AI-related error or wait.
