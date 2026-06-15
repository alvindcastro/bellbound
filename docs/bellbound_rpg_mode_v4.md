# Bellbound: RPG Mode for BellLog (v4)

## What Changed From v3

This version resolves the open items from the v3 review and folds in the design decisions made afterward.

- Replaced the fixed 4-week campaign model with a calendar-anchored week template plus test-bounded blocks.
- Kept the six-stat model.
- Defined the difficulty enum and split it from per-signal flags.
- Replaced the single StatusEffect expiry string with an expiry-type enum, and allowed multiple effects to be active at once with most-conservative stacking.
- Added a DailyContext entity for sleep, bodyweight, and food.
- Added an off-block / recovery activity model with two classes and no random rewards.
- Made ascension test-triggered with a numeric completion guard.
- Defined baseline progression as a per-template tier bump.

---

# Working Concept

Bellbound is an optional RPG layer for BellLog, a kettlebell training log built around a fixed weekly routine, actual workout notes, small progressions, and recovery-aware decisions.

The original BellLog app stays practical:

- show today's workout
- log actual work
- track progression
- respect recovery
- summarize the training week

Bellbound adds a playful wrapper:

- workouts become adventures
- exercises become encounters
- training notes become lore
- recovery becomes a real mechanic
- good judgment earns progress
- consistency is rewarded without streak guilt

The goal is not to turn training into a random workout game. The goal is to make boring, repeatable training feel more alive.

---

# One-Line Pitch

A kettlebell training log disguised as a dumb text RPG, where clean reps defeat monsters and poor sleep is an actual debuff.

---

# Core Product Direction

Bellbound is a fixed-routine training log with RPG feedback.

The training routine drives the day. The app reacts to what the user actually does. The routine remains the source of truth. The RPG layer is interpretation, flavour, and feedback.

There are no daily action points, no energy budget, and no spendable adventures. Adventure is only a narrative label for the planned workout. Overtraining is not surfaced through a points cap. It is surfaced through real reported signals: poor sleep, soreness, grindy reps, breathlessness, missed sessions, and extra unplanned training.

---

# The Week Template

The user follows a fixed weekly pattern, anchored to calendar days. The week does not re-align when real life drifts.

Default template:

| Day | Planned Day Type |
|---|---|
| Monday | KB |
| Tuesday | KB |
| Wednesday | Rest |
| Thursday | KB |
| Friday | KB |
| Saturday | Free |
| Sunday | Rest |

## Day Types

There are four day types.

| Day Type | Meaning |
|---|---|
| KB | A prescribed kettlebell workout from the current baseline |
| Rest | A planned rest day. Earns the rest reward. |
| Free | A free training day. The user chooses the activity. Not a rest day. |
| Test | A user-invoked replacement for a KB day. The current baseline workout done at test intensity. Gates ascension. |

KB and Rest are fixed slots. Free is a variable slot the user fills. Test is not scheduled; the user invokes it in place of a KB day when the baseline feels consolidated.

## Planned vs Actual

Each calendar day has a planned day type from the template. What the user logs is the actual. The app compares the two. Four cases:

1. Trained on a planned training day. Normal. Counts toward the block and quests.
2. Rested on a planned rest day. Normal. Earns the rest reward.
3. Trained on a planned rest day. Logged as extra. Counts toward Consistency or off-block training, feeds the fatigue and status system, the Council notes it neutrally. No guilt.
4. Missed a planned training day. Logged as skipped. No guilt copy. Resume without penalty. The template does not shift; the slot was simply not filled.

The template never re-aligns to actual behaviour. Drift is treated as data, not a trigger to rebuild the schedule.

## The Free Day

Saturday is a free training day, not a rest day. The user may run, hike, play pickleball, do a barbell workout, or rest. The activity logged determines its class and effects (see Activities and Classes). Because a free day is not a rest day, it does not earn the rest-day reward. If the user chooses to rest on a free day, that is fine and neutral, and it is not counted as a missed session.

