# ONE MORE DAY — LIFE BEGINS v0.9 Design

## Product intent

v0.9 gives every new life a memorable beginning and a complete arc. The player finishes their last school day, faces a final exam, enters adult life, builds work and relationships, grows older, and can eventually reach a life ending. The simulation may grow deeper, but each screen must stay quick to read, bright, playful, and focused on one meaningful action.

v0.8 remains the foundation. Its career, owner-operated businesses, transport, relationships, daily events, money feedback, chase, save safety, and responsive support remain in place unless this design explicitly changes how they are presented.

## Success criteria

- A newly created life begins at the end of high school, not directly as an established adult.
- The opening is playable in under three minutes: final school moment, exam choice, result, then adult opportunity.
- The normal play screen has a compact life header, one current decision, and a clear Phone button; it does not show the previous permanent panel stack.
- The phone gives access to jobs, transport, business, people, life details, and fast-forwarding through app-like screens.
- Every new life receives a small, persistent, varied starting circle of NPCs.
- Players can skip one week or one month only when it is safe to do so. Important moments interrupt a skip instead of disappearing.
- Age changes naturally, later-life health matters, and a completed life can end respectfully.
- v0.8 saves migrate safely into adult life without replaying the school opening.

## Scope and release slices

This is one v0.9 release, implemented and tested as four dependent slices:

1. Life timeline and safe v0.8-to-v0.9 migration.
2. School-finale opening and lightweight NPC generation.
3. Phone-first interface and brighter visual language.
4. Fast-forwarding, aging, and life endings.

The release does not add a full education ladder, province migration, an open-world map, a simulated social network, or an unlimited job marketplace.

## New-life opening

New lives begin at age 18 in the `school-finale` life stage. The usual name and gender setup remains unchanged. After it, the player sees a short sequence rather than a dashboard:

1. **Last school morning.** A classmate, mentor, or family NPC reacts to the day. One short choice changes energy, knowledge, reputation, or a relationship.
2. **Final exam.** The player selects one of three concise approaches. Choices are not labelled as good or bad. The result creates a small exam outcome and can influence the first adult job options.
3. **School ends.** A visual transition and a small notification mark the end of school. The player receives starter cash and is introduced to an adult opportunity through the Jobs phone app.

The sequence is deterministic within a save and never repeats. It uses the existing event-card style, but with shorter copy, reaction portraits/emoji, and stage-progress dots. It does not replace the later daily event engine.

Existing v0.8 saves migrate directly to `adult`; they keep their current age, work, money, assets, people, and day. They never receive the school-finale sequence unexpectedly.

## Phone-first interface

### Main screen

The game screen has four persistent elements only:

- A compact header: player reaction/avatar, age, day or month, and cash.
- One current event or decision card.
- Contextual next/continue action when the day is complete.
- A large, tappable phone affordance near the lower edge.

Stats, upgrades, vehicle controls, and relationship details leave the permanent screen. Brief cash changes, achievement chips, and phone notifications may appear temporarily, then clear themselves. The user always sees the current decision before secondary information.

### Phone behaviour

Tapping the phone opens a full-height mobile sheet with a small home screen. It closes with a visible back/close action, Escape, or the sheet close button. Phone state is transient UI state; it must not corrupt or block the simulation save.

The first release contains six apps:

| App | Purpose | Reuses from v0.8 |
| --- | --- | --- |
| Jobs | View a short list of available adult opportunities, apply when eligible, and see a pending or resolved application | Career and startup paths |
| Transport | Buy a bicycle/car, see owned transport, and assign a car to an e-hailing driver | Transport assets and driver income |
| Business | View the owner-operated business, buy one-time equipment, and hire helpers | Business upgrades and staff |
| People | View generated and earned relationships as simple person cards with a score/reaction | Relationship state and event effects |
| Life | View secondary wellbeing, net worth, career standing, and later-life status | Existing stats, finance, and career state |
| Time | Start a one-week or one-month skip when eligible | New timeline system |

Apps show a small number of cards at once. A player opens a card to make an action; the app home itself is not a permanent dashboard. The phone stays a hybrid: it is a shortcut to existing management systems, a place for applications/notifications, and the only home for fast-forward controls.

### Jobs app

The Jobs app is intentionally small. It presents at most three applicable opportunities at once: entry corporate work, eligible hustle/startup paths, or a restart opportunity after dismissal/closure. New adults receive an initial list after school. Later, applications are available while unemployed, dismissed, or when a named opportunity is offered by an event; a player cannot freely abandon an active career every day.

Applying creates a concise outcome immediately or a short pending application that resolves as an interruption during normal play or a skip. Eligibility uses the existing knowledge, reputation, exam result, career status, and business status. It never promises a promotion or hides an automatic punishment behind a phone action.

## Visual and interaction direction

The v0.8 dark green foundation changes to a brighter, warmer palette: cream/light sand surfaces, rich green anchors, yellow accents, coral warnings, and blue information highlights. The cover may remain atmospheric, but the active game screen must feel daylight-bright and approachable.

