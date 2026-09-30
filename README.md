# ONE MORE DAY — SA Edition v0.9

A mobile-first South African life and money game about finishing school, finding a path, building work or a business, handling everyday chaos, and playing a complete life one meaningful choice at a time.

## Play it

Open `index.html` in a modern browser, or serve this folder with a simple static server such as VS Code Live Server. There is no install, account, package download, or build step.

Progress saves in the current browser. v0.9 uses `one-more-day-v09`. Existing v0.8 and v0.6 saves migrate into adult life without replaying the school opening, and the original older save remains untouched for rollback.

## Included in v0.9 — Life Begins

- A short final-day-of-school opening: last morning, final exam, result, school ending, and first adult opportunity
- Four seeded starter people—guardian, friend, classmate, and mentor—with different names, traits, reactions, and stable relationships in every save
- A bright, uncluttered mobile play screen focused on one decision at a time
- An interactive phone with Jobs, Transport, Business, People, Life, and Time apps
- Compact job applications plus owner-operated car-wash and buy-and-resell startup entry
- One-week and one-month fast-forwarding that settles routine income only once and stops for important moments
- Birthdays, later life from age 60, health-influenced endings from age 70, and deterministic completion at age 100
- A respectful final summary covering work, relationships, net worth, and a memorable achievement
- All stable v0.8 systems: career progression, nuanced warning/dismissal rules, scalable businesses, transport choices, South African daily events, money feedback, and the three-lane phone-theft chase
- Responsive controls, keyboard support, reduced-motion fallbacks, save migration, and GitHub Pages compatibility

## Project structure

```text
index.html                    Production game entry
v09-life-begins.css           Bright v0.9 interface and phone styles
v08-sa-edition.css            Stable v0.8 base and runner styles
js/core/state.js              Schema 9, validation, saves and migration
js/data/                      Economy, event, school, job and people content
js/systems/                   Life, day, jobs, timeline and v0.8 simulations
js/minigames/                 Fair seeded phone-theft runner
js/ui/                        Rendering, phone model and money feedback
tests/                        Logic, migration, syntax and production checks
assets/credits.md             Cover-image attribution
```

## Run the checks

Run each `.mjs` file in `tests/` with Node.js. The suite covers the v0.8 foundation and the complete v0.9 school, people, phone, timeline, aging, migration, and ending flows.

## GitHub Pages

Push the repository to GitHub, then select **Settings → Pages → Deploy from a branch → main / root**. GitHub publishes the game at the repository Pages address after its workflow finishes.

## Cover image attribution

The cover photograph is a locally stored 960-pixel derivative of **SouthAfricanMinibus.jpg** by **Martinvl** (8 November 2016), used under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). It is responsively cropped with a readability treatment and South African-inspired colour accents. Full source and modification credit: `assets/credits.md`.
