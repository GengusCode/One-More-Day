# ONE MORE DAY v0.8 Foundation and Interface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Establish save schema v8, safe legacy migration, character setup, a compact playable preview shell, and observable money feedback without replacing the live v0.7 entry point.

**Architecture:** Pure ES modules own state and balance data; a small app orchestrator connects them to semantic HTML through one renderer. Work is developed behind v08-preview.html so index.html and the published v0.7 game remain usable until the release plan performs the cutover.

**Tech Stack:** HTML5, CSS, browser ES modules, localStorage, Node built-in test runner primitives, GitHub Pages.

**Spec:** docs/superpowers/specs/2026-09-29-sa-edition-systems-design.md

## Global Constraints

- Keep the project static: no build step, framework, account, server, or package install.
- Store v8 under one-more-day-v08 and leave the legacy one-more-day-v06 value untouched.
- Preserve recognised legacy name, day, age, cash, stats, relationships, active path, progress, and upgrades.
- Gender changes pronouns and avatar presentation only; it never changes stats, odds, pay, or difficulty.
- Names are 2–24 visible characters after trimming and may contain Unicode letters, spaces, apostrophes, and hyphens.
- All cash changes pass through one state action and produce ordered transaction records.
- Keep index.html on v0.7 throughout this plan.

## Review Focus

- A corrupt legacy JSON string must be backed up and produce a recoverable start state; pin this in Task 2.
- Reloading an already-settled transaction must not pay or charge it twice; pin this in Task 2.
- Names containing accents, apostrophes, or hyphens must validate and render as text, while markup-like input must never execute; pin this in Tasks 1 and 4.
- A v6/v7 save with missing nested objects must migrate without throwing or replacing valid values; pin this in Task 2.
- Rapid consecutive cash changes must remain ordered and visible instead of overlapping; pin this in Task 5.

---

## File Map

- Create js/data/economy.js: frozen v0.8 balance constants and rand formatting.
- Create js/core/state.js: canonical state, validation, effects, persistence, migration, and transaction IDs.
- Create js/ui/render.js: semantic rendering and delegated actions for the preview shell.
- Create js/ui/money-feedback.js: sequential cash animation queue.
- Create js/app.js: startup, dispatch, save, and render orchestration.
- Create v08-preview.html: non-public development entry point.
- Create v08-sa-edition.css: compact mobile-first shell styles.
- Create tests/state-migration-test.mjs: schema, validation, migration, and persistence checks.
- Create tests/v08-foundation-test.mjs: static module and preview contract checks.
- Modify index.html only in the later release plan.

### Task 1: Define economy data and canonical state

**Files:**
- Create: js/data/economy.js
- Create: js/core/state.js
- Create: tests/state-migration-test.mjs

**Interfaces:**
- Produces: ECONOMY; SAVE_KEY_V8; LEGACY_SAVE_KEYS; createDefaultState(); validateName(input); createNewLife(profile); applyEffects(state, effects, meta).
- createNewLife accepts an object with name and gender and returns schemaVersion 8 state.
- applyEffects returns an object containing the next state and a transactions array.

- [ ] **Step 1: Write the failing default-state and name tests**

  Assert schemaVersion is 8; all thirteen top-level domains exist; stats start identically for man, woman, and non-binary; “  Nthabiseng-O’Neil  ” normalises successfully; one-character, 25-character, and markup-like names fail with a visible reason.

- [ ] **Step 2: Run the test and confirm the module is missing**

  Run: node tests/state-migration-test.mjs
  Expected: FAIL because js/core/state.js does not exist.

- [ ] **Step 3: Implement economy.js**

  Export a frozen ECONOMY object containing every exact transport, absence, car-value, and repair value from sections 6 and 7 of the spec, plus formatRand(amount).

- [ ] **Step 4: Implement the state factory and profile validation**

  createDefaultState returns fresh arrays and objects on every call. createNewLife maps the three genders to he/him, she/her, and they/them pronouns without changing any numeric default.

- [ ] **Step 5: Implement applyEffects**

  Clamp 0–100 stats, update cash through a transaction with a stable monotonic ID, recompute net worth once, and return a new state without mutating the input.

