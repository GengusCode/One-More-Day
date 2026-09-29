# ONE MORE DAY — SA Edition v0.8

A mobile-first browser life and money game built around South African everyday pressure, owner-run hustles, career choices, relationships, transport chaos, and one tense phone-theft chase.

## Play it

Open index.html in a modern browser, or serve this folder with any simple static server such as VS Code Live Server. No installation, account, or build process is required.

Your progress saves on the current browser only. A new v0.8 save uses one-more-day-v08; older v0.6/v0.7 saves migrate safely while the original save is kept untouched for rollback.

## Included in v0.8

- Name and gender setup with equal starting odds and gender-based pronouns/avatar only
- Compact Day/Age/Cash/Energy HUD with expandable wellbeing, work, relationship, and asset panels
- Automatic daily career or business settlement, with meaningful work/owner decisions rather than repeated job picking
- Corporate performance, boss and co-worker relationships, promotions, verbal/written warnings, and dismissal for severe or repeated behaviour
- Owner-operated car-wash, moving/helping, and buy-and-resell startups: one-time equipment, employees, trust, sites, growth, closure and restart
- Taxi, e-hailing, bicycle, car, e-hailing-driver income, strike, surge, full-taxi passage, flat tyre, breakdown, and Stay Home outcomes
- Shuffled daily events, contextual follow-ups, delayed consequences, and South African community details
- Ordered +R/−R money animations
- Original three-lane phone-theft chase with touch, A/D, arrows, buttons, pause/resume, and fallback controls
- Responsive, keyboard-friendly static website suitable for GitHub Pages

## Project structure

```text
index.html                    Production game entry
v08-sa-edition.css            SA Edition interface and responsive styling
js/core/state.js              Schema v8, validation, saves and migration
js/data/                      Economy values and event content
js/systems/                   Day, career, business, travel and relationships
js/minigames/                 Fair seeded phone-theft runner
js/ui/                        Rendering and money feedback
tests/                        Logic and production smoke checks
assets/credits.md             Cover-image attribution
```

## GitHub Pages

Push the repository to GitHub, then select **Settings → Pages → Deploy from a branch → main / root**. GitHub publishes the game at the repository Pages address after its workflow finishes.

## Cover image attribution

The cover photograph is a locally stored 960-pixel derivative of **SouthAfricanMinibus.jpg** by **Martinvl** (8 November 2016), used under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). It is responsively cropped with a dark readability gradient and flag-colour overlay. Full source and modification credit: assets/credits.md.
