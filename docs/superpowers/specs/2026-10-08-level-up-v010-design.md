# ONE MORE DAY v0.10 — LEVEL UP Design

Status: approved in conversation on 8 October 2026. This document defines the implementation boundary for v0.10.

## Product intent

LEVEL UP expands ONE MORE DAY from a school-to-work life simulator into a connected education-and-career game. A player can enter work immediately, build a business without formal study, or pursue a short qualification journey that opens stronger career opportunities. Education must create difficult trade-offs without becoming a repetitive classroom simulator.

The v0.9 promise remains unchanged: the simulation may be complicated underneath, but the screen stays simple. The player sees one important choice at a time, with management systems inside the phone.

## Player outcomes

The release succeeds when a player can:

- compare several recognisably South African education routes after school;
- understand why a route is open or locked and see one practical way to improve eligibility;
- choose between personal payment, a bursary application, a study loan, work income, or a paid learnership when appropriate;
- finish a qualification through two major decisions and one final assessment rather than repeated daily study actions;
- recover from weak school results through bridging, experience, knowledge growth, or a later application;
- use qualifications and experience to access five deeper career families;
- apply, interview, progress, receive nuanced discipline, and potentially be dismissed without outcomes feeling predetermined;
- continue using every stable v0.9 business, transport, relationship, timeline, chase, aging, and ending system;
- load a v0.9 save without losing work, money, assets, people, or life progress.

## Design principles

1. Education creates opportunity; it is not the only route to wealth or a satisfying life.
2. One weak result may create a setback but never permanently ruin a life.
3. Qualifications unlock access, not guaranteed employment or promotions.
4. Experience can compensate for weaker education in appropriate careers.
5. Choices show understandable trade-offs without labelling a guaranteed good or bad answer.
6. Real South African structures inspire the content, but fictional providers and compressed timelines keep the game clear and maintainable.
7. The game never implies that its fictional bursary, loan, college, or eligibility rules are official advice.

## Release scope

### Included

- A Study phone app.
- Ten data-driven qualification programmes.
- Bridging, learnership, occupational/TVET, self-taught, diploma, and university-style routes.
- Five career families with five levels each.
- Funding applications, fees, stipends, study debt, and repayments.
- Study strategy, pressure, and assessment decisions.
- Compact interviews and education-aware job eligibility.
- Education and interview milestones that interrupt fast-forwarding.
- NPC job leads and references using the v0.9 generated roster.
- Schema-10 state, validation, migration, automated tests, responsive UI, and reduced-motion behaviour.

### Excluded

- A campus map or separate student-game mode.
- Daily class attendance simulation.
- Real institution or funding-provider names.
- Exact reproduction of government funding rules.
- Province migration, housing, romance, children, or the larger social-life expansion.
- A full professional licensing simulation.
- New business families unrelated to the selected qualification paths.

## Core player journey

After the school finale, the Jobs app still offers immediate work and startup paths. The new Study app offers education routes in parallel.

The education loop is:

1. Compare route cards.
2. Select an eligible qualification or inspect a locked route.
3. Choose an available funding method.
4. Make a starting-strategy decision.
5. Resolve one qualification-specific pressure event.
6. Make a final-assessment decision.
7. Receive a distinction, pass, rewrite, incomplete, or withdrawal outcome.
8. Use the result in the Jobs app or pursue a recovery route.

Only one qualification can be active at a time. A player may keep an existing job or business while studying unless the selected route is a paid learnership that occupies the player’s work path. Balancing work and study raises financial security but increases energy and performance pressure.

## Qualification catalogue

The initial catalogue contains ten fictional programmes. Names are plain-language game labels, not claims of formal accreditation.

