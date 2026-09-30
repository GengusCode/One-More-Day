# ONE MORE DAY v0.9 — LIFE BEGINS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a phone-first v0.9 life arc in which new lives finish school, enter adult life, meet a generated starting circle, age, fast-forward safely, and can reach a respectful ending.

**Architecture:** Preserve v0.8 domain systems and move new life-cycle rules into dedicated life, people, jobs, and timeline modules. The renderer becomes a thin composition layer: the main screen shows one current decision and a phone sheet exposes existing and new management actions. State validation owns schema-9 defaults and v0.8 migration.

**Tech Stack:** Static HTML, CSS, ES modules, browser localStorage, Node assertion tests.

**Spec:** `docs/superpowers/specs/2026-09-30-life-begins-v09-design.md`

## Global Constraints

- Build on v0.8; preserve stable career, business, transport, relationships, daily events, chase, saves, and responsive support unless compatibility requires a change.
- Advance the page marker to `0.9` and the save schema to `9`; schema-8 saves migrate directly to adult life without replaying school.
- Keep the active play screen limited to compact life context, one current decision, contextual continuation, and a Phone control.
- Phone apps are Jobs, Transport, Business, People, Life, and Time; they show concise cards, not permanent dashboards.
- New lives begin at age 18 in `school-finale`; week and month skips stop at high-impact events.
- Honour `prefers-reduced-motion`, visible focus, keyboard access, and a 320px minimum layout.
- No full education ladder, province migration, open-world map, unlimited job marketplace, or full dynamic NPC simulation.
- Retain all current v0.8 test coverage and add behavioral tests before production changes.

## Review Focus

- A v0.8 save with an active business migrates once, keeps its assets/cash, and never enters school (`v09-life-state-test.mjs`).
- An invalid generated NPC record becomes a safe relationship entry rather than breaking a load (`v09-people-test.mjs`).
- An active employed player cannot repeatedly apply through the Jobs app (`v09-school-jobs-test.mjs`).
- A month skip never duplicates wages, business revenue, driver income, or a delayed event (`v09-timeline-test.mjs`).
- A life that has ended rejects normal day advancement and fast-forward actions (`v09-timeline-test.mjs`).

---

### Task 1: Schema-9 life-cycle foundation

**Files:**
- Modify: `js/core/version.js`
- Modify: `js/core/state.js`
- Modify: `tests/state-migration-test.mjs`
- Create: `tests/v09-life-state-test.mjs`

**Interfaces:**
- Produces `LIFE_STAGES`, `createNewLife`, `validateState`, and `migrateState(candidate)` with schema-9 life defaults.
- Produces `state.life` with `stage`, `school`, `examResult`, `ageDays`, `ended`, and `endingSummary`; later tasks consume this shape.

- [ ] **Step 1: Write failing schema-9 tests**

Add tests proving a fresh `createNewLife` starts at age 18 with `life.stage === 'school-finale'`, and a schema-8 career/business fixture migrates with `life.stage === 'adult'`, unchanged cash/assets, and `schemaVersion === 9`.

- [ ] **Step 2: Run the new test to verify it fails**

Run: `node tests/v09-life-state-test.mjs`

Expected: FAIL because schema-9 life state and migration do not exist.

- [ ] **Step 3: Implement schema and migration**

Set `APP_VERSION` to `0.9`, `SAVE_SCHEMA_VERSION` to `9`, add validated `life` defaults, and route `loadGame` through `migrateState(candidate)`. Preserve the existing corrupt-save recovery path and retain schema-6 migration through the existing legacy mapping.

- [ ] **Step 4: Verify state migration behavior**

Run: `node tests/v09-life-state-test.mjs && node tests/state-migration-test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/core/version.js js/core/state.js tests/state-migration-test.mjs tests/v09-life-state-test.mjs
git commit -m "feat: add v0.9 life state migration"
```

### Task 2: Generated starting people

**Files:**
- Create: `js/data/people.js`
- Create: `js/systems/people.js`
- Modify: `js/core/state.js`
- Create: `tests/v09-people-test.mjs`