- [ ] **Step 6: Run the state tests**

  Run: node tests/state-migration-test.mjs
  Expected: PASS for defaults, gender parity, name validation, clamping, and one cash transaction.

- [ ] **Step 7: Commit**

  Commit: feat: add v8 state and economy foundations

### Task 2: Add persistence and safe migration

**Files:**
- Modify: js/core/state.js
- Modify: tests/state-migration-test.mjs

**Interfaces:**
- Consumes: createDefaultState() and applyEffects() from Task 1.
- Produces: migrateLegacyState(candidate); validateState(candidate); loadGame(storage); saveGame(state, storage).
- loadGame returns { state, status, recoveryMessage } where status is new, loaded, migrated, or corrupt.

- [ ] **Step 1: Add failing migration fixtures**

  Test a valid v8 save, representative one-more-day-v06 save, partial save with missing domains, corrupt JSON, unknown fields, duplicated upgrade IDs, and an unresolved daily transaction reloaded twice.

- [ ] **Step 2: Run the tests and verify the new cases fail**

  Run: node tests/state-migration-test.mjs
  Expected: FAIL because persistence exports are absent.

- [ ] **Step 3: Implement validation and normalisation**

  Copy only recognised fields into createDefaultState(); clamp ranges; deduplicate upgrade IDs; normalise event arrays; retain valid legacy progress; ignore unknown fields.

- [ ] **Step 4: Implement loadGame**

  Read one-more-day-v08 first, then one-more-day-v06. Parse in a guarded block. On corrupt input, copy the original string to one-more-day-v08-corrupt-backup and return a fresh state plus a friendly recovery message.

- [ ] **Step 5: Implement saveGame**

  Validate before writing v8. Persist transaction and daily settlement IDs so repeated loading cannot duplicate a cash effect. Never modify or delete one-more-day-v06.

- [ ] **Step 6: Run the migration suite**

  Run: node tests/state-migration-test.mjs
  Expected: PASS for all v8, legacy, partial, corrupt, and idempotency fixtures.

- [ ] **Step 7: Commit**

  Commit: feat: migrate legacy saves safely to schema v8

### Task 3: Build the character setup preview

**Files:**
- Create: v08-preview.html
- Create: js/app.js
- Create: js/ui/render.js
- Create: tests/v08-foundation-test.mjs

**Interfaces:**
- Consumes: loadGame(), saveGame(), validateName(), and createNewLife().
- Produces: createRenderer({ root, dispatch }) returning { render(state), announce(message), openPanel(id), destroy() }; app dispatch actions START_LIFE, CONTINUE_LIFE, RESET_LIFE.

- [ ] **Step 1: Write the failing preview contract test**

  Assert v08-preview.html has one app root, a module script for js/app.js, name input help, three gender choices, Start Life, Continue, and an aria-live status region; assert app.js imports state and renderer modules.

- [ ] **Step 2: Run the contract test**

  Run: node tests/v08-foundation-test.mjs
  Expected: FAIL because the preview and UI modules do not exist.

- [ ] **Step 3: Create the semantic preview document**

  Keep the static document minimal: skip link, main app root, no inline handlers, module entry, viewport-fit cover, and theme colour.

- [ ] **Step 4: Implement the renderer setup view**

  Render name with DOM text properties, gender radio-style buttons, validation help, Start Life, and Continue only when loadGame reports saved progress. Start remains disabled until both name and gender validate.

- [ ] **Step 5: Implement app orchestration**

  Use one delegated dispatch path; disable an action while it saves; show a recoverable error message on failure; render the new profile and save once.

- [ ] **Step 6: Run the foundation tests**

  Run: node tests/state-migration-test.mjs && node tests/v08-foundation-test.mjs
  Expected: PASS with no reference to the legacy global GameSystems.

- [ ] **Step 7: Manually open v08-preview.html through a static server**

  Verify each gender starts with identical stats, Unicode names display literally, Continue restores the life, and index.html still launches v0.7.

- [ ] **Step 8: Commit**

  Commit: feat: add v8 character setup preview

### Task 4: Add the compact game shell

**Files:**
- Modify: js/ui/render.js
- Modify: v08-preview.html
- Create: v08-sa-edition.css
- Modify: tests/v08-foundation-test.mjs

