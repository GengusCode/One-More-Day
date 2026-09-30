# ONE MORE DAY — SA Edition Systems Design (v0.8)

**Status:** Approved for implementation planning  
**Date:** 2026-09-29  
**Target:** Mobile-first browser prototype hosted on GitHub Pages

## 1. Product intent

ONE MORE DAY is a South African life-and-money game about surviving ordinary pressure, building a career or owner-operated business, maintaining relationships, and turning small daily decisions into a different future. It should feel recognisably South African without needing a city label, while remaining understandable to players anywhere.

Version 0.8 should replace repetitive daily work selection with a more varied rhythm:

1. See today's situation.
2. Make one meaningful decision, sometimes followed by a contextual second choice.
3. Resolve travel, work/business, relationships, and money automatically where the player has already established a routine.
4. See immediate feedback and occasional delayed consequences.
5. Progress toward a promotion, a stronger business, new assets, or a setback.

The tone is lively, warm, funny, and occasionally chaotic. Outcomes must remain understandable after they happen, but choices must not reveal in advance which answer gives a warning, promotion, dismissal, loss, or reward.

## 2. Success criteria

The release is successful when:

- a new player can enter a name, choose a gender, start a life, and understand the first decision without instructions;
- each in-game day feels different for at least the first two simulated weeks;
- the player is not asked to choose the same job every day;
- career progress is shaped by work choices, performance, warnings, and relationships at work;
- an owner-operated startup succeeds or fails because of the player's decisions and investments, not an unseen manager;
- travel choices reflect price, reliability, comfort, owned assets, and South African public-transport disruptions;
- cash changes are visible at the moment they happen;
- the phone-theft chase is a tense, fair 20–30 second three-lane runner;
- the interface has no horizontal overflow or clipped controls from 320 px mobile width through desktop;
- existing saved games load safely through migration;
- the game still runs as a static website with no installation, server, account, or build step.

## 3. Scope

### Included in v0.8

- Name and gender selection: man, woman, or non-binary.
- Pronouns and original character appearance derived from gender selection, with no statistical advantage.
- A redesigned cover using a properly licensed real Toyota Quantum photograph, subtle South African flag treatment, animated title, and a small `SA EDITION` label.
- Compact heads-up display and collapsible secondary panels.
- Shuffled daily event decks with delayed follow-ups and repeat protection.
- Corporate career decisions, performance, warnings, promotion, and dismissal.
- Owner-operated startup progression, equipment, staff, premises, customer trust, growth, and closure risk.
- Taxi, e-hailing, bicycle, personal car, e-hailing-driver assignment, and staying home.
- Taxi-full, standing-in-the-passage, flat-tyre, breakdown, and strike situations.
- Animated money gains and losses.
- A canvas-based phone-theft chase.
- Save schema v8 and migration from the current v6/v7 save.
- Automated logic checks plus manual mobile and browser testing.

### Not included in v0.8

- Multiplayer, accounts, cloud saves, advertisements, or real-money purchases.
- A full open world, free-roaming character, 3D game, or native Android/iOS package.
- Custom character creator beyond gender-based appearance.
- Business managers, franchising, loans, property ownership, marriage, or children.
- Licensed Subway Surfers art, code, music, characters, level design, or branding.
- A second minigame. The chase is the only action sequence in this release.

These exclusions keep the prototype small enough to finish and balance while leaving clean expansion points.

## 4. Core day flow

Each day follows one orchestration path:

1. **Morning setup:** restore the correct amount of energy, apply passive income/costs, and check scheduled consequences.
2. **Travel only when needed:** if the day's activity requires travel, show available travel methods and any disruption. Established travel can resolve automatically on ordinary days; a disruption creates a decision.
3. **Headline event:** draw one event from an eligible shuffled deck. Its first choice may produce a contextual second choice.
4. **Work or business resolution:** settle the player's established role automatically, unless today has a work/customer decision.
5. **Relationships and assets:** apply relevant relationship, vehicle, or employee consequences without opening unrelated panels.
6. **Feedback:** animate cash/stat changes and add a short entry to the day log.
7. **Advance:** save the complete state, then unlock Next Day.