**Interfaces:**
- Produces `createStarterPeople({ seed, profile }) -> Person[]`.
- Produces `ensureStarterPeople(state) -> state`; the school, rendering, and event systems consume `relationships.people` records with `name`, `type`, `score`, `trait`, and `reaction`.

- [ ] **Step 1: Write failing generated-people tests**

Test that one seed creates exactly guardian, friend, classmate/rival, and mentor records; a different seed changes at least one presentation field; the same seed is stable; and invalid person input is normalised safely by `validateState`.

- [ ] **Step 2: Run the people test to verify it fails**

Run: `node tests/v09-people-test.mjs`

Expected: FAIL because no generator or normalisation exists.

- [ ] **Step 3: Implement the small seeded roster**

Add diverse local name/trait data and a deterministic no-dependency seed helper. Store the generated roster when creating a new life only; schema-8 migration must leave existing relationships intact rather than adding a surprise roster.

- [ ] **Step 4: Verify roster behavior**

Run: `node tests/v09-people-test.mjs && node tests/v09-life-state-test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/data/people.js js/systems/people.js js/core/state.js tests/v09-people-test.mjs
git commit -m "feat: add generated starter relationships"
```

### Task 3: School finale and adult job entry

**Files:**
- Create: `js/data/life.js`
- Create: `js/data/jobs.js`
- Create: `js/systems/life.js`
- Create: `js/systems/jobs.js`
- Modify: `js/systems/day.js`
- Create: `tests/v09-school-jobs-test.mjs`

**Interfaces:**
- Produces `getSchoolDecision(state)`, `chooseSchoolDecision(state, choiceId)`, and `completeSchool(state)`.
- Produces `getAvailableJobs(state)`, `applyForJob(state, jobId)`, and `resolveJobApplication(state, applicationId)`.
- Extends `getCurrentDecision(state)` with school-finale cards and `startDay(state)` with pending job-result interruption handling.

- [ ] **Step 1: Write failing school and jobs tests**

Test the final school morning, final exam, and school-end choice progression; test that an exam result makes at least one starter adult option valid; and test that an active career/business prevents ordinary job applications.

- [ ] **Step 2: Run the school/jobs test to verify it fails**

Run: `node tests/v09-school-jobs-test.mjs`

Expected: FAIL because school and jobs modules are absent.

- [ ] **Step 3: Implement the finite opening and compact applications**

Use three short school stages and one stored exam result. Define a maximum of three applicable job cards: office, an eligible startup, or a restart. A successful application starts the existing career/business system; a pending result is scheduled as a high-impact interruption. Do not alter promotion, warnings, or one-time upgrade rules.

- [ ] **Step 4: Verify the new-life path and v0.8 day behavior**

Run: `node tests/v09-school-jobs-test.mjs && node tests/v07-systems-test.mjs && node tests/career-warning-test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/data/life.js js/data/jobs.js js/systems/life.js js/systems/jobs.js js/systems/day.js tests/v09-school-jobs-test.mjs
git commit -m "feat: add school finale and job applications"
```

### Task 4: Phone view models and action routing

**Files:**
- Create: `js/ui/phone.js`
- Modify: `js/ui/render.js`
- Modify: `js/app.js`
- Modify: `js/core/state.js`
- Modify: `tests/v08-foundation-test.mjs`
- Create: `tests/v09-phone-ui-test.mjs`

**Interfaces:**
- Produces `buildPhoneModel(state) -> { apps, notifications }` and `renderPhone(model) -> string`.
- Extends renderer context with `phoneOpen` and `phoneApp`; dispatches `OPEN_PHONE`, `CLOSE_PHONE`, `OPEN_PHONE_APP`, `APPLY_JOB`, `FAST_FORWARD`, and the existing asset/business actions.

- [ ] **Step 1: Write failing phone-model tests**

Test that the default app list is Jobs, Transport, Business, People, Life, and Time; unavailable actions are absent or disabled; and the main game markup contains one phone control but no `.secondary-stack` panel stack.

