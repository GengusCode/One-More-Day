# ONE MORE DAY v0.8 Life and Economy Systems Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Turn the v0.8 preview shell into a varied, persistent life simulation with shuffled events, automatic career or owner-work settlement, relationships, transport assets, disruptions, and meaningful stay-home outcomes.

**Architecture:** Data modules declare content and balance values; pure system modules return effects without touching the DOM. A day orchestrator resolves morning, travel, headline, work, relationships, feedback, and advance in a fixed state machine consumed by app.js.

**Tech Stack:** Browser ES modules, semantic HTML/CSS, localStorage schema v8, deterministic random injection, Node assertion tests.

**Spec:** docs/superpowers/specs/2026-09-29-sa-edition-systems-design.md

## Global Constraints

- Complete the foundation/interface plan before starting this plan.
- A saved day may settle each income, cost, event, and delayed consequence at most once.
- Normal work settles automatically after the player establishes a corporate career or startup.
- Hide promotion, warning, dismissal, profit, and loss predictions until after a choice.
- Ship at least 18 headline events, 14 work/owner decisions, five two-stage branches, five named transport disruptions, and six behaviour-based South African cultural situations.
- Equipment, bicycle, and car purchases are one-time and stored by owned ID.
- A startup never gains a manager; the owner remains responsible for decisions.
- Stay Home is always visible during commute decisions.

## Review Focus

- Event eligibility changing mid-deck must not deadlock or repeat the previous three headlines; pin this in Task 1.
- Two delayed consequences due on the same day must both resolve exactly once; pin this in Task 2.
- A car assigned to an e-hailing driver must disappear from personal travel immediately and return next day; pin this in Task 5.
- Trust reaching zero must require two operating days before closure and must never label the owner fired; pin this in Task 4.
- Reloading any unresolved choice must restore the same event and choice order, not reroll a better outcome; pin this in Task 6.

---

## File Map

- Create js/data/events.js: event, work-decision, branch, and cultural content.
- Create js/systems/event-deck.js: eligibility, shuffled decks, recent-history protection, and delayed queue.
- Create js/systems/relationships.js: bounded relationship effects and derived labels.
- Create js/systems/career.js: performance, warnings, readiness, promotions, dismissal, and attendance.
- Create js/systems/business.js: startup creation, upgrades, staff, premises, trust, revenue, titles, and closure.
- Create js/systems/travel.js: transport availability, disruptions, owned assets, daily car assignment, and stay home.
- Create js/systems/day.js: the one-way daily state machine.
- Modify js/app.js and js/ui/render.js: dispatch and show these systems.
- Create tests/event-deck-test.mjs and tests/travel-business-test.mjs.
- Modify tests/v08-foundation-test.mjs.

### Task 1: Build eligible shuffled event decks

**Files:**
- Create: js/data/events.js
- Create: js/systems/event-deck.js
- Create: tests/event-deck-test.mjs

**Interfaces:**
- Produces: EVENTS; WORK_DECISIONS; getEligibleEventIds(state, deckName); createDeckState(ids, random); drawEvent({ deckState, eligibleIds, recentIds, random }).
- drawEvent returns { eventId, deckState } and never mutates inputs.

- [ ] **Step 1: Write failing deterministic deck tests**

  Assert draws contain no duplicates before 75% consumption, exclude the last three headline IDs where alternatives exist, re-evaluate eligibility, preserve deterministic ordering with injected random values, and recover when all remaining cards become ineligible.

- [ ] **Step 2: Run the deck test**

  Run: node tests/event-deck-test.mjs
  Expected: FAIL because event-deck.js is absent.

- [ ] **Step 3: Define the event schema and initial IDs**

  Each event declares id, deck, weight, eligibility, stage-one choices, optional follow-up, immediate effects, optional delayed outcome, result copy, and optional minigame callback. Choice copy contains no outcome labels.

- [ ] **Step 4: Implement deck creation and draw**

  Use Fisher–Yates with injected random; consume without replacement; reshuffle at 75% or when no eligible card remains; exclude recent IDs where possible.

- [ ] **Step 5: Run the deck tests**

  Run: node tests/event-deck-test.mjs
  Expected: PASS for repeat protection, reshuffle, eligibility, and deterministic draws.

- [ ] **Step 6: Commit**

  Commit: feat: add eligible shuffled event decks

### Task 2: Add branches and delayed consequences

**Files:**
- Modify: js/data/events.js
- Modify: js/systems/event-deck.js
- Modify: tests/event-deck-test.mjs

**Interfaces:**
- Consumes: event definitions and drawEvent() from Task 1.
- Produces: getChoiceStage(event, choiceId); scheduleDelayedEvent(state, item); resolveDueEvents(state, day).
- Delayed item shape is { dueDay, eventId, outcomeId, payload }.

- [ ] **Step 1: Add failing branch and queue tests**

  Assert five event IDs expose a second stage; unavailable second choices stay hidden; one delayed event fires on dueDay only; two due items return one primary by severity plus one compact update; reload does not reapply either.

- [ ] **Step 2: Run the deck test**

  Run: node tests/event-deck-test.mjs
  Expected: FAIL on missing branch and delay exports.