Sunday is the real rest day. This keeps recovery accounting honest.

---

# Blocks and Baseline

## What a Block Is

A block is a span of weeks of the week template, run at a single baseline. A block is not calendar-fixed. It runs until a successful test workout consolidates the baseline and bumps it. One block might last three weeks, another seven, depending on when the baseline consolidates.

The continuous week template is the day-to-day engine. The block is the higher layer: everything done at the current baseline until a successful test ends it and opens the next block one tier higher.

## Baseline Tiers

A block carries a single integer baseline tier. The bump is whole-baseline: a successful test moves the block from tier N to tier N+1, and the next block runs everything one tier higher.

What "one tier" means is defined per workout template, not globally. A whole-baseline bump applies one tier up to everything, but each workout expresses its own tier. This prevents a single global rule from forcing a bell jump on presses while only adding a round to squats.

Examples of per-template tier definitions:

| Workout | Tier Step |
|---|---|
| Double KB Strength | Add one round (4 rounds at tier N, 5 at tier N+1) |
| Armor Building Complex | Add sets (10 at tier N, 12 at N+1, 15, 20) |
| Conditioning / swings | Add volume or density, defined per template |

The test triggers tier N to N+1. Each template reads its own tier definition to express the new baseline.

## The Test Workout

The test is the current baseline workout done at test intensity. It is not a separate prescribed workout. It is the same movements at a heavier load or a top effort, invoked by the user in place of a KB day.

## Ascension Guard

A test only counts as an ascension trigger if the current baseline was actually completed enough times first. This prevents testing too often, which would otherwise reward reckless training.

The guard is a numeric threshold:

- TEST_GUARD_MIN_SESSIONS = 6 (tunable)

The test counts toward ascension only if at least 6 completed planned KB sessions at the current tier have been logged in the current block. If the user invokes a test before the threshold, the Council declines, the rotation continues unchanged, and the baseline does not bump.

Set this number where it fits your training. 6 is a starting default, not a fixed rule.

## Ascension Is Block-End

A successful test that passes the guard does three things in one event:

1. Closes the current block.
2. Banks a Permanent Lesson.
3. Opens the next block at tier N+1.

Quests and progression count within the current block. The weekly Council Report is always the last 7 days, independent of block length.

---

# Activities and Classes

The user can log activities outside the prescribed KB workouts. Every logged activity falls into one of three sources, and the source determines how it counts.

| Source | Meaning | Counts Toward | Triggers Status Effects |
|---|---|---|---|
| planned | A prescribed workout on a training day | Block progress, quests, ascension guard | Yes |
| off_block | Real training outside the routine (run, vest walk, pickleball, extra session) | Consistency and relevant physical stat | Yes |
| recovery_skill | Light or non-training activity (yoga, walk, hike, finished a book, solved a cube) | Recovery, Judgment, or flavour only | No |

## Two Classes, No Random Rewards

Off-block and recovery activities give small, deterministic, always-positive feedback. They never give random or jackpot rewards. A variable reward on an activity such as running would pull the user away from the prescribed routine, which is the opposite of what Bellbound is for.

Recovery / skill activities give small reliable Recovery or Judgment feedback, or flavour only:

- Yoga, mobility, walking, hiking: small Recovery, no fatigue cost.
- Reading a book, solving a Rubik's cube: flavour or small Judgment. Not physical stats. This is where the absurd kingdom charm lives.

Training activities off the routine map to the relevant physical stat and feed the same recovery system:

- Run: Conditioning. Can trigger Breathless Fog if hard.
- Vest walk: light Conditioning, low fatigue.
- Pickleball: Conditioning and skill, feeds fatigue.
- Barbell on a free day: Strength, feeds fatigue.

An off-block run after a hard swing day adds to fatigue load and can trigger a status effect. It is acknowledged as real work. It does not pay a bonus that competes with the program.

## Random Flavour Is Allowed, Random Rewards Are Not

