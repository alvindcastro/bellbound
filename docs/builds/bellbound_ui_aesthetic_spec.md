# Bellbound UI Aesthetic and Visual System

The visual and tonal spec for Bellbound, patterned after Kingdom of Loathing's aesthetic, adapted for a mobile-first offline PWA. This defines the look and the art-slot system. It does not restyle every component; it gives the rules each component follows.

Read alongside bellbound_rpg_mode_v4.md (Tone Guide, UI Style) and the frontend-design constraints for the stack. This spec governs presentation only; it never changes a training rule, a number, or a recommendation.

---

## The Reference, and What to Take From It

Kingdom of Loathing's look is deliberately Web 0.5: crude hand-drawn stick figures and doodles, an off-white paper background, plain unstyled-feeling type, boxy bordered panels, and dry surreal humor carrying the experience. It is ad-free and has no premium shop, which is part of its identity.

Take from KoL: the crude-doodle art language, the paper background, the plain type, the boxy bordered panels, the restraint (no chrome, no gloss, no animation for its own sake), and above all the deadpan tone.

Do NOT take from KoL: its 2003 architecture. No frames, no full-page reload per action, no fixed desktop three-pane layout. Those are hostile to a phone used one-handed at the gym. Bellbound is a responsive, single-screen-at-a-time mobile PWA that happens to look low-fi, not a literal recreation of a 2003 web page.

Also do NOT let the reference reintroduce removed mechanics. KoL runs on a daily adventure-point economy, meat currency, and consumables that grant turns. Bellbound removed adventure points, has no currency, and bans the slot-machine reward loop. The KoL reference is permission for crude doodles and dry copy, not for resurrecting the turn economy. Visual reference, not mechanical reference.

---

## Core Principles

1. The workout table is the most important thing on the screen. Everything else is framing. Sets, rounds, reps, load, and rest are always fully visible and never obscured by flavour.
2. Low-fi is intentional, not lazy. The crude look is a deliberate style with consistent rules, not an excuse for inconsistency.
3. The writing does the work. Like KoL, the charm is the dry copy, not the graphics. The art is sparse; the tone is everywhere.
4. Mobile-first, one-handed, offline. Readable at arm's length, tappable with a thumb, functional with no connection. Narrow viewport is the design target, not an afterthought.
5. No chrome, no gloss. No gradients-as-decoration, no drop shadows for depth theater, no animation that does not serve a function. Flat, bordered, plain.

---

## Color

A restrained, paper-like palette. Define as CSS variables so it themes in one place.