Only one modal decision is active at a time. A player can never advance while a required follow-up choice or chase is unresolved.

On weekends, social, community, personal, and opportunity events receive higher weights and may replace the work decision. The game may still settle passive business or e-hailing income.

## 5. Character setup

The New Life card contains:

- a name field with broad South African examples but unrestricted player entry;
- three gender choices: Man, Woman, Non-binary;
- one primary Start Life button;
- a concise save/load notice.

Gender controls pronouns and the chase avatar's visual presentation only. It never changes pay, health, opportunities, odds, or difficulty. Existing saves without gender migrate to `non-binary` with they/them pronouns until the player changes it in Profile.

Input rules:

- trim leading/trailing spaces;
- accept letters from all languages, spaces, apostrophes, and hyphens;
- require 2–24 visible characters;
- escape user text before inserting it into the page;
- disable Start Life only while validation fails, and show the reason beside the field.

## 6. Career and startup paths

### 6.1 Corporate career

Corporate work is an employed career path. The player has:

- a role and salary;
- performance from 0–100;
- relationship scores with boss and co-workers;
- zero to three active warnings;
- a hidden promotion-readiness score;
- a work-decision history used to prevent immediate repeats.

Work decisions include quality, honesty, initiative, teamwork, workload, office politics, and managing the boss. Agreeing with or flattering the boss can help in some contexts, hurt credibility in others, or have no effect. The game does not mark choices as safe or dangerous before selection.

Promotion eligibility depends on role-specific performance, knowledge, reputation, attendance, and recent decisions. A good choice increases readiness; it does not grant an instant guaranteed promotion. Repeated poor judgement, serious misconduct, or three active warnings can cause dismissal. Warnings expire only after a sustained run of acceptable performance, not automatically after one day.

### 6.2 Owner-operated startups

The player starts and runs the business. There is no manager and no supervisor ladder. The player remains responsible for customer decisions even after hiring staff.

The three starting concepts remain small and scalable:

- **Car-wash service** — begin with buckets and labour, then add better equipment, staff, a fixed site, and more bays.
- **Moving/helping service** — begin as hands-on labour, then add equipment, helpers, a vehicle, storage, and larger contracts.
- **Buy-and-resell** — begin with small stock, then add storage, sourcing, delivery capacity, and a storefront/warehouse.

Every equipment upgrade is a one-time purchase. Owned upgrade IDs are stored in a set and cannot be bought again. Upgrades raise capacity or quality; they do not guarantee profit without good choices and customer trust.

Business progression titles are:

1. Solo Owner
2. Equipped Operator
3. Employer
4. Site Owner
5. Multi-Site Founder

Progression is determined by business value, trust, capacity, staff, premises, and completed owner decisions—not by a promotion button.

Customer trust ranges from 0–100 and starts at 55. Trust affects demand, event eligibility, and revenue. If trust remains at 0 for two operating days, the business closes and its normal revenue stops. The player retains sellable assets and can later restart; the player is never “fired” from their own business.

Hiring employees raises capacity and wage costs. It does not introduce a manager in v0.8. When the owner stays home:

- a solo business earns R0 and loses 4 trust;
- a staffed business earns 35% of its normal baseline and loses 2 trust;
- the owner still receives the recovery benefit described under Stay Home.

### 6.3 Automatic work settlement

Once a player has selected a career or founded a startup, its normal work result settles automatically each working day. The player chooses only when a meaningful work situation occurs. This removes the repeated “pick one of three jobs” loop while keeping work decisions important.

## 7. Transport and vehicle economy

All balance values live in data/configuration, not in rendering code. Initial prototype values are:

| Method | Requirement | Normal cost/result | Trade-off |
|---|---|---:|---|
| Taxi | Always available unless strike | R30; −3 energy | Cheapest routine option; crowding and disruption risk |
| E-hailing | Enough cash | R110; +2 energy | Reliable but surge pricing can raise cost |
| Bicycle | Buy once for R900 | R0; −8 energy; +2 health | Weather can block it or double energy cost |
| Used car | Buy once for R18,000 | R90 fuel per commute | Comfortable and reliable; maintenance risk |
| Stay home | Always available | R0 travel cost; +18 energy; +3 health | Loses work/business income and harms attendance/trust |