A random flavour line is fine: "the run cleared your head, the goblins respect you today." A random stat, currency, or progression bonus is not. This preserves the product thesis that the strongest character repeats the baseline and goes to bed.

---

# Stats

Six stats, mapped to training behaviour, not just fantasy numbers.

| Stat | Real Meaning |
|---|---|
| Strength | Heavy clean, press, squat, carry, barbell work |
| Conditioning | Swings, burpees, EMOMs, runs, density work |
| Control | Clean technique, no grindy reps |
| Consistency | Completed planned sessions, logged extras |
| Recovery | Rest, sleep-aware adjustments, deloads, mobility |
| Judgment | Smart swaps, regressions, not progressing too early |

## Stat Gain Rules

| Stat | Gain Trigger |
|---|---|
| Strength | Complete heavy clean, press, squat, carry, or barbell work |
| Conditioning | Complete swings, burpees, EMOMs, runs, or density work |
| Control | Mark reps as clean or avoid grinding |
| Consistency | Complete a planned session or log an extra |
| Recovery | Take scheduled rest, deload, mobility, or avoid unnecessary work |
| Judgment | Make a smart swap, repeat baseline, reduce load, or skip a finisher |

## Stat Gain Is Not Progression Eligibility

The app separates three things:

- feeling good about the session
- earning RPG feedback (stat gain)
- changing the next workout (progression)

A user can gain Strength for training while not unlocking progression because the presses were grindy. This prevents the RPG system from encouraging bad training decisions.

```text
You gained Strength because you trained.

You did not unlock progression because the presses were grindy.
```

## Stats Reset on Ascension

Stats are per-block. On ascension the block closes and stats reset to a baseline. What carries across blocks is the Permanent Lessons, not the stat numbers. This prevents unbounded stat inflation across months of training and keeps each block a fresh campaign at a higher baseline.

---

# Difficulty and Signals

This is the input that drives the progression engine. It is split into one overall enum and several targeted signal flags, because they drive different recommendations.

## Overall Difficulty (single enum, per WorkoutLog)

| Value | Meaning |
|---|---|
| easy | Completed comfortably |
| normal | Completed as expected |
| hard | Completed but demanding |
| failed | Could not complete as planned |

Overall difficulty is a progression signal. "Hard" means do not add load. "Normal twice" is the progression trigger.

## Per-Signal Flags (booleans, per WorkoutLog)

These are targeted. They restrict a specific movement, not the whole session.

| Flag | Status Effect | Recommendation |
|---|---|---|
| pressGrindy | Press Gremlin | Hold or reduce pressing volume |
| breathless | Breathless Fog | Add rest or repeat conditioning baseline |
| gripCooked | Grip Curse | Reduce carry finisher |
| legsSore | Squat Tax | Keep squat volume or load conservative |

The split lets the system express "the session was normal but the presses were ugly," which one enum cannot. The session can still progress on movements that have no blocking flag.

## Progression Rule

Progression is eligible when:

- the same workout was logged at difficulty easy or normal twice, and
- no blocking signal flag is set for the movement being progressed.

The natural-language parser's job is to map freeform notes to difficulty enum plus signal booleans. That is a small fixed target, which is why the rules engine can run without AI and the AI is optional flavour on top.

---

# Status Effects

Status effects are temporary training-context flags. They influence recommendations without shaming the user. Multiple can be active at once.

| Status | Trigger | Recommendation Effect | Expiry Type |
|---|---|---|---|
| Poor Sleep Goblin | User logs poor sleep | Block aggressive progression | after_next_rest_day, or after logging sleep ≥ SLEEP_OK_HOURS (whichever first) |
| Press Gremlin | Press reps felt grindy | Hold or reduce pressing volume | after_next_session |
| Breathless Fog | Conditioning felt too hard | Add rest or repeat baseline | after_n_days (2-3) |
| Squat Tax | Legs sore | Keep squat volume or load conservative | after_n_days (2-3) |
| Grip Curse | Carries or swings cooked grip | Reduce carry finisher | after_n_days (1-2) |
| Shoulder Goblin | Too much pressing / push-up volume | Reduce push-up finisher | after_n_days or after_next_session |

