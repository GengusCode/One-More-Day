# ONE MORE DAY v0.8 Phone-Theft Chase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Replace the tap chase with a tense, fair, original 20–30 second three-lane runner that works with touch, keyboard, visible controls, reduced motion, pausing, and a non-canvas fallback.

**Architecture:** Deterministic generation and chase rules remain pure and testable; a canvas adapter only draws snapshots and translates controls. The life simulator awaits one Promise result and applies money/stat consequences exactly once after win or loss.

**Tech Stack:** HTML Canvas 2D, Pointer/Touch and Keyboard Events, requestAnimationFrame, Page Visibility API, browser ES modules, Node assertion tests.

**Spec:** docs/superpowers/specs/2026-09-29-sa-edition-systems-design.md

## Global Constraints

- Complete the foundation and life/economy plans before integrating the chase.
- Target 25 seconds and accept 20–30 seconds through configuration.
- Generate 6–8 original obstacles and preserve at least one reachable safe lane at every decision point.
- A valid input moves one lane; queue at most one input during transition.
- One collision loses immediately; timer survival wins and triggers a short catch animation.
- Resolve life-game effects only after one final chase result.
- Do not copy Subway Surfers art, audio, code, layout, characters, branding, or obstacle sequences.
- The same hitbox, speed, and difficulty apply to every selected gender.

## Review Focus

- A narrow viewport or high device-pixel ratio must not create an oversized canvas or altered hitboxes; pin this in Task 3.
- Rapid opposite swipes during a transition must queue at most one legal lane change; pin this in Task 2.
- Hiding and returning to the tab must pause time, then show a three-second countdown without skipping obstacles; pin this in Task 4.
- Every generated seed in a large sample must remain solvable under the same movement timing used by gameplay; pin this in Task 1.
- Promise completion, collision, timeout, and reload must never award or remove the phone twice; pin this in Task 5.

---

## File Map

- Create js/minigames/chase-generator.js: seeded obstacle sequence and reachability checks.
- Create js/minigames/chase-model.js: pure lanes, transitions, timer, collision, distance, win, and loss.
- Create js/minigames/chase-runner.js: canvas lifecycle, controls, rendering, pause/resume, and fallback.
- Create tests/chase-generator-test.mjs: generation, state-machine, and single-result tests.
- Modify js/app.js and js/ui/render.js: launch and resolve the minigame.
- Modify v08-sa-edition.css: chase overlay and responsive controls.

### Task 1: Generate deterministic reachable obstacle sequences

**Files:**
- Create: js/minigames/chase-generator.js
- Create: tests/chase-generator-test.mjs

**Interfaces:**
- Produces: createSeededRandom(seed); createObstacleSequence({ seed, durationMs, minObstacles, maxObstacles, laneChangeMs }); getSafeLanes(sequence, timeMs); isSequenceReachable(sequence, config).
- Obstacle entries contain id, type, lane, startMs, clearMs, and visualVariant.

- [ ] **Step 1: Write failing generator tests**

  Assert identical seeds produce identical sequences; 1,000 seeds each contain 6–8 obstacles; types come only from pothole, crate, trolley, pedestrian, parked-taxi, and roadworks; timestamps increase; no sequence places all reachable lanes in collision during a legal transition.

- [ ] **Step 2: Run the generator test**

  Run: node tests/chase-generator-test.mjs
  Expected: FAIL because chase-generator.js does not exist.

- [ ] **Step 3: Implement seeded generation**

  Use a small documented integer PRNG. Choose obstacle windows far enough apart for one lane move, then reject and regenerate any placement that removes every reachable lane.

- [ ] **Step 4: Implement reachability simulation**

  Starting from centre lane, carry the set of possible safe lanes through every obstacle window using laneChangeMs; return false if the set becomes empty.

- [ ] **Step 5: Run the generator tests**

  Run: node tests/chase-generator-test.mjs
  Expected: PASS for determinism, counts, themes, timing, and all 1,000 solvability seeds.

- [ ] **Step 6: Commit**

  Commit: feat: generate fair three-lane chase courses

### Task 2: Implement the pure chase state machine

**Files:**
- Create: js/minigames/chase-model.js
- Modify: tests/chase-generator-test.mjs

**Interfaces:**
- Consumes: obstacle sequence from Task 1.
- Produces: createChaseModel(config); requestLaneMove(model, direction); advanceChase(model, deltaMs); getChaseSnapshot(model).
- Snapshot exposes phase, lane, laneProgress, elapsedMs, distance, activeObstacles, result, and queuedDirection.

- [ ] **Step 1: Add failing state-machine tests**

  Assert left/right and A/D semantics move one lane; edge moves are ignored; one input queues during transition; a third rapid input is ignored; collision resolves escaped immediately; reaching duration resolves caught; subsequent advance or input cannot change a final result.

- [ ] **Step 2: Run the chase test**

  Run: node tests/chase-generator-test.mjs
  Expected: FAIL because chase-model.js is absent.

- [ ] **Step 3: Implement lane movement**

  Keep lane as 0, 1, or 2; use time-based interpolation; consume one queued direction only after the active transition ends.

- [ ] **Step 4: Implement collision and completion**

  Compare the fixed player hitbox with obstacle time/lane windows; collision wins precedence over timeout in the same frame; set exactly one immutable result.

- [ ] **Step 5: Implement distance feedback**

  Derive distance from elapsed time so the thief remains ahead until the final catch phase; do not make visual gender affect model geometry.

- [ ] **Step 6: Run the tests**

  Run: node tests/chase-generator-test.mjs
  Expected: PASS for controls, queueing, edge lanes, collision, survival, and result immutability.

- [ ] **Step 7: Commit**

  Commit: feat: add deterministic chase rules