- [ ] **Step 3: Implement contextual stages**

  Return only the follow-up tied to the selected first choice, preserve its stored option order, and mark the original decision unresolved until the second choice completes.

- [ ] **Step 4: Implement the delayed queue**

  Sort due entries by severity then stable insertion order, remove them atomically, and persist resolved outcome IDs in dailyState.

- [ ] **Step 5: Run the tests**

  Run: node tests/event-deck-test.mjs
  Expected: PASS, including the simultaneous-due and replay-idempotency cases.

- [ ] **Step 6: Commit**

  Commit: feat: add branching and delayed event outcomes

### Task 3: Implement corporate career progression

**Files:**
- Create: js/systems/career.js
- Modify: js/data/events.js
- Create: tests/travel-business-test.mjs

**Interfaces:**
- Produces: startCareer(state, careerId); getCareerDecisionIds(state); resolveCareerChoice(state, eventId, choiceId); settleCareerDay(state, context).
- settleCareerDay returns effects plus careerStatus containing role, pay, performance, warnings, readiness, boss, coworkers, promotion, or dismissal.

- [ ] **Step 1: Write failing career tests**

  Assert ordinary days pay automatically; performance stays 0–100; choices can help, harm, or leave boss opinion unchanged; outcomes are not present in pre-choice data; three active warnings or serious misconduct dismisses; sustained acceptable performance expires warnings; promotion requires all role thresholds and recent decisions.

- [ ] **Step 2: Run the system test**

  Run: node tests/travel-business-test.mjs
  Expected: FAIL because career.js is absent.

- [ ] **Step 3: Implement career state transitions**

  Track role, salary, performance, boss and co-worker relationship scores, active warnings with issue days, hidden readiness, attendance, and recent decision IDs.

- [ ] **Step 4: Add at least seven corporate decisions**

  Cover quality, honesty, initiative, teamwork, workload, office politics, and managing the boss. Include context where flattering the boss helps, hurts credibility, and has no effect.

- [ ] **Step 5: Run career tests**

  Run: node tests/travel-business-test.mjs
  Expected: PASS for pay, warnings, dismissal, readiness, promotion, repeat protection, and hidden outcomes.

- [ ] **Step 6: Commit**

  Commit: feat: add choice-driven corporate progression

### Task 4: Implement owner-operated startup growth

**Files:**
- Create: js/systems/business.js
- Modify: js/data/events.js
- Modify: js/data/economy.js
- Modify: tests/travel-business-test.mjs

**Interfaces:**
- Produces: startBusiness(state, businessId); buyUpgrade(state, upgradeId); hireEmployee(state, roleId); resolveOwnerChoice(state, eventId, choiceId); settleBusinessDay(state, context); getBusinessTitle(business).
- Business IDs are car-wash, moving-service, and buy-resell.

- [ ] **Step 1: Write failing business tests**

  Assert all three concepts begin at trust 55 as Solo Owner; an upgrade charges once and cannot be repurchased; equipment raises capacity but not guaranteed profit; staff adds capacity and wages without creating a manager; trust zero on one operating day stays open, on two closes; closure retains sellable assets and says closed, never fired.

- [ ] **Step 2: Run the system test**

  Run: node tests/travel-business-test.mjs
  Expected: FAIL because business.js is absent.

- [ ] **Step 3: Implement business progression**

  Derive the five titles from value, trust, capacity, staff, premises, and completed owner decisions. Keep every customer decision assigned to the player at all stages.

- [ ] **Step 4: Add at least seven owner decisions**

  Spread customer service, pricing, stock quality, late work, helpers, supplier trust, equipment failure, and premises choices across the three concepts.

- [ ] **Step 5: Implement automatic settlement and closure**

  Calculate demand from capacity and trust; subtract wages; respect completed-day settlement IDs; close only after two operating days at zero trust; expose restart separately from normal revenue.

- [ ] **Step 6: Run business tests**

  Run: node tests/travel-business-test.mjs
  Expected: PASS for one-time ownership, revenue, wages, titles, trust, closure, and retained assets.

- [ ] **Step 7: Commit**

  Commit: feat: add owner-operated startup progression

### Task 5: Implement travel, owned vehicles, and Stay Home

**Files:**
- Create: js/systems/travel.js
- Modify: js/data/events.js
- Modify: js/data/economy.js
- Modify: tests/travel-business-test.mjs

**Interfaces:**
- Produces: getTravelOptions(state, context); buyTransportAsset(state, assetId); assignCarForDay(state, assignment, random); resolveTravel(state, optionId, context, random); resetDailyTransport(state).
- Travel option IDs are taxi, taxi-passage, ehailing, bicycle, car, and stay-home.

- [ ] **Step 1: Add failing travel matrix tests**

  Assert taxi R30 and −3 energy; passage R30, −12 energy, −5 happiness, and arrival; e-hailing R110 and +2 energy; bicycle costs R900 once, then R0, −8 energy, +2 health; car costs R18,000 once, adds 85% value, and uses R90 fuel; repairs fall R400–R900.