## Expiry Types

A single expiry string cannot represent these. The expiry type is an enum with an optional parameter.

| Expiry Type | Meaning | Param |
|---|---|---|
| after_next_rest_day | Clears on the next completed rest day | none |
| after_next_session | Clears when the relevant work is trained again normally | none |
| after_n_days | Clears on a timer regardless of training | N days |
| after_successful_light_session | Clears when a light or technique session is logged | none |
| manual | Persists until dismissed or explicitly resolved | none |

## Multiple Effects and Stacking

Poor sleep after a hard session with soreness is a real and common state. That night produces several effects at once: Poor Sleep Goblin from sleep, Squat Tax or Grip Curse from soreness, possibly Press Gremlin from a grindy press. Each has its own expiry and clears independently.

Stacking rule: when multiple effects are active, the recommendation takes the most conservative combination. The engine applies every active restriction. It does not average them, and a good signal never cancels a bad one. Poor sleep plus sore legs means repeat baseline, keep squats light, and hold pressing, all at once.

## Not Status Effects

Two things from earlier drafts are not temporary context flags and are modeled elsewhere:

- A positive rest note is a one-time reward message, not a persistent effect.
- Baseline consolidation ("felt normal twice") is progression state on the block, not a debuff.

---

# DailyContext

Sleep, bodyweight, and food are logged whether or not a workout happened, so they live in their own entity, independent of WorkoutLog.

| Field | Use |
|---|---|
| date | The day |
| hoursSlept | Real input to Poor Sleep Goblin. Replaces a yes/no sleep flag. |
| bodyweight | Tracked and charted. Silent. Never generates commentary or effects. |
| foodNote | Freeform lore only. Never scored, never labeled good or bad, never a stat modifier or recommendation. |

Bodyweight and food are deliberately inert. A fitness app that comments on weight or scores food invites disordered behaviour, which contradicts the no-guilt principle. They are tracked, not judged.

---

# Recovery as a First-Class Mechanic

The RPG layer should reward good decisions, not endless intensity. A good decision might be:

- repeat the same workout
- use the 16 kg bell instead of the 24 kg bell
- skip a finisher
- take a rest day
- deload
- keep ABC at 10 sets instead of jumping to 20
- avoid hard conditioning after a hard swing day
- swap the workout due to poor sleep

Bellbound makes those choices feel like progress.

## Rest Day Reward

```text
You rested.

This was not laziness.
This was infrastructure maintenance.

Recovered:
+1 Joint Morale
+1 Future Training Quality
```

Rest days are part of the routine. They are never treated as broken streaks.

## Deload

```text
Campaign Event:
The Great Deload

All enemies have 30% less volume.
The hero complains anyway.
```

Deloads produce positive feedback and never trigger stat loss or guilt copy.

---

# The Council (Recommendation Engine)

The Council is a deterministic rules engine with a dry voice. It is not a personality that invents advice. It reads structured data and emits a recommendation. The voice wraps the output.

Inputs, read in order:

1. Active status effects, with each expiry checked against today.
2. The last N WorkoutLogs for the current block: difficulty enum and signal flags.
3. Block position: baseline tier, count of completed planned KB sessions at this tier (for the ascension guard).
4. DailyContext for today: sleep, and whether a workout has been logged.

Outputs:

- the next-session recommendation
- progression eligibility, if the rule is satisfied
- an ascension offer, if a test was logged and the guard threshold is met

Because the engine is deterministic, the app functions fully with AI turned off. The AI is optional polish that turns logs into lore and recommendations into prose. This matches the scribe-not-coach principle.

---

# Data Model

## Character

```json
{
  "userId": "user_001",
  "characterName": "Alvin the Reasonably Tired",
  "class": "Program Warlock",
  "level": 3,
  "stats": {
    "strength": 12,
    "conditioning": 10,
    "control": 9,
    "consistency": 14,
    "recovery": 8,
    "judgment": 11
  }
}
```