The used car contributes 85% of purchase price to net worth until damaged. A car-repair event costs R400–R900 depending on severity. Maintenance events are drawn from the vehicle deck rather than charged every day.

### 7.1 Taxi disruptions

Eligible taxi situations include:

- **Full taxi:** wait, find another method, or stand in the passage when in a hurry. Standing costs the normal fare, gets the player to work, and applies −12 energy and −5 happiness.
- **Flat tyre:** help, wait, switch transport, call work, or stay home depending on assets and cash.
- **Breakdown:** similar choices, with different time and social outcomes.
- **Strike:** taxi is unavailable; e-hailing may have surge pricing. Bicycle and car appear only if owned.

These events do not occur every day. Ordinary taxi days resolve quickly so public transport feels like part of life rather than the whole game.

### 7.2 Personal use versus e-hailing income

On each morning when the car is roadworthy, the player may leave it available for personal travel or assign it to an e-hailing driver. Assignment lasts for that in-game day:

- net daily income is randomly R220–R450 after the driver's share and ordinary fuel;
- the car cannot also be chosen for personal travel that day;
- the vehicle has a small chance to trigger a maintenance or driver follow-up event;
- assigning the car is never automatically optimal: taxi may be cheaper than giving up the day's e-hailing income, while personal use is more reliable during disruptions.

### 7.3 Stay Home

Stay Home is always visible when a commute decision is shown, including when every other method is blocked or unaffordable.

- Corporate employee: no income for the day and −2 performance. Calling ahead, when offered, changes this to −1 and can protect the boss relationship. Repeated absence may create a warning.
- Solo owner: R0 operating income and −4 trust.
- Staffed owner: 35% baseline income and −2 trust.
- Any path: +18 energy, +3 health, no travel cost.

Some events can make staying home sensible; it is a real choice, not a disguised failure button.

## 8. Dynamic events and delayed consequences

Events are divided into decks:

- transport;
- corporate work;
- owner/customer;
- relationships;
- community and culture;
- money temptations;
- opportunities;
- rare chaos/minigames.

Each deck shuffles eligible event IDs and draws without replacement. It reshuffles only after at least 75% of eligible cards have been seen, or when eligibility changes so much that no card remains. The last three headline IDs are excluded from the next draw where possible.

Version 0.8 must ship with at least:

- 18 headline daily events spread across the decks;
- 14 distinct work/owner decisions;
- the five named taxi/transport disruptions: full taxi/passage, flat tyre, breakdown, strike, and e-hailing surge;
- at least six South African cultural situations expressed through behaviour and detail rather than explanatory labels;
- at least five two-stage event branches.

Events may define:

- eligibility rules;
- first-stage choices;
- contextual follow-up choices;
- immediate effects;
- a delayed consequence scheduled for a future day;
- relationship and business flags;
- a one-line result and optional callback into a minigame.

A delayed queue stores `{dueDay, eventId, outcomeId, payload}`. Morning setup resolves due entries before drawing the new headline event. If two consequences are due together, the more serious one becomes the headline and the other appears as a compact update; neither is lost.

## 9. Phone-theft runner

The chase is an original, short, behind-the-character three-lane runner rendered in a responsive HTML canvas. Its visual language can evoke South African streets and the supplied “runner” reference, but it must not copy Subway Surfers art, layouts, sounds, code, or branding.

### Rules

- Duration: target 25 seconds; acceptable range 20–30 seconds.
- Goal: avoid 6–8 obstacles and close the gap to the thief.
- Controls: swipe left/right on touch; Left/Right or A/D on keyboard; visible lane buttons as a fallback.
- A valid input moves one lane only. Inputs during the transition are queued at most once.
- One collision ends the chase immediately and the thief escapes.
- Surviving the timer triggers a short catch animation and the successful outcome.
- No cash/stat resolution occurs until the chase reports one final result.