- [ ] **Step 2: Run the phone test to verify it fails**

Run: `node tests/v09-phone-ui-test.mjs`

Expected: FAIL because no phone model or phone control exists.

- [ ] **Step 3: Implement phone composition without moving rules into the UI**

Add transient phone state under `settings.phone` with safe validation. Move existing wellbeing, relationship, transport, business, and work summaries into app cards. Keep `app.js` as the only dispatcher that invokes domain systems; `phone.js` only renders supplied models.

- [ ] **Step 4: Verify phone and existing renderer contracts**

Run: `node tests/v09-phone-ui-test.mjs && node tests/v08-foundation-test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/ui/phone.js js/ui/render.js js/app.js js/core/state.js tests/v08-foundation-test.mjs tests/v09-phone-ui-test.mjs
git commit -m "feat: add phone-first game navigation"
```

### Task 5: Brighter mobile visual system and motion

**Files:**
- Modify: `v08-sa-edition.css` (rename to `v09-life-begins.css` only if all production references and smoke tests change together)
- Modify: `index.html`
- Modify: `tests/v08-smoke-test.mjs`
- Modify: `tests/v09-phone-ui-test.mjs`

**Interfaces:**
- Consumes the stable phone and main-screen class names from Task 4.
- Produces bright mobile styles, short phone/app/notification transitions, and reduced-motion fallbacks.

- [ ] **Step 1: Write failing style-contract tests**

Assert that the production entry references the v0.9 stylesheet, phone/mobile classes exist, `prefers-reduced-motion` remains present, and the 320px layout constraint remains present.

- [ ] **Step 2: Run the style test to verify it fails**

Run: `node tests/v08-smoke-test.mjs`

Expected: FAIL because the v0.9 style contracts are not yet present.

- [ ] **Step 3: Implement the visual refresh**

Use warm light surfaces with green, gold, coral, and blue accents. Make the phone sheet full-height on small screens, retain large touch targets, animate only short entry/settle transitions, and keep the current event card visually dominant.

- [ ] **Step 4: Verify responsive production contracts**

Run: `node tests/v08-smoke-test.mjs && node tests/v09-phone-ui-test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add index.html v08-sa-edition.css tests/v08-smoke-test.mjs tests/v09-phone-ui-test.mjs
git commit -m "feat: brighten v0.9 mobile interface"
```

### Task 6: Safe week/month timeline simulation

**Files:**
- Create: `js/systems/timeline.js`
- Modify: `js/systems/day.js`
- Modify: `js/systems/life.js`
- Modify: `js/app.js`
- Create: `tests/v09-timeline-test.mjs`

**Interfaces:**
- Produces `canFastForward(state, days) -> { ok, reason }` and `fastForward(state, days, { random }) -> { state, summary, interrupted }` for `days` 7 or 30 only.
- Produces `settleRoutineDay(state, { random })` in the day system; it settles only ordinary days and returns an interruption signal rather than choosing player decisions automatically.

- [ ] **Step 1: Write failing timeline tests**

Test seven-day and thirty-day runs, one-settlement-per-day IDs, delayed-event interruption, job-result interruption, invalid skip phases, compact maximum-three-item summaries, and no duplicate transport-driver income.

- [ ] **Step 2: Run the timeline test to verify it fails**

Run: `node tests/v09-timeline-test.mjs`

Expected: FAIL because no fast-forward API exists.

- [ ] **Step 3: Implement routine settlement and interruptions**

Extract only the reusable automatic settlement path from `day.js`; do not auto-select headline, work, travel, or chase choices. Let `fastForward` iterate routine days, advance calendar/time, collect net cash/outcomes, and stop before a flagged high-impact decision. Store a compact summary in `state.timeline` for the Time app.

- [ ] **Step 4: Verify timeline and stable systems**

Run: `node tests/v09-timeline-test.mjs && node tests/travel-business-test.mjs && node tests/event-deck-test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/systems/timeline.js js/systems/day.js js/systems/life.js js/app.js tests/v09-timeline-test.mjs
git commit -m "feat: add safe week and month fast forward"
```