## Block

```json
{
  "id": "block_002",
  "name": "Campaign of Reasonable Volume",
  "baselineTier": 2,
  "startDate": "2026-06-01",
  "status": "active",
  "endsOnTest": true,
  "testGuardMinSessions": 6,
  "completedPlannedKbSessions": 4
}
```

## WeekTemplate

```json
{
  "id": "default_week",
  "days": {
    "monday": "kb",
    "tuesday": "kb",
    "wednesday": "rest",
    "thursday": "kb",
    "friday": "kb",
    "saturday": "free",
    "sunday": "rest"
  }
}
```

## WorkoutTemplate

Defines what each tier means for this workout.

```json
{
  "id": "double_kb_strength",
  "name": "Double KB Strength",
  "zoneName": "The Double-Bell Gate",
  "category": "kb",
  "defaultRest": "90-120 sec after full round",
  "tierStep": "add one round",
  "tiers": {
    "1": { "rounds": 4 },
    "2": { "rounds": 5 },
    "3": { "rounds": 6 }
  },
  "movements": [
    { "name": "Double clean", "reps": 5, "load": "double 20 kg" },
    { "name": "Double press", "reps": 3, "load": "double 20 kg" },
    { "name": "Double front squat", "reps": 5, "load": "double 20 kg" },
    { "name": "Push-ups", "reps": "8-10", "load": "bodyweight" },
    { "name": "Farmer carry", "duration": "30 sec", "load": "double 20 kg" }
  ]
}
```

## WorkoutLog

```json
{
  "id": "log_001",
  "date": "2026-06-14",
  "blockId": "block_002",
  "plannedDayType": "kb",
  "actualDayType": "kb",
  "source": "planned",
  "category": "kb",
  "plannedWorkout": "Double KB Strength",
  "actualWorkout": "Double KB Strength",
  "status": "completed",
  "difficulty": "normal",
  "signals": {
    "pressGrindy": false,
    "breathless": false,
    "gripCooked": false,
    "legsSore": false
  },
  "originalNote": "Did 4 rounds felt normal. Swapped shoulder press before squats.",
  "structuredNotes": {
    "roundsCompleted": 4,
    "swap": "press before squats"
  }
}
```

The log records planned vs actual day type and the source so the engine can handle the four planned-vs-actual cases and route off-block work to fatigue without counting it toward the ascension guard.

## DailyContext

```json
{
  "date": "2026-06-14",
  "hoursSlept": 6.0,
  "bodyweight": 78.5,
  "foodNote": "skipped breakfast, large dinner"
}
```

## StatusEffect

```json
{
  "id": "poor_sleep_goblin",
  "name": "Poor Sleep Goblin",
  "source": "User logged 6.0 hours sleep",
  "recommendationEffect": "Block aggressive progression for next workout",
  "expiryType": "after_next_rest_day",
  "expiryParam": null
}
```

```json
{
  "id": "squat_tax",
  "name": "Squat Tax",
  "source": "Legs sore after Saturday barbell",
  "recommendationEffect": "Keep squat volume and load conservative",
  "expiryType": "after_n_days",
  "expiryParam": 3
}
```

## Quest

```json
{
  "id": "survive_baseline",
  "name": "Survive the Baseline",
  "objective": "Complete Double KB Strength at the current tier twice.",
  "progress": { "completedSessions": 1, "requiredSessions": 2 },
  "reward": {
    "item": "Tiny Crown of Baseline Repetition"
  }
}
```

Quest rewards are cosmetic only. No stat bonuses, no currency, no mechanical effects.

## LoreEntry

```json
{
  "id": "lore_001",
  "logId": "log_001",
  "text": "The hero survived the Double-Bell Gate and moved the Press before the Squat Beast. The Council marked this as acceptable behaviour.",
  "generatedAt": "2026-06-14",
  "source": "ai"
}
```