Original obstacle themes include potholes, crates, shopping trolleys, pedestrians, a parked taxi, and roadworks barriers. Obstacles are generated from deterministic lanes and timestamps. The generator must leave at least one reachable safe lane at every decision point and must not place an unavoidable obstacle during a lane transition.

The road scrolls toward the player, lane markers and scenery create speed, the thief remains ahead, and a distance meter communicates progress. Character appearance reflects the selected gender without changing hitbox or speed.

If the tab becomes hidden, the chase pauses. Returning shows a three-second countdown before resuming. If canvas or animation support fails, the game shows a simple lane-prompt fallback using the same obstacle sequence so the life can continue.

For `prefers-reduced-motion`, camera shake, rapid scenery, and title/feedback motion are reduced; the underlying timing and challenge remain the same.

## 10. Interface and visual direction

### 10.1 Cover

The cover uses a locally stored, web-optimised crop derived from **SouthAfricanMinibus.jpg** by Martinvl: a real South African Toyota Quantum Ses’fikile painted in South African flag colours. The source is licensed CC BY-SA 4.0. The game must include source, author, licence link, and a note describing cropping/colour treatment in `assets/credits.md` and README.

The image receives a controlled dark gradient so text remains readable. It is not labelled with a city. Visual South African identity comes from the Quantum, flag colours, street-detail accents, and writing—not a large location caption.

`ONE MORE DAY` is the dominant animated mark. `SA EDITION` is small. Animation should feel designed: a restrained entrance, subtle continuous highlight, and still state under reduced motion.

### 10.2 Game screen

The default screen shows only:

- Day and age;
- cash and current cash animation;
- energy;
- today's event and choices;
- Next Day when available.

Health, knowledge, social, happiness, reputation, net worth, career/business, relationships, transport, and assets live in compact expandable sections. A section may open automatically when today's event changes it, then remain under player control.

Only one strong primary action appears per panel. Buttons use clear pressed/focus states and varied layouts where the content benefits—stacked decisions, two-column quick choices, cards, or a follow-up sheet—without changing basic interaction rules.

### 10.3 Money feedback

Every cash mutation goes through one state action. The UI observes it and:

1. shows `+Ramount` in green or `−Ramount` in warm red beside the balance;
2. moves/fades that amount for 700–1,000 ms;
3. briefly scales the settled balance;
4. updates net worth once per transaction;
5. combines rapid mutations into an ordered queue so none overlap or disappear.

Formatting uses South African rand with readable thousands separators.

### 10.4 Responsive fit

- No horizontal scroll from 320 px to 1,440 px viewport widths.
- Use `min-width: 0` on grid/flex children and wrap long text.
- Respect mobile safe-area insets.
- Modals fit within `100dvh`, scroll internally, and keep the close/action area reachable.
- Canvas size follows its container and caps pixel density to avoid memory spikes.
- Touch targets are at least 44×44 CSS pixels.
- Text remains usable at 200% zoom.

## 11. Architecture

Version 0.8 changes the current monolithic script into plain ES modules that still run directly on GitHub Pages:

```text
index.html
v08-sa-edition.css
assets/
  cover/south-african-minibus.webp
  credits.md
js/
  app.js
  core/state.js
  data/events.js
  data/economy.js
  systems/event-deck.js
  systems/career.js
  systems/business.js
  systems/travel.js
  systems/relationships.js
  ui/render.js
  ui/money-feedback.js
  minigames/chase-runner.js
tests/
  state-migration-test.mjs
  event-deck-test.mjs
  travel-business-test.mjs
  chase-generator-test.mjs
  v08-smoke-test.mjs
```

Responsibilities:

- `state.js` owns the canonical state, pure mutations, persistence, validation, and migration.
- `events.js` and `economy.js` hold data and balance constants.
- each system returns explicit effects; it does not manipulate the DOM.
- `render.js` renders state and delegates player actions.
- `money-feedback.js` listens to cash transactions and owns their animation queue.
- `chase-runner.js` exposes `start(config) -> Promise<result>` and knows nothing about career/business rules.
- `app.js` is the orchestration layer and the only module wiring systems to the page.