- Background: off-white / aged paper (e.g. a warm near-white, not pure #fff).
- Text: near-black, slightly warm, high contrast against the paper for readability at the gym.
- Borders / rules: a muted ink gray-brown for panel borders and table rules.
- Secondary text (encounter flavour, captions): a lighter gray-brown, clearly subordinate to the primary text.
- Accent: one restrained accent for interactive elements (the primary action buttons), used sparingly. KoL barely uses color; Bellbound should not either. One accent, used for the main action only.
- Status/feedback: avoid red-for-bad framing on recovery and rest (the design forbids guilt). Status effects and recovery use neutral or muted tones, never alarm colors. A status effect is context, not a warning light.

Do not introduce a second or third accent for decoration. The palette's restraint is the look.

## Typography

- A plain, readable typeface. KoL reads like default browser type; Bellbound can use a clean system serif or a plain monospace-leaning sans for the paper feel, but readability on a phone is the gate. Pick one text face and one optional display face for zone titles; no more.
- Zone titles can be the one place with a touch of character (an italic serif, a slightly larger display face), echoing the screenshot's "The Double-Bell Gate" treatment.
- Generous line spacing and comfortable sizing for arm's-length reading mid-workout. Do not cram.
- The workout table uses tabular, aligned figures so sets/reps/load read cleanly in columns.

## Panels and Layout

- Boxy, bordered panels with plain rules, echoing KoL's table-driven layout but stacked vertically for mobile.
- One primary thing per screen: today's workout, or the log form, or the report, or the character sheet. Not a dense dashboard. Navigation moves between these; they do not all crowd one view.
- Tables for workouts: movement, scheme (sets x reps or time), load, in aligned columns, with the rest prescription as a final row, exactly as the current Today screen shows. This already matches the aesthetic; keep it.
- Tap targets sized for thumbs. Primary actions (Log this workout, Attempt test) are full-width or large, bordered buttons, plain, with the single accent.

## Tone in the UI

The tone is specified in the v4 Tone Guide; do not duplicate it, follow it. The UI surfaces it through: zone titles, encounter text under each movement, completion messages, and the Council's dry explanations. Deadpan, never motivational. The clerk voice, not the coach voice. When a string could be either neutral-dry or hype, choose neutral-dry.

---

## The Art Slot System (placeholders now, hand-drawn later)

Art is sparse and slotted. The point of the slot system is that hand-drawn doodles (to be drawn later) drop into fixed slots without any layout change. Build the slots now; fill them with placeholders.

Defined art slots, each with a fixed aspect ratio and max size:

- Zone illustration: one per zone (The Double-Bell Gate, The Armor Foundry, The Single-Bell Outpost, The Swing Marsh, The Recovery Inn, The Burpee Bog, The Free Lands). One small doodle at the top of the workout, beside or above the zone title.
- Character doodle: one for the character sheet, optionally varying by class.
- Status effect icons: small doodles for the recovery status effects (Poor Sleep Goblin, Press Gremlin, Breathless Fog, Squat Tax, Grip Curse). Small, inline with the effect name.
- Item / title marks (Phase 9): small cosmetic doodles for earned items and titles.
- Encounter marks (optional, low priority): a tiny doodle per movement. Likely skipped; encounter text carries it.

Placeholder rules for now:

- [x] Each slot renders a placeholder: a simple bordered box at the slot's fixed dimensions, containing the slot's name or a crude CSS/SVG stand-in (a literal stick figure drawn in SVG is on-theme and acceptable as a placeholder).
- [x] Placeholders use the same dimensions and position the final art will use, so swapping in a drawing is a file change, not a layout change.
- [x] Art is referenced by a stable slot id (e.g. `zone:double-bell-gate`, `status:poor-sleep-goblin`), mapped to an asset path. Placeholders map to a generic stand-in; real drawings later map to their files. One mapping table, swap entries as art arrives.
- [x] Missing art falls back to the placeholder, never to a broken image or empty space. A slot with no asset shows the bordered stand-in.
- [x] Art is decorative only. No slot's presence or absence affects any function. A zone with no drawing still logs and progresses identically.

When the hand-drawn set arrives: drop the files in, update the slot-to-asset mapping, done. No component changes. Plan for the drawings to be crude, monochrome-friendly, and small; that is the KoL look and it is forgiving to draw.

---

## Implementation Notes (for the stack)

- Define the palette and type as CSS variables / design tokens in one place, per the frontend-design constraints. Do not scatter colors through components.
- Keep the low-fi look with plain CSS; this aesthetic does not need a heavy component library. Restraint is cheaper and more on-theme.
- The art slot is a small reusable component: takes a slot id, renders the mapped asset or the placeholder at fixed dimensions.
- No animation beyond the functional minimum (a tap state, maybe a quiet transition). KoL is static images and simple GIFs; Bellbound should feel similarly still.
- Verify the look on a narrow phone-width viewport in device mode. The desktop view is secondary; the phone is the target.

---

## Explicit Do-Nots

- No frames, no full-page-reload-per-action, no fixed desktop multi-pane layout (KoL's architecture; not for mobile).
- No adventure points, currency, or consumable-turn mechanics surfacing in the UI (removed from the design; the visual reference does not reinstate them).
- No ads, no premium-shop surfaces (Bellbound, like KoL, is not that).
- No guilt framing: no red alarm colors on rest or recovery, no streak-broken styling, no scolding empty states.
- No motivational-poster copy anywhere; the tone is deadpan.
- No decorative gloss: gradients, heavy shadows, or animation that does not serve a function.
- No second/third accent color for decoration; the palette stays restrained.
- Art never gates function; a missing drawing falls back to a placeholder and changes nothing.

---

## Done When (for the visual-system pass)

- [x] Palette and type are defined as tokens in one place and applied app-wide.
- [x] Panels, tables, and buttons follow the boxy, bordered, plain low-fi style on a narrow viewport.
- [x] The workout table remains the most prominent, fully readable element on training days.
- [x] The art slot component exists; every defined slot renders a placeholder at the final art's dimensions; missing art falls back gracefully.
- [x] A single slot-id-to-asset mapping table exists, ready for real drawings to replace placeholders without layout changes.
- [x] Tone in all surfaced strings follows the v4 Tone Guide (deadpan, no hype, no guilt).
- [x] None of the visual work changed a training rule, number, or recommendation.
- [x] The do-nots are respected (no frames, no currency UI, no ads, no guilt framing, no gloss).