`source` is `"ai"` when generated by the AI scribe, `"deterministic"` when using the Phase 5 templated flavour (offline or AI disabled).

## Item

Cosmetic, humorous, or reflective. Never creates pressure to train more. Unlocked by behaviour, not bought with anything that affects training.

---

# Classes

Funny but mapped to real training tendencies.

## Bellbarian

Focus: swings, cleans, carries, conditioning. Strength: high work capacity, strong hinge. Weakness: may turn every workout into a test.

```text
Bellbarian:
Solves most problems by picking things up aggressively.
```

## Pressomancer

Focus: clean and press, push-ups, overhead strength. Strength: pressing consistency. Weakness: shoulders may file a formal complaint.

```text
Pressomancer:
Believes every problem has an overhead solution.
```

## Squat Squire

Focus: front squats, goblet squats, leg strength. Strength: strong legs, honest suffering. Weakness: stairs.

```text
Squat Squire:
Loyal servant of the kingdom, enemy of chairs.
```

## Recovery Rogue

Focus: mobility, technique, smart swaps, rest-day compliance. Strength: lives to train another day. Weakness: may be accused of maturity.

```text
Recovery Rogue:
Wins by not making tomorrow worse.
```

## Program Warlock

Focus: structured blocks, progression rules, planned swaps. Strength: follows the plan. Weakness: may create a spreadsheet and call it a personality.

```text
Program Warlock:
Casts Repeat Same Workout Until It Works.
```

---

# Zones

Workouts become zones.

## The Double-Bell Gate

Real workout: double clean, double press, double front squat, push-ups, farmer carry. Boss: The Fifth Round. Unlock: after the baseline feels normal enough to progress.

## The Armor Foundry

Real workout: Armor Building Complex, 2 cleans, 1 press, 3 squats. Progression: 10, 12, 15, 20 sets. Boss: The Twenty-Minute Bell Tax.

## The Single-Bell Outpost

Real workout: single-arm clean, single-arm press, goblet squat, one-arm row, push-ups, suitcase carry.

## The Swing Marsh

Real workout: swings, push-ups, conditioning density. Monsters: The Hinge Goblin, The Push-up Bureaucrat, The Breathless Fog.

## The Recovery Inn

Real workout: rest, walking, halos, Turkish get-ups, light carries. Reward: recovery, reduced debuffs, better next-session recommendation.

## The Burpee Bog

Real workout: Modified Meat Eater II, swings plus burpees.

```text
This zone smells like poor choices and floor contact.
```

## The Free Lands (Saturday)

Not a fixed zone. Whatever the user logs on a free day: a run, a hike, pickleball, a barbell session. The activity's source and category decide its effects.

---

# Encounters

Short text cards per exercise.

## Double Clean

```text
You clean the bells.

The bells object, but they have no legal standing.
```

## Double Press

```text
You press the bells overhead.

The ceiling remains unimpressed.
```

## Front Squat

```text
You descend into the Squat Mines.

The quads begin collective bargaining.
```

## Push-ups

```text
You attack the floor.

The floor wins on points but respects the effort.
```

## Farmer Carry

```text
You walk with heavy bells.

A farmer somewhere nods, then asks why you are doing this indoors.
```

## Swings

```text
You swing the bell with suspicious confidence.

The Hinge Goblin retreats.
```

## Rest

```text
You do nothing.

Against all odds, this was productive.
```

---

# Quests

Quests reward repeatable behaviour and judgment.

## Survive the Baseline

Complete the current-tier Double KB Strength workout twice. Reward: unlock progression suggestion, item Tiny Crown of Baseline Repetition.

## Enter the Armor Foundry

Complete 10 ABC sets with double 20s. Reward: unlock 12-set ABC, item Apron of Reasonable Density.

## The Hundred Swings

Complete 100 total swings at 24 kg. Reward: item The 24 kg Problem Solver, unlock weekly swing volume tracking.

## The Push-up Bureaucracy