### Task 3: Render the responsive runner and controls

**Files:**
- Create: js/minigames/chase-runner.js
- Modify: js/ui/render.js
- Modify: v08-sa-edition.css
- Modify: tests/chase-generator-test.mjs

**Interfaces:**
- Consumes: createObstacleSequence(), createChaseModel(), and profile gender/pronouns.
- Produces: start(config) returning Promise<{ outcome: caught | escaped, reason, seed, elapsedMs }>.
- start config contains host, seed, profile, durationMs, reducedMotion, and optional clock.

- [ ] **Step 1: Add failing runner contract tests**

  Assert chase-runner exports start; its canvas backing width and height cap device pixel ratio at 2; resize changes drawing scale but not model hitboxes; control mapping includes swipe, ArrowLeft/ArrowRight, A/D, and two visible 44px lane buttons.

- [ ] **Step 2: Run the chase test**

  Run: node tests/chase-generator-test.mjs
  Expected: FAIL on missing runner contract.

- [ ] **Step 3: Implement the overlay lifecycle**

  Create one modal overlay with heading, instructions, distance meter, canvas description, left/right buttons, and cleanup for every listener and animation frame.

- [ ] **Step 4: Draw original South African street visuals**

  Use simple original shapes for road perspective, lane markers, roadside colour, thief, player, and six obstacle types. Gender changes clothing/hair silhouette only, never geometry.

- [ ] **Step 5: Implement control adapters**

  Treat a horizontal pointer delta above one threshold as one swipe; prevent scrolling only while an accepted chase gesture is active; route keyboard and buttons through requestLaneMove().

- [ ] **Step 6: Add caught and escaped endings**

  On survival, briefly close the visual gap and show the catch pose; on collision, show impact and escape. Resolve the Promise after the short ending, once.

- [ ] **Step 7: Run automated and manual checks**

  Run: node tests/chase-generator-test.mjs
  Expected: PASS.
  Manually verify phone portrait, landscape, desktop keyboard, lane buttons, resize, and three gender appearances.

- [ ] **Step 8: Commit**

  Commit: feat: render the phone-theft runner

### Task 4: Add pause, reduced motion, and fallback

**Files:**
- Modify: js/minigames/chase-runner.js
- Modify: v08-sa-edition.css
- Modify: tests/chase-generator-test.mjs

**Interfaces:**
- Consumes: the runner lifecycle from Task 3.
- Produces: visibility pause/resume, three-second countdown, reduced-motion rendering, and a lane-prompt fallback using the same sequence.

- [ ] **Step 1: Add failing lifecycle tests**

  With a fake clock, assert hidden time does not advance; returning counts 3, 2, 1 before gameplay; repeated visibility events do not add loops; reduced motion disables shake/fast scenery without changing obstacle times; missing canvas context selects fallback mode.

- [ ] **Step 2: Run the chase test**

  Run: node tests/chase-generator-test.mjs
  Expected: FAIL on pause and fallback cases.

- [ ] **Step 3: Implement visibility pause**

  Stop animation scheduling on hidden, remember model time, and resume only after the visible countdown; remove the visibility listener during cleanup.

- [ ] **Step 4: Implement reduced motion**

  Retain lane interpolation and challenge timing while removing camera shake, rapid roadside layers, and flashing; expose the same text result.

- [ ] **Step 5: Implement the lane-prompt fallback**

  Present the next obstacle and three lane buttons, advance through the exact deterministic sequence, apply the same safe-lane and one-collision rules, and return the standard result object.

- [ ] **Step 6: Run the tests**

  Run: node tests/chase-generator-test.mjs
  Expected: PASS for hidden time, countdown, reduced motion, fallback, and listener cleanup.

- [ ] **Step 7: Commit**

  Commit: feat: make the chase resilient and accessible

### Task 5: Integrate the chase with the saved day

**Files:**
- Modify: js/app.js
- Modify: js/systems/day.js
- Modify: js/data/events.js
- Modify: js/ui/render.js
- Modify: tests/chase-generator-test.mjs
- Modify: tests/v08-foundation-test.mjs

**Interfaces:**
- Consumes: start(config) and the day phase state machine.
- Produces: beginMinigame(state, eventId); resolveMinigame(state, result); persisted dailyState.chase with seed, status, and resolutionId.

- [ ] **Step 1: Add failing integration tests**

  Assert the theft event stores its seed before launch; Next Day stays disabled; reload resumes the same unresolved sequence; caught and escaped produce one final event result; calling resolve twice is idempotent; no cash/stat change occurs before result.

- [ ] **Step 2: Run integration tests**

  Run: node tests/chase-generator-test.mjs && node tests/v08-foundation-test.mjs
  Expected: FAIL until app and day integration exist.

- [ ] **Step 3: Add the theft event callback**

  Mark daily phase minigame, save seed and unresolved status, then launch start() only after the save succeeds.

- [ ] **Step 4: Resolve the result atomically**

  Convert the final result into one day-system action keyed by resolutionId, apply effects, append the result log, clear active minigame, save, and unlock the remaining day flow.

- [ ] **Step 5: Verify every input method**

  Run: node tests/state-migration-test.mjs && node tests/event-deck-test.mjs && node tests/travel-business-test.mjs && node tests/chase-generator-test.mjs && node tests/v08-foundation-test.mjs
  Expected: all PASS.

- [ ] **Step 6: Complete the manual chase matrix**

  Win and lose with swipe, keyboard, and buttons; switch tabs mid-run; resize; test reduced motion; force fallback; reload before and after resolution; confirm no duplicate outcome.

- [ ] **Step 7: Commit**

  Commit: feat: integrate the phone-theft chase