No external framework is required. Canvas is used only for the chase; the life simulator remains semantic HTML/CSS for accessibility and maintainability.

## 12. Save schema and migration

The stored object includes `schemaVersion: 8` and these top-level domains:

```text
profile, calendar, stats, finances, career, business,
relationships, transport, assets, eventHistory,
eventDecks, delayedEvents, dailyState, settings
```

On startup:

1. read the v8 key;
2. if absent, read the existing legacy key used by v6/v7;
3. parse inside a guarded block;
4. copy recognised values into a fresh v8 default object;
5. normalise ranges, arrays, owned-upgrade IDs, and missing domains;
6. preserve name, day, age, money, stats, relationships, active path, job/business progress, and purchased upgrades wherever the legacy data contains them;
7. write v8 only after validation succeeds;
8. leave the legacy save untouched for rollback.

Unknown fields are ignored. Missing fields receive defaults. Corrupt data shows a friendly recovery prompt offering a new life while retaining the corrupt string in a backup key for debugging.

Every required decision, chase state, and car assignment is saved. Reloading cannot duplicate income, charge travel twice, or redraw a more favourable event.

## 13. Error handling and accessibility

- Use one visible in-game error message for recoverable failures; log technical detail only to the console.
- Disable an action while its transaction is being committed to prevent double taps.
- If a selected event becomes invalid after migration, close it safely, add a log note, and continue to the next day.
- All controls are keyboard reachable with visible focus.
- Event results use text as well as colour and animation.
- Expanders expose their state to assistive technology.
- Canvas has a text description and the lane-button fallback.
- Sound is optional, off until user interaction, and never required for success.

## 14. Testing and acceptance

### Automated checks

- **Migration:** representative new, v6/v7, partial, and corrupt saves resolve safely.
- **Event decks:** no early repeats; eligibility and 75% reshuffle work; delayed consequences fire once.
- **Travel:** asset-gated choices, strikes, taxi passage, surge, stay-home consequences, and car assignment are correct.
- **Business:** upgrades buy once; staff costs and absence income apply; trust can close but not fire the owner.
- **Career:** warning, dismissal, and promotion readiness follow decisions without displaying hidden outcomes.
- **Chase generator:** every seeded sequence has a reachable safe lane; a collision loses; survival wins; result resolves once.
- **Smoke:** start life, make a branch choice, advance days, reload, and finish a chase without console errors.

### Manual tester checklist

1. Start one life for each gender and confirm pronouns/avatar change but stats do not.
2. Play 14 days and note any repeated headline event or repetitive work rhythm.
3. Trigger each transport disruption; verify unavailable owned methods never appear.
4. Stand in a full taxi's passage and verify arrival plus comfort penalties.
5. Buy the bicycle and car once; confirm neither can be bought twice.
6. Assign the car to an e-hailing driver; verify it cannot also be used for that day's commute.
7. Stay home as an employee, solo owner, and staffed owner; verify different consequences.
8. Make good and bad career decisions; verify promotions, warnings, and dismissal remain possible but unrevealed beforehand.
9. Grow each startup and verify the player remains the decision-maker with no manager appearing.
10. Win and lose the chase using touch and keyboard; test tab switching during a run.
11. Reload during an unresolved day and confirm no duplicate payment or rerolled event.
12. Test at 320 px width, common phone portrait/landscape sizes, desktop, and 200% zoom with no clipping.

### Release gate

Do not publish v0.8 until all automated checks pass, the checklist has no progression blocker, the browser console is clean, attribution is present, and the deployed GitHub Pages build is manually opened after deployment.

## 15. Implementation order

After this specification is approved, a separate implementation plan will break work into small test-first steps in this order:

1. State schema, migration, and economy data.
2. Character setup and compact shell UI.
3. Event deck, delayed consequences, and varied content.
4. Career and owner-operated business systems.
5. Transport, owned vehicles, e-hailing assignment, and stay-home outcomes.
6. Money feedback and responsive polish.
7. Runner minigame and fallbacks.
8. Licensed cover asset, credits, complete testing, and GitHub Pages release.

This order protects existing saves and game progression before visual and minigame work is layered on top.