Motion is purposeful and short:

- phone rises and settles when opened;
- app icons use a subtle entrance stagger;
- current decision cards lift on tap;
- cash, status, and notification chips animate in then settle;
- school completion and birthdays use a brief celebratory transition.

All movement honours `prefers-reduced-motion`; reduced motion keeps the same information without continuous or essential animation. Controls remain keyboard accessible, have visible focus styles, and stay usable at 320px wide.

## Lightweight dynamic NPCs

Each new life generates four starting people from local data tables and a save seed:

- one guardian/family member;
- one close friend;
- one classmate or rival;
- one teacher, coach, or neighbourhood mentor.

Each person has a diverse South African-leaning first name, role, a simple personality tag, starting score, and a short reaction style. Their seed makes the same save stable across reloads. They can become the face of school moments, relationship events, job leads, and later check-ins.

This is not a full dynamic NPC simulation. NPCs do not age independently, have homes, run schedules, or generate unbounded conversations in v0.9. Existing relationship entries continue to work; generated people simply provide a varied initial circle.

## Time, aging, and life endings

### Daily time

Normal play still advances one day at a time through the existing day engine. A calendar year is 365 simulated days. A birthday is surfaced as a short milestone event; it increments age once and can include a small relationship or wellbeing effect.

### Fast-forwarding

The Time app offers:

- **One week:** resolves up to seven ordinary days.
- **One month:** resolves up to thirty ordinary days.

Skips are unavailable during school finale, a pending chase, an unfinished day, an unresolved travel problem, or an active decision. While a skip runs, normal automatic settlement continues: salary/business income, wages, driver income, routine stat drift, transport resets, and delayed events. A skip stops early and returns the player to a single decision if it encounters a job result, promotion/dismissal, business closure, low-cash pressure, critical health, a relationship milestone, a vehicle problem, or another flagged high-impact event.

The result is a compact summary of no more than three important outcomes and any net cash change. It must never double-settle a day or swallow an existing v0.8 consequence.

### Later life and endings

`adult` becomes `later-life` at age 60. Later-life check-ins become more likely during skips and ordinary play. Health influences the risk and quality of these moments. A life ending becomes eligible from age 70; neglected health raises risk, while stronger health can delay it. At age 100, the game concludes the life without another random-risk roll.

An ending is a respectful final card and life summary: age, days lived, career/business highlights, relationships, net worth, and one memorable achievement. The player can return to the title screen and begin another life. v0.9 does not depict graphic illness or death, nor introduce arbitrary early-death events.

## State, migration, and module boundaries

The save schema advances from 8 to 9. New state is isolated under clear domains:

- `life`: stage, school progress, exam result, birth-year/day counter, ending status, and ending summary;
- `people`: generated roster seed and stable NPC records, extending rather than replacing `relationships.people`;
- `phone`: selected app and optional app notification state;
- `timeline`: skip status, skip summaries, and interruption metadata.

The schema validator owns defaulting and validation. A schema-8 save is migrated once, preserves existing data, sets `life.stage` to `adult`, generates no duplicate starting roster, and leaves the original v0.8 browser value untouched until the v0.9 save succeeds. Corrupt saves retain the existing backup/recovery behaviour.

New gameplay rules live in focused systems: `life`, `people`, `jobs`, and `timeline`. Rendering receives view models and dispatches semantic actions; it does not calculate exam results, job eligibility, aging, or skip settlement. Existing career, business, travel, event, and minigame modules remain their owners.

## Error handling and safeguards

- A failed or unavailable phone app action shows a short inline explanation and leaves the current game state unchanged.
- Ineligible job applications are disabled with a clear, compact reason.
- Re-running an already settled skipped day returns no duplicate payment or consequence.
- A missing or invalid generated person is replaced by a safe fallback record during validation.
- A page/save version mismatch blocks actions as v0.8 already does.

## Testing and acceptance

New automated coverage must prove:

- new-life state starts in school finale while v0.8 migration starts in adult life;
- generated NPC rosters are valid, varied between seeds, and stable for the same seed;
- exam outcomes lead to valid adult job options;
- Jobs app eligibility prevents daily career hopping;
- phone app model exposes only valid actions for career/business/transport states;
- week and month skips settle ordinary days once, stop on interruptions, and report compact summaries;
- a birthday increments age exactly once per 365 days;
- later-life/end eligibility follows age and health rules, and a finished life cannot continue;
- motion and phone markup retain responsive and reduced-motion contracts.

All existing v0.8 tests remain green. Manual release checks cover a new life through adult entry, a v0.8 migrated save, phone navigation on a narrow screen, both skip lengths, a skip interruption, and a completed-life summary.

## Definition of done

v0.9 is ready only when a fresh player can finish school, choose an initial adult direction, manage the existing simulation through the phone without a cluttered screen, meet different starting people across separate lives, use week/month skips safely, age through later life, and receive a complete life summary—without breaking a migrated v0.8 save or the stable v0.8 systems.