### Task 7: Birthdays, later life, and ending summaries

**Files:**
- Modify: `js/systems/life.js`
- Modify: `js/systems/timeline.js`
- Modify: `js/ui/render.js`
- Modify: `js/ui/phone.js`
- Modify: `tests/v09-timeline-test.mjs`
- Create: `tests/v09-life-ending-test.mjs`

**Interfaces:**
- Produces `advanceLifeCalendar(state, days)`, `evaluateLifeEnding(state, { random })`, and `buildLifeSummary(state)`.
- Produces `state.life.ended` plus `endingSummary`; day and timeline transitions reject further play after the ending.

- [ ] **Step 1: Write failing aging and ending tests**

Test that a birthday occurs once at 365 days, age 60 transitions to later life, age below 70 cannot end normally, health affects eligible late-life outcome, age 100 ends deterministically, and ended saves cannot advance/skip.

- [ ] **Step 2: Run the ending test to verify it fails**

Run: `node tests/v09-life-ending-test.mjs`

Expected: FAIL because no age calendar or ending evaluator exists.

- [ ] **Step 3: Implement respectful life completion**

Increment `life.ageDays` alongside calendar progress, show a short birthday milestone, set later life at age 60, and evaluate non-graphic ending eligibility at age 70+ with health influence. Build a summary from age, days, work/business, relationships, net worth, and an achievement; expose it as a final event card with a new-life route.

- [ ] **Step 4: Verify lifecycle behavior and full core suite**

Run: `node tests/v09-life-ending-test.mjs && node tests/v09-timeline-test.mjs && node tests/v09-life-state-test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/systems/life.js js/systems/timeline.js js/ui/render.js js/ui/phone.js tests/v09-timeline-test.mjs tests/v09-life-ending-test.mjs
git commit -m "feat: add aging and life endings"
```

### Task 8: Release verification and tester hand-off

**Files:**
- Modify: `README.md`
- Modify: `TESTER_CHECKLIST.md`
- Modify: `tests/syntax-check.mjs`

**Interfaces:**
- Consumes the completed schema, modules, UI, and test suite.
- Produces v0.9 documentation and a tester route covering new life, migration, phone, skips, and ending.

- [ ] **Step 1: Add failing syntax/import coverage for new production modules**

Extend the syntax test module list with life, people, jobs, timeline, and phone modules.

- [ ] **Step 2: Run syntax coverage to verify it fails**

Run: `node tests/syntax-check.mjs`

Expected: FAIL until every referenced v0.9 module exists and imports cleanly.

- [ ] **Step 3: Document and verify the release path**

Update README version/scope and the tester checklist with: school finale, varied starter people, phone apps, week skip, month skip, a skipped-event interruption, migrated v0.8 save, and a later-life summary. Do not add v1.0 scope.

- [ ] **Step 4: Run the complete test suite**

Run: `node tests/syntax-check.mjs && node tests/v07-systems-test.mjs && node tests/state-migration-test.mjs && node tests/event-deck-test.mjs && node tests/career-warning-test.mjs && node tests/travel-business-test.mjs && node tests/chase-generator-test.mjs && node tests/v08-foundation-test.mjs && node tests/v08-smoke-test.mjs && node tests/v09-life-state-test.mjs && node tests/v09-people-test.mjs && node tests/v09-school-jobs-test.mjs && node tests/v09-phone-ui-test.mjs && node tests/v09-timeline-test.mjs && node tests/v09-life-ending-test.mjs`

Expected: every suite passes without warnings or skipped behavior.

- [ ] **Step 5: Perform browser smoke checks**

Check a new life through school and a first adult application, the phone on a narrow viewport, v0.8 migration, both skip lengths, an interruption, and ending summary. Confirm no console errors and no clipped controls.

- [ ] **Step 6: Commit**

```bash
git add README.md TESTER_CHECKLIST.md tests/syntax-check.mjs
git commit -m "docs: prepare v0.9 life begins release"
```