| ID | Route | Field | Typical access | Primary unlock |
| --- | --- | --- | --- | --- |
| `foundation-bridge` | Bridging | General | Always available after school | Improves access score for locked routes |
| `office-admin-learnership` | Learnership | Business | Basic school completion | Business and administration entry |
| `digital-support-learnership` | Learnership | Technology | Basic knowledge threshold | Technology support entry |
| `construction-skills-learnership` | Learnership | Trades | Health and energy threshold | Trade assistant/learner entry |
| `electrical-trade-certificate` | Occupational/TVET | Trades | School or bridge threshold | Artisan pathway |
| `hospitality-tourism-certificate` | Occupational/TVET | Hospitality | School or reputation threshold | Hospitality pathway |
| `business-finance-diploma` | College/diploma | Business | Moderate exam and knowledge score | Analyst/coordinator pathway |
| `self-taught-digital-certificate` | Self-taught | Technology | Cash or time commitment | Technology trainee entry |
| `computing-degree` | University-style | Technology | Strong exam/knowledge score or bridge plus experience | Specialist pathway |
| `community-development-degree` | University-style | Community | Strong exam/social/reputation score or bridge | Community/public-service pathway |

Eligibility is data-driven. Each programme defines exam, knowledge, reputation, experience, prior-qualification, cash, and life-stage conditions. A locked card displays the first actionable unlock route, such as completing a bridge, increasing knowledge, or gaining relevant experience.

## Compressed qualification timing

The player selected quick qualifications. Game time remains meaningful but is compressed:

- bridging routes span 14 simulated days;
- self-taught and learnership routes span 21 simulated days;
- TVET, diploma, and university-style routes span 30 simulated days.

Each qualification has three checkpoints: strategy, pressure, and assessment. Checkpoint days are stored when the course starts. The Time app may advance toward the next checkpoint, but the existing timeline engine still settles each routine day exactly once and stops for any higher-priority consequence.

The game never asks the player to click “study” every day.

## Eligibility and second chances

An access score uses programme-specific weights across:

- school exam band;
- knowledge;
- reputation or social skill where relevant;
- completed qualifications;
- relevant career experience;
- bridging completion;
- a small save-seeded variance.

Hard locks are limited to life stage, already-active study, incompatible active learnership/work, or a missing prerequisite qualification. Score-based locks are recoverable.

The Foundation Bridge improves education access and knowledge but does not itself guarantee admission. Relevant work experience can unlock selected learnership, TVET, diploma, or self-taught paths. Rewrites preserve course progress and do not charge the full fee again.

## Funding

Funding methods are programme-specific and may include:

- **Personal payment:** tuition is paid immediately with no debt.
- **Fictional bursary:** an application resolves from exam strength, knowledge, reputation, need, and seeded variance. Rejection leaves the course unstarted and charges no tuition.
- **Study loan:** tuition is covered and a debt record is created. Repayment begins after course completion or withdrawal.
- **Existing work income:** the player keeps a job or business, with recurring energy and study-focus pressure.
- **Part-time work package:** available only when the player has no active job or business; adds modest routine income and an energy penalty.
- **Paid learnership:** adds a stipend during the course and workplace-performance decisions. Starting one requires leaving an incompatible active career after explicit confirmation.

Debt is stored as a list of liabilities under finances. Each liability has original principal, outstanding balance, next payment day, payment amount, and status. Payments settle at most once per due period. Insufficient cash records an arrears consequence instead of silently creating negative duplicate charges.

## Qualification decisions and outcomes

Every programme uses the same three-beat structure with field-specific text.

### Strategy

The player chooses among approaches such as focused study, balancing income, or relying on existing ability. This establishes focus, energy, attendance, and financial modifiers.

### Pressure

One contextual problem appears: transport failure, household responsibility, data costs, group-work conflict, an extra shift, a workplace mistake, or a tempting shortcut. Choices affect the final assessment inputs and may alter cash, relationships, reputation, or job performance.

### Assessment

The final choice combines preparation, legitimate help, confidence, or a risky shortcut. Outcomes use accumulated focus, knowledge, energy, attendance, integrity, relevant experience, and seeded variance.

Outcome bands are:

- **Distinction:** qualification completed with an interview and promotion advantage.
- **Pass:** qualification completed with normal career access.
- **Rewrite required:** course remains active at the final checkpoint; a smaller rewrite cost or delay applies.
- **Incomplete:** partial progress is retained and may reduce a later retry.
- **Withdrawal:** the course closes; experience and debt already incurred remain.

Risky shortcuts may improve the immediate score but can trigger a delayed integrity consequence. The choice text never announces the exact risk.

## Career families and ladders

The Jobs app supports five families with five levels each.