- [ ] **Step 2: Add failing disruption and absence tests**

  Cover full taxi, flat tyre, breakdown, strike, and surge. Assert asset-gated options; Stay Home always appears; corporate absence gives R0, +18 energy, +3 health, −2 performance or −1 after calling; solo owner gets R0 and −4 trust; staffed owner gets 35% baseline and −2 trust.

- [ ] **Step 3: Add failing e-hailing assignment tests**

  Assert a roadworthy car assigned for the day earns deterministic R220–R450 net, cannot be selected personally, may schedule one maintenance/driver follow-up, and becomes unassigned next morning without another payout.

- [ ] **Step 4: Run the system tests**

  Run: node tests/travel-business-test.mjs
  Expected: FAIL on missing travel exports.

- [ ] **Step 5: Implement availability and purchasing**

  Read all amounts from ECONOMY; filter unavailable or unaffordable methods without hiding Stay Home; store bicycle and car as one-time assets.

- [ ] **Step 6: Implement disruption resolution and assignment**

  Return explicit effects only; separate arrival, absence, comfort, cost, and scheduled follow-up flags; persist a daily assignment/settlement ID.

- [ ] **Step 7: Run travel and business tests**

  Run: node tests/travel-business-test.mjs
  Expected: PASS for every matrix, disruption, stay-home path, and car exclusivity case.

- [ ] **Step 8: Commit**

  Commit: feat: add South African travel economy

### Task 6: Add relationships and complete content counts

**Files:**
- Create: js/systems/relationships.js
- Modify: js/data/events.js
- Modify: tests/event-deck-test.mjs
- Modify: tests/travel-business-test.mjs

**Interfaces:**
- Produces: applyRelationshipEffects(state, effects); getRelationshipLabel(score); getRelationshipEventIds(state).
- Consumes: relationship effects returned by career, business, transport, and headline events.

- [ ] **Step 1: Add failing relationship and content-audit tests**

  Assert relationship scores clamp 0–100; labels change at exact thresholds; boss/coworker/family/friend effects target the correct person; data contains at least 18 headlines, 14 work/owner decisions, five two-stage branches, five required transport disruptions, and six cultural situations.

- [ ] **Step 2: Run both suites**

  Run: node tests/event-deck-test.mjs && node tests/travel-business-test.mjs
  Expected: FAIL until relationships and remaining content exist.

- [ ] **Step 3: Implement relationship effects**

  Keep numeric scores canonical, derive labels in one function, and return changed relationship IDs so the renderer can open that section.

- [ ] **Step 4: Complete and edit the content library**

  Use recognisable details such as taxi queues, passage standing, load-shedding workarounds, stokvel pressure, braai/community obligations, local food or sports conversation, and neighbour/family reciprocity without explanatory city labels or stereotypes.

- [ ] **Step 5: Run content audits**

  Run: node tests/event-deck-test.mjs && node tests/travel-business-test.mjs
  Expected: PASS for counts, thresholds, targets, and required branches.

- [ ] **Step 6: Commit**

  Commit: feat: expand relationships and daily situations

### Task 7: Orchestrate the complete day loop

**Files:**
- Create: js/systems/day.js
- Modify: js/app.js
- Modify: js/ui/render.js
- Modify: v08-sa-edition.css
- Modify: tests/v08-foundation-test.mjs
- Modify: tests/travel-business-test.mjs

**Interfaces:**
- Consumes: event, career, business, travel, relationship, state, and money APIs from Tasks 1–6.
- Produces: startDay(state, random); chooseTravel(state, optionId, random); chooseEvent(state, eventId, choiceId); resolveWork(state, choiceId, random); advanceDay(state, random); canAdvanceDay(state).

- [ ] **Step 1: Write a failing fourteen-day deterministic scenario**

  Start a corporate life and an owner life; assert morning consequences precede travel, only one modal is active, ordinary work auto-settles, required follow-up blocks advance, each settlement is once-only, weekends weight non-work decks, and 14 days complete without a repeated recent headline.

- [ ] **Step 2: Run the scenario**

  Run: node tests/travel-business-test.mjs
  Expected: FAIL because day.js is absent.

- [ ] **Step 3: Implement the phase state machine**

  Use phases morning, travel, headline, follow-up, work, feedback, complete. Save phase, event ID, stored choice order, and settlement IDs after every transition.

- [ ] **Step 4: Wire app dispatch**

  Route all buttons through action IDs, prevent double taps during save, resume the exact saved phase, and never reroll an unresolved event.

- [ ] **Step 5: Render varied decisions**

  Support stacked, two-column, card, and follow-up-sheet layouts selected by event presentation data while preserving one primary required action.

- [ ] **Step 6: Run all life-system tests**

  Run: node tests/state-migration-test.mjs && node tests/event-deck-test.mjs && node tests/travel-business-test.mjs && node tests/v08-foundation-test.mjs
  Expected: PASS.

- [ ] **Step 7: Play fourteen days manually in v08-preview.html**

  Verify work is not chosen daily, travel only interrupts when meaningful, decisions remain unpredictable before selection, panels open for changed systems, and reload preserves the same situation.

- [ ] **Step 8: Commit**

  Commit: feat: orchestrate the v8 daily life loop