Complete 100 total push-ups in a workout. Reward: title Floor Correspondent.

## The Good Swap

Swap a workout due to fatigue, sleep, soreness, schedule, or recovery and still complete appropriate training. Reward: +2 Judgment, item Cloak of Not Making It Worse.

## The Wise Regression

Use a lighter bell or lower volume because form would otherwise suffer. Reward: +1 Control, +1 Judgment, item The 16 kg Humility Orb.

---

# Ascension / New Game Plus

Ascension is test-triggered, not calendar-triggered.

The week template runs continuously. A block runs at one baseline tier until the user invokes a test workout (the current baseline at test intensity) in place of a KB day. If the ascension guard is met (at least TEST_GUARD_MIN_SESSIONS completed planned KB sessions at the current tier), a successful test closes the block, banks a Permanent Lesson, and opens the next block at tier N+1. Stats reset; lessons carry over.

If the user tests before the guard is met, the Council declines and nothing changes.

```text
You completed the test at the Double-Bell Gate.

The baseline is consolidated. You may ascend.

Permanent lessons earned:
- Press Before Squat: cleaner pressing in double KB strength
- Repeat Before Increase: no progression until baseline feels normal
- Sleep Is Real: poor sleep blocks aggressive progression

Next block begins one tier heavier.
```

## Permanent Lessons

Not magic powers. User-specific training rules that carry across blocks.

| Lesson | Earned By | Effect |
|---|---|---|
| Press Before Squat | Logging a successful exercise order swap | Suggests this order by default |
| Repeat Before Increase | Repeating baseline successfully | Slows progression recommendations |
| Sleep Is Real | Logging poor sleep and adjusting | Adds sleep warning before hard days |
| No Bonus Burpees | Skipping an unnecessary finisher | Protects recovery |
| Farmer's Patience | Completing carries consistently | Maintains carry work in templates |

## Challenge Paths

After ascension, start the next block with a modifier.

| Path | Rule |
|---|---|
| The Clean Press Path | More emphasis on clean and press |
| The Swing Marsh Path | More conditioning focus |
| The Recovery Rogue Path | Mandatory light day after hard conditioning |
| The Minimalist Path | Only 3 workouts per week |
| The Double-Bell Path | Two double-bell days per week |

---

# Weekly Review as Council Report

The report covers the last 7 calendar days, independent of block length. It is planned vs actual.

```text
Council Report: Last 7 Days

Planned sessions:
- Mon KB, Tue KB, Thu KB, Fri KB
- Sat free, Wed and Sun rest

Actual:
- Double-Bell Gate: completed, breathless last round
- Single-Bell Outpost: mostly 24 kg, 16 kg goblet squats
- Armor Foundry: 10 sets, felt normal
- Swing Marsh: 100 swings at 24 kg, 100 push-ups
- Saturday: 5 km run (off-block conditioning)

Extras and misses:
- Trained Sunday, a planned rest day. Real work, now in the recovery math.
- No missed sessions.

Council Judgment:
The hero has done enough.

Recommendation:
Rest or do light technique. Do not enter the Burpee Bog tomorrow unless you enjoy avoidable consequences.

Progression:
- Double KB Strength may move up a tier if sleep is good and presses are clean.
- ABC may move from 10 to 12 sets.
- Conditioning should repeat before increasing.

Ascension:
- 4 of 6 baseline sessions logged this block. A test is not yet earned.
```

---

# Tone Guide

Dry, not motivational. The app sounds like a strange training clerk, not a motivational poster.

Good:

```text
You completed the workout. The bells remain unemployed.
```

```text
You rested. This confused the goblins but pleased your joints.
```

```text
The Council recommends repeating the same workout, because progress is often boring and deeply offensive.
```

Bad:

```text
Destroy your limits!
Become unstoppable!
No excuses!
```

Absolutely not.

---

# UI Style

Low-fi, text-heavy, simple icons, parchment optional, small absurd item art, minimal animation, readable workout tables.