| Family | Level 1 | Level 2 | Level 3 | Level 4 | Level 5 |
| --- | --- | --- | --- | --- | --- |
| Trades | Trade Assistant | Learner/Apprentice | Qualified Artisan | Foreperson | Site Supervisor/Contractor |
| Technology | Support Trainee | Technician | Systems Specialist | Team Lead | IT Manager/Consultant |
| Business | Office Junior | Administrator | Coordinator/Analyst | Supervisor | Department Manager |
| Hospitality | Assistant/Server | Experienced Staff | Shift Leader | Supervisor | Operations Manager |
| Community | Support Assistant | Officer | Senior Officer | Programme Coordinator | Programme Manager |

Each role defines salary, minimum access, relevant qualifications, experience expectation, and workplace decision deck. Higher education may permit a higher entry point but never skips every practical-experience requirement.

The existing office career migrates into the Business family at the closest matching level. Its role, salary, performance, boss relationship, coworker relationship, attendance, warnings, and dismissal history are preserved.

## Applications and interviews

The Jobs app displays at most three relevant openings. Ordering favours jobs the player can realistically pursue and avoids repeating the same rejected opening every day.

An application can be rejected before interview, invite the player immediately, or create a short pending result. Interviews are concise decision cards. Answers may emphasise honesty, confidence, experience, a referral, boundary-setting, or an exaggerated promise.

The interview score uses:

- role eligibility;
- qualification result;
- relevant experience;
- knowledge and reputation;
- referral strength;
- the selected answer against employer culture;
- prior dismissal history where appropriate;
- seeded variance.

The interface does not label an answer as correct. Rejection creates a cooldown for that exact opening but does not block the entire family.

## Workplace progression and discipline

Daily work continues automatically. Contextual workplace decisions remain the main way the player influences performance, relationships, readiness, and conduct.

Promotion considers performance, attendance, experience, relevant education, boss and coworker relationships, reputation, warnings, promotion-panel choices, and controlled random chance.

The existing warning rule remains authoritative: a bad choice does not automatically create a formal warning. Severity, performance, previous warnings, attendance, boss relationship, communication, and chance determine whether the player gets away with it, loses performance, receives a verbal warning, receives a written warning, or faces stronger consequences for repeated or severe conduct.

Generated friends and mentors may provide leads or references. A lead reveals an opening; a reference improves access to an interview. Neither guarantees employment.

## Phone and main-screen experience

The phone app order becomes Jobs, Study, Transport, Business, People, Life, and Time.

The Study home shows compact cards for:

- available programmes;
- the active programme and next checkpoint;
- funding status;
- completed and incomplete qualifications.

Route cards show only the programme, field, access state, cost or stipend, duration, and primary unlock. Opening a card reveals actions and the first eligibility improvement. Walls of text are prohibited.

Applications, funding outcomes, pressure events, assessments, interviews, and promotion panels render through the normal single-decision card. The Life app gains a compact résumé card for qualifications, debt, career family, experience, and notable results.

Motion is brief and purposeful: application stamps, progress fills, qualification celebrations, and opportunity badges. All motion honours reduced-motion preferences.

## Event priority and fast-forwarding

Education milestones are important interruptions. The timeline engine stops before:

- funding results;
- strategy, pressure, or assessment decisions;
- a rewrite deadline;
- an interview or job result;
- a study-loan arrears consequence;
- existing higher-priority v0.9 moments.

Routine course time, work income, business income, stipends, wages, driver income, debt payments, and stat drift settle once per simulated day. A settled-day identifier prevents duplicate financial effects across reloads and skips.

The Time app adds a contextual “Next study checkpoint” action while a course is active. It delegates to the timeline engine rather than implementing a second skip system.

## State and migration

The schema advances from 9 to 10.

Schema 10 uses the new browser key `one-more-day-v10`. The existing `one-more-day-v09` value remains untouched as a rollback source until a validated schema-10 save has been written successfully.

New state domains are:

- `education`: applications, active programme, completed results, incomplete results, access modifiers, last outcome, and checkpoint history;
- `finances.liabilities`: study debts and repayment state;
- extended `career`: family ID, employer profile, experience, interview history, and opening cooldowns;
- extended `jobs`: pending interview and education-aware applications;
- extended `timeline`: education milestone metadata.

