# ONE MORE DAY v0.8 Integration and Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Finish the licensed SA Edition presentation, prove the complete game works across saves and screen sizes, replace the v0.7 production entry point safely, and verify the deployed GitHub Pages release.

**Architecture:** The completed v0.8 preview becomes the production index only after content, accessibility, responsive, migration, and full-flow tests pass. Legacy files remain in repository history, while production loads only the v0.8 module graph and stylesheet.

**Tech Stack:** Static HTML/CSS/ES modules, Canvas 2D, localStorage, WebP asset, Node assertion tests, GitHub Pages.

**Spec:** docs/superpowers/specs/2026-09-29-sa-edition-systems-design.md

## Global Constraints

- Complete the foundation, life/economy, and chase plans first.
- Use a locally stored web-optimised derivative of SouthAfricanMinibus.jpg by Martinvl under CC BY-SA 4.0.
- Include source, author, license link, and modification note in assets/credits.md and README.md.
- Do not label the cover with a city; use the Quantum, subtle flag treatment, and small SA EDITION mark.
- Keep ONE MORE DAY dominant and provide a still state under prefers-reduced-motion.
- Do not publish until all automated checks pass, the manual checklist has no blocker, the console is clean, and the deployed page is opened after release.
- Preserve the legacy save key and confirm migration on the deployed origin.

## Review Focus

- The production page must not reference a missing preview path, old v07 script, or local-only asset; pin this in Task 4.
- The cover image must retain readable contrast and correct attribution even if image loading fails; pin this in Tasks 1 and 2.
- Long names, four-digit-plus rand values, 200% zoom, and 320 px width must not clip controls or create horizontal scroll; pin this in Task 2.
- A stale service/browser cache loading mixed v0.7/v0.8 files must fail visibly and recover after refresh, not corrupt the save; pin this in Task 4.
- Deployment must be verified from the public GitHub Pages URL, including one migrated save and one completed chase; pin this in Task 5.

---

## File Map

- Create assets/cover/south-african-minibus.webp: licensed, cropped, web-optimised cover asset.
- Create assets/credits.md: attribution and modification record.
- Modify v08-sa-edition.css: final cover, motion, responsive, and accessibility polish.
- Modify v08-preview.html and later index.html: final metadata and production structure.
- Create tests/v08-smoke-test.mjs: whole-project structural and deterministic flow checks.
- Modify README.md and TESTER_CHECKLIST.md.
- Remove v08-preview.html only after index.html becomes the tested v0.8 entry point.

### Task 1: Add and document the licensed cover asset

**Files:**
- Create: assets/cover/south-african-minibus.webp
- Create: assets/credits.md
- Modify: README.md
- Create: tests/v08-smoke-test.mjs

**Interfaces:**
- Consumes: SouthAfricanMinibus.jpg source page and CC BY-SA 4.0 terms.
- Produces: a local WebP asset plus machine-checkable credit containing title, Martinvl, source URL, CC BY-SA 4.0 URL, and crop/colour-treatment note.

- [ ] **Step 1: Write the failing attribution test**

  Assert the asset exists and is non-empty; credits and README contain the exact source title, author Martinvl, Wikimedia Commons source URL, CC BY-SA 4.0 license URL, and a modifications statement.

- [ ] **Step 2: Run the smoke test**

  Run: node tests/v08-smoke-test.mjs
  Expected: FAIL because the asset and credit do not exist.

- [ ] **Step 3: Acquire the original from its authoritative source**

  Download only from the Wikimedia Commons file page recorded in the design. Preserve the original separately outside production if needed for editing.

- [ ] **Step 4: Create the web derivative**

  Crop for phone portrait with the Toyota Quantum identifiable, apply only the documented colour/contrast treatment, export WebP at a practical mobile size, and verify the final file is substantially smaller than the 6 MB source.

- [ ] **Step 5: Write attribution**

  Record “SouthAfricanMinibus.jpg,” Martinvl, 8 November 2016, source link, CC BY-SA 4.0 link, and that the game crop was resized and colour/contrast adjusted.