The UI must not make the workout harder to read. RPG flavour surrounds the workout; it does not obscure it.

```text
[Zone Title]
The Double-Bell Gate

[Real Workout Table]
Double clean        4 x 5
Double press        4 x 3
Double front squat  4 x 5
Push-ups            4 x 8-10
Farmer carry        4 x 30 sec
Rest                90-120 sec

[Start Adventure]
```

Reps, rest, and load are never hidden behind fantasy UI. The workout table is the product. The flavour is the wrapper.

---

# MVP Scope

## Version 0.1: RPG Skin Over Real Log

Include:

- week template and day types
- block with baseline tier
- workout templates with tier definitions
- real workout table
- log actual result with planned vs actual
- difficulty enum and signal flags
- DailyContext: sleep, bodyweight, food note
- status effects with expiry types and most-conservative stacking
- simple stat gains
- completion message
- weekly Council Report (completion summary only)

Exclude:

- currency shop
- stat decay
- ascension
- complex combat
- social features, leaderboards
- random workout generation
- AI-generated programs

## Version 0.2: Quests and Items

Add quest unlocks, cosmetic items, titles, zone names, progression-based achievements.

## Version 0.3: Progression Engine

Add the deterministic rules:

- if easy or normal twice and no blocking flag, suggest progression
- if hard, repeat
- if breathless from poor sleep, repeat
- if skipped, resume without guilt
- if high push-up volume, warn
- if pressing felt grindy, hold pressing volume

This is also where the Council Report begins emitting progression and ascension-guard status.

## Version 0.4: AI Lore Layer

Add natural-language log parsing (map notes to difficulty enum plus signal flags), weekly summaries, progression explanations, recovery warnings. The engine already works without this; the AI is flavour.

## Version 0.5: Ascension and Off-Block Activities

Add test-triggered ascension with the guard, permanent lessons, challenge paths, the off_block and recovery_skill activity classes with deterministic effects, and stat reset on ascension.

## Later, Not MVP: Currency and Decay

Currency (Iron Bits) and stat decay are deferred. Decay, if added, follows strict rules: scheduled rest and deloads never cause it, it begins only after roughly 10 consecutive days of unplanned inactivity, it is slow, it stops as soon as training resumes, and recovery never decays. Framing is detraining, not punishment.

---

# AI Use Cases

AI behaves like a scribe, not a coach with a whistle.

Good AI: natural-language log parsing into structured data, lore generation, weekly report prose.

```text
The Council noticed high push-up volume this week. It recommends not adding more pressing tomorrow, which is rude but correct.
```

Bad AI: generating random workouts, encouraging progression after every good session, fake certainty about recovery, turning training into a content feed, inventing medical advice, guilt-based streak messaging, replacing the deterministic rules with vibes.

---

# What To Avoid

## Avoid Bad Gamification

No guilt streaks, no "train harder" spam, no leaderboards, no punishment for rest, no endless achievements for adding volume, no confetti for bad decisions, no resource budgets that override the program, no random rewards that pull the user off the routine, no stat decay in MVP, no bodyweight or food commentary.

## Avoid Hiding the Workout

Always show exercise, sets and rounds, reps, rest, and load. The RPG layer is seasoning, not the meal.

---

# Key Design Principle

The fantasy layer should reward training judgment, not just training volume.

A good decision might be repeating the same workout, using the 16 kg bell, skipping a finisher, taking a rest day, reducing volume after poor sleep, keeping ABC at 10 sets because the press was slow, or avoiding hard conditioning after 100 push-ups. The app makes those choices feel like progress.

---

# Final Take

Bellbound is the same engine as BellLog with zones, quests, items, character stats, funny logs, recovery mechanics, and test-bounded blocks. The week template matches a real fixed routine, drift is treated as data, and the off-block activities the user actually does are acknowledged as real work without becoming a slot machine.

The important part is not the jokes. The important part is that the game mechanics reinforce the boring things that make training work.

The strongest character is the one who repeats the baseline workout and goes to bed.
