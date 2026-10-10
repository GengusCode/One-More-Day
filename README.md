# ONE MORE DAY — SA Edition v0.10

A mobile-first South African life and money game about finishing school, finding a route into work, building a career or owner-operated business, and living with one meaningful choice at a time.

## Play it

Play the public build at [genguscode.github.io/One-More-Day](https://genguscode.github.io/One-More-Day/).

For a local copy, download the repository and open `index.html` in a modern browser. A simple static server such as VS Code Live Server is recommended. There is no install, account, package download, or build step.

Progress saves in the current browser under `one-more-day-v10`. Existing v0.9, v0.8, and v0.6 saves migrate forward without replaying school or inventing qualifications and debt; older saves remain untouched for rollback.

## Included in v0.10 — Level Up

- A final school test with weak, pass, and strong results—and recoverable routes after a weak result
- Ten short study routes: bridge, learnership, occupational, diploma, self-taught, and university-style options
- Personal payment, bursaries, study loans, current work, part-time work, and paid learnership funding
- Three meaningful study checkpoints covering strategy, pressure, and assessment, with rewrite and recovery outcomes
- Five career families with five roles each: Trades, Technology, Business, Hospitality, and Community
- Rotating job openings, referrals, delayed application replies, interactive interviews, rejection cooldowns, and promotion panels
- A nuanced work discipline ladder where context can lead to no action, performance loss, a verbal warning, a written warning, or dismissal for serious/repeated behaviour
- A cleaner seven-app phone launcher: Jobs, Study, Transport, Business, People, Life, and Time
- Bank and Betway preserved inside Life → Money & games, keeping the home screen uncluttered
- A compact résumé, qualification record, study progress, debt visibility, and one-tap travel to the next study checkpoint
- All v0.9 systems: generated starter people, aging and life endings, one-week/one-month/year skips, scalable businesses, South African daily events, vehicle choices, and the three-lane phone-theft chase
- Responsive controls, keyboard support, reduced-motion fallbacks, save migration, and GitHub Pages compatibility

## Project structure

```text
index.html                    Production game entry (schema/version 0.10)
v10-level-up.css              v0.10 colour, motion, phone and Study polish
v09-life-begins.css           Stable v0.9 interface base
v08-sa-edition.css            Stable runner and simulation base
js/core/state.js              Schema 10, validation, saves and migrations
js/data/education.js          Ten programmes, funding and study decisions
js/data/jobs.js               Five career families and employer cultures
js/systems/education.js       Eligibility, enrolment, finance and outcomes
js/systems/jobs.js            Openings, applications, referrals and interviews
js/systems/career.js          Career settlement, warnings and promotions
js/systems/timeline.js        Week/month/year and study-checkpoint skips
js/minigames/                 Seeded phone-theft runner
js/ui/                        Main renderer, phone apps and money feedback
tests/                        Logic, migration, integration and release checks
assets/credits.md             Cover-image attribution
```

## Run the checks

Node.js is only needed for development checks. Run each `.mjs` file in `tests/`; run `syntax-check.mjs` with Node's `--experimental-vm-modules` option. The suite covers the v0.7–v0.10 regressions, schema migration, education finance, study outcomes, jobs, interviews, promotion panels, end-to-end progression, syntax, and production entry files.

## GitHub Pages

Push the repository to GitHub, then choose **Settings → Pages → Deploy from a branch → main / root**. GitHub publishes the static game after its Pages workflow completes. No secrets, server, or build command are required.

## Cover image attribution

The cover photograph is a locally stored 960-pixel derivative of **SouthAfricanMinibus.jpg** by **Martinvl** (8 November 2016), used under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). It is responsively cropped with a readability treatment and South African-inspired colour accents. Full source and modification credit: `assets/credits.md`.