- [ ] **Step 6: Run the smoke test**

  Run: node tests/v08-smoke-test.mjs
  Expected: PASS for local asset and complete attribution.

- [ ] **Step 7: Commit**

  Commit: assets: add licensed Toyota Quantum cover

### Task 2: Finish the cover and responsive visual system

**Files:**
- Modify: v08-preview.html
- Modify: v08-sa-edition.css
- Modify: js/ui/render.js
- Modify: tests/v08-smoke-test.mjs

**Interfaces:**
- Consumes: the local cover asset and renderer views.
- Produces: cover with animated ONE MORE DAY, small SA EDITION, subtle flag treatment, readable fallback, and full 320–1,440 px fit.

- [ ] **Step 1: Add failing production-style assertions**

  Assert the cover references only the local WebP; has meaningful image alternative or adjacent accessible description; contains no city name; ONE MORE DAY precedes SA EDITION in hierarchy; CSS has a dark readability gradient and reduced-motion override.

- [ ] **Step 2: Run the smoke test**

  Run: node tests/v08-smoke-test.mjs
  Expected: FAIL until cover markup and styles are complete.

- [ ] **Step 3: Implement the cover composition**

  Keep the Quantum visible, use restrained flag-colour accents, animate title entrance and subtle highlight, and provide a designed still state when motion is reduced.

- [ ] **Step 4: Complete overflow and zoom hardening**

  Audit every grid/flex child for min-width: 0; currency and long names for wrapping; modals for 100dvh internal scrolling; safe areas; 44px targets; canvas containment; and 200% zoom.

- [ ] **Step 5: Verify responsive states manually**

  Test 320, 360, 390, 768, and 1,440 px widths; portrait and landscape; long 24-character name; cash above R1,000,000; every expander; follow-up sheet; chase overlay; and browser 200% zoom.

- [ ] **Step 6: Run the smoke test**

  Run: node tests/v08-smoke-test.mjs
  Expected: PASS for cover, reduced motion, local assets, and structural fit rules.

- [ ] **Step 7: Commit**

  Commit: style: finish the SA Edition presentation

### Task 3: Complete accessibility and failure recovery

**Files:**
- Modify: js/app.js
- Modify: js/ui/render.js
- Modify: js/minigames/chase-runner.js
- Modify: v08-sa-edition.css
- Modify: tests/v08-smoke-test.mjs

**Interfaces:**
- Consumes: all completed views and system actions.
- Produces: keyboard-complete interaction, visible focus, live results, accurate expander state, descriptive chase alternative, and one recoverable error surface.

- [ ] **Step 1: Add failing accessibility contracts**

  Assert every control has text or accessible name; expanders pair aria-expanded with existing region IDs; result messages have a polite live region; errors have an alert role; canvas has description and fallback controls; actions expose disabled state while committing.

- [ ] **Step 2: Run the smoke test**

  Run: node tests/v08-smoke-test.mjs
  Expected: FAIL on any missing contract.

- [ ] **Step 3: Implement focus and announcement flow**

  After setup move focus to today’s heading; after first-stage choice move to follow-up heading; after resolution announce text plus numeric change; after modal close return focus to its launcher.

- [ ] **Step 4: Implement recoverable failures**

  Catch save, render, event eligibility, and minigame startup failures; show one plain-language message; log technical detail to console; safely close invalid migrated events and append a day-log note.

- [ ] **Step 5: Perform keyboard and assistive-state checks**

  Complete setup, a two-stage event, all expanders, a transport decision, Next Day, and the chase fallback without pointer input.

- [ ] **Step 6: Run all automated checks**

  Run: node tests/state-migration-test.mjs && node tests/event-deck-test.mjs && node tests/travel-business-test.mjs && node tests/chase-generator-test.mjs && node tests/v08-foundation-test.mjs && node tests/v08-smoke-test.mjs
  Expected: all PASS.

- [ ] **Step 7: Commit**

  Commit: fix: harden accessibility and recovery

### Task 4: Promote v0.8 to the production entry point