**Interfaces:**
- Consumes: canonical state from Task 1.
- Produces: renderer views setup, game, recovery; expandable panels profile, wellbeing, career-business, relationships, transport-assets; HUD day, age, cash, energy.

- [ ] **Step 1: Add failing shell assertions**

  Assert the default game view exposes only day, age, cash, energy, today’s event slot, and primary action; each secondary section uses a button with aria-expanded and a controlled region; CSS contains min-width: 0, safe-area insets, 100dvh, 44px controls, and overflow protection.

- [ ] **Step 2: Run the foundation test**

  Run: node tests/v08-foundation-test.mjs
  Expected: FAIL on missing shell contracts.

- [ ] **Step 3: Implement game-shell rendering**

  Preserve panel-open state across renders, allow one panel to auto-open after a relevant effect, and keep required choices above optional panels.

- [ ] **Step 4: Implement the mobile-first CSS**

  Support 320–1,440 px without horizontal scroll; cap reading width; use minmax(0, 1fr); wrap long names and currency; give focus, pressed, disabled, and error states equal visual weight to hover.

- [ ] **Step 5: Run automated and manual checks**

  Run: node tests/v08-foundation-test.mjs
  Expected: PASS.
  Manually verify 320 px portrait, phone landscape, desktop, keyboard focus, and 200% zoom.

- [ ] **Step 6: Commit**

  Commit: feat: add compact responsive v8 shell

### Task 5: Add ordered money feedback

**Files:**
- Create: js/ui/money-feedback.js
- Modify: js/ui/render.js
- Modify: js/app.js
- Modify: v08-sa-edition.css
- Modify: tests/v08-foundation-test.mjs

**Interfaces:**
- Consumes: applyEffects() transaction objects with id, amount, balance, and source.
- Produces: createMoneyFeedback({ host, balanceNode, reducedMotion }) returning { enqueue(transaction), clear(), destroy() }.

- [ ] **Step 1: Add a failing queue test**

  With three transaction IDs enqueued rapidly, assert delivery order is unchanged, duplicate IDs are ignored, positive and negative labels use the correct sign, and reduced motion settles immediately without dropping the announcement.

- [ ] **Step 2: Run the foundation test**

  Run: node tests/v08-foundation-test.mjs
  Expected: FAIL because money-feedback.js is absent.

- [ ] **Step 3: Implement the transaction queue**

  Display each item for 700–1,000 ms, announce text, then scale the settled balance. Use green for gains and warm red for losses, but retain plus/minus text.

- [ ] **Step 4: Connect renderer and app**

  Compare rendered transaction IDs, enqueue unseen items only, update net worth from state once per transaction, and clear timers on destroy.

- [ ] **Step 5: Verify the queue**

  Run: node tests/state-migration-test.mjs && node tests/v08-foundation-test.mjs
  Expected: PASS, including ordered rapid changes and duplicate suppression.

- [ ] **Step 6: Commit**

  Commit: feat: animate ordered cash changes

### Task 6: Foundation review gate

**Files:**
- Modify: tests/v08-foundation-test.mjs
- Modify: README.md

**Interfaces:**
- Consumes: all Task 1–5 exports.
- Produces: a documented v0.8 preview route ready for the life-systems plan.

- [ ] **Step 1: Add the preview smoke test**

  Assert every local module and stylesheet referenced by v08-preview.html exists, every import resolves, schemaVersion remains 8, and index.html still references v07-playful.css and js/life-game.js.

- [ ] **Step 2: Run all existing and new tests**

  Run: node tests/syntax-check.mjs && node tests/v07-systems-test.mjs && node tests/state-migration-test.mjs && node tests/v08-foundation-test.mjs
  Expected: all PASS.

- [ ] **Step 3: Document the preview**

  Add an unreleased v0.8 section to README explaining how to open v08-preview.html without presenting it as the production game.

- [ ] **Step 4: Perform the plan acceptance check**

  Confirm new life, migration, reload, recovery, compact panels, money feedback, keyboard control, 320 px fit, and unchanged v0.7 entry point.

- [ ] **Step 5: Commit**

  Commit: test: verify v8 foundation preview