Validation owns all defaults and bounds. Unknown programme, role, employer, liability, or checkpoint IDs fall back safely without blocking the save.

Migration from schema 9:

- preserves the complete v0.9 state;
- creates an empty education record and no fictional qualifications;
- maps an active office career into the Business family at the closest level;
- leaves active businesses unchanged;
- creates no debt;
- preserves the original v0.9 browser save key until the schema-10 save succeeds.

## Module boundaries

New or expanded modules have one owner each:

- `js/data/education.js`: programme, funding, checkpoint, and outcome content;
- `js/data/jobs.js`: career families, roles, openings, and employer cultures;
- `js/systems/education.js`: eligibility, enrolment, funding, checkpoints, assessment, and qualification results;
- `js/systems/jobs.js`: openings, applications, interviews, cooldowns, and career entry;
- `js/systems/career.js`: workplace progression, promotion, warnings, and dismissal;
- `js/systems/timeline.js`: milestone interruption and once-only settlement;
- `js/core/state.js`: schema, validation, migration, save, and recovery;
- `js/ui/phone.js`: Study and Jobs view models only;
- `js/ui/render.js`: accessible markup and semantic action dispatch;
- `js/app.js`: coordination and persistence, not business rules.

Education rules must not be calculated in rendering code. Financial settlement must not be duplicated in the Study app.

## Error handling and safeguards

- A player cannot start two qualifications.
- A failed bursary application charges no tuition.
- A failed enrolment leaves state unchanged and displays one short reason.
- A duplicate checkpoint action returns the existing result without charging or rewarding again.
- A rewrite never charges full tuition a second time.
- Loan payments settle once per due period.
- Starting an incompatible paid learnership requires an explicit leave-career confirmation.
- A page/save-version mismatch blocks mutations and asks for refresh.
- Corrupt schema-10 saves retain the existing backup and recovery behaviour.
- A missing content ID produces a safe fallback card and never traps the player in an unfinished day.

## Testing strategy

New automated coverage must prove:

1. schema-9 saves migrate without invented education, debt, or lost career data;
2. all ten programme records validate and expose a recovery hint when locked;
3. poor exam results can recover through bridging, experience, or knowledge;
4. only one active qualification can exist;
5. bursary rejection, personal payment, loans, part-time work, and learnership stipends settle correctly;
6. qualification checkpoints cannot resolve twice;
7. identical save seeds and choices produce stable results;
8. distinction, pass, rewrite, incomplete, and withdrawal states unlock only valid actions;
9. career openings respect education and experience without daily repetition;
10. interviews and promotions use valid employer/career rules;
11. the nuanced warning ladder remains intact;
12. fast-forwarding stops at education and interview milestones and never double-settles money;
13. a finished life cannot enrol, apply, interview, or continue work;
14. all existing v0.8 and v0.9 tests remain green;
15. production JavaScript parses and the index references every required module and stylesheet.

Manual checks cover a fresh school-to-study life, a work-first life, a weak-result bridge, each funding method, a paid learnership, an employed student, an interview rejection and retry, a promotion, a dismissal, a migrated v0.9 career, both time skips, 320-pixel width, 200% zoom, keyboard use, and reduced motion.

## Definition of done

v0.10 is complete only when a fresh or migrated player can deliberately choose work, business, or study; finish a short qualification journey; recover from weak results; fund education without duplicated money; unlock and interview for deeper jobs; progress through a career whose discipline rules remain nuanced; and use the entire experience on a narrow mobile screen without losing any stable v0.9 behaviour.

After all tests and smoke checks pass, the verified build is published to GitHub Pages and handed off with a cache-busted public test link.

## Authenticity references

- South African Government, 2026 post-school readiness statement: https://www.gov.za/news/media-statements/minister-buti-manamela-state-readiness-2026-academic-year-15-sep-2025
- Department of Employment and Labour, learnership requirements: https://www.labour.gov.za/DocumentCenter/Pages/Basic-Guide-to-Learnership-Requirements.aspx
- Department of Basic Education, public TVET programme fields: https://www.education.gov.za/Curriculum/CurriculumStatements/FurtherEducationandTrainingColleges.aspx
- SAQA, National Qualifications Framework overview: https://saqa.org.za/wp-content/uploads/2023/02/National-Qualifications-Framework.pdf