**Files:**
- Modify: index.html
- Delete: v08-preview.html
- Modify: tests/syntax-check.mjs
- Modify: tests/v08-foundation-test.mjs
- Modify: tests/v08-smoke-test.mjs
- Modify: README.md

**Interfaces:**
- Consumes: the fully tested preview document and v0.8 module graph.
- Produces: index.html loading v08-sa-edition.css and js/app.js as a module with no v07 runtime dependency.

- [ ] **Step 1: Add failing cutover assertions**

  Assert index.html references js/app.js with type=module and v08-sa-edition.css; every referenced local file exists; no reference remains to js/life-game.js, js/game-systems.js, or v07-playful.css; all static module imports resolve.

- [ ] **Step 2: Run the smoke test before cutover**

  Run: node tests/v08-smoke-test.mjs
  Expected: FAIL because index.html still points to v0.7.

- [ ] **Step 3: Replace index.html with the tested preview structure**

  Preserve production metadata, move the v0.8 document to index.html, add a version marker for mixed-cache diagnosis, and remove the obsolete preview file.

- [ ] **Step 4: Update the syntax check**

  Parse every production ES module through Node syntax validation instead of compiling only js/life-game.js.

- [ ] **Step 5: Add mixed-version recovery**

  If the version marker and loaded schema/module version disagree, show a refresh message before state mutation. Never downgrade or overwrite a valid v8 save.

- [ ] **Step 6: Run the complete automated suite**

  Run: node tests/syntax-check.mjs && node tests/v07-systems-test.mjs && node tests/state-migration-test.mjs && node tests/event-deck-test.mjs && node tests/travel-business-test.mjs && node tests/chase-generator-test.mjs && node tests/v08-foundation-test.mjs && node tests/v08-smoke-test.mjs
  Expected: all PASS; the v07 systems test remains a historical regression check and does not imply production loading.

- [ ] **Step 7: Commit**

  Commit: feat: make v8 the production game

### Task 5: Complete playtest, documentation, and deployment

**Files:**
- Modify: README.md
- Modify: TESTER_CHECKLIST.md
- Modify: docs/superpowers/specs/2026-09-29-sa-edition-systems-design.md

**Interfaces:**
- Consumes: production index and every automated/manual acceptance criterion.
- Produces: documented v0.8 release, completed tester checklist, and verified GitHub Pages URL.

- [ ] **Step 1: Update player and contributor documentation**

  Describe v0.8 features, local static-server use, browser save behaviour, reset/recovery, project module map, cover credit, and GitHub Pages publishing. Remove obsolete v0.1-only structure claims.

- [ ] **Step 2: Replace the tester checklist**

  Include all twelve manual checks from section 14 of the spec plus console cleanliness, cover attribution, 320 px fit, 200% zoom, and deployed-save migration.

- [ ] **Step 3: Run the release suite**

  Run every test command from Task 4.
  Expected: all PASS with no warning treated as ignored.

- [ ] **Step 4: Execute the full manual matrix locally**

  Start each gender; play 14 days; trigger each transport disruption; buy assets once; assign car; test three Stay Home roles; promote/warn/dismiss; grow and close/restart startups; win/lose/pause/reload chase; inspect console; test all target widths and zoom.

- [ ] **Step 5: Record spec completion**

  Change spec status to Implemented and tested only after every automated and manual release gate passes; note any intentionally deferred non-blocker in README.

- [ ] **Step 6: Commit and push the release**

  Commit: release: publish ONE MORE DAY v0.8 SA Edition
  Push main and wait for the GitHub Pages deployment workflow to succeed.

- [ ] **Step 7: Verify the public site**

  Open https://genguscode.github.io/One-More-Day/ in a fresh session; confirm the v0.8 marker, cover image, start flow, one migrated save, one completed decision, one completed chase, reload persistence, responsive fit, asset loading, attribution link, and clean console.

- [ ] **Step 8: Record the deployed revision**

  Add the release commit ID and verification date to README or release notes, then report the public URL and any known non-blocking limitation.
