# ONE MORE DAY — Prototype v0.1

A small, mobile-first life and money simulator set in a South African-inspired city. Build cash, protect your wellbeing, choose wants versus wealth, try a tiny business, and survive one chaotic week.

## Play locally

No installation or build tools are needed.

1. Download or copy this folder.
2. Open `index.html` in Chrome, Edge, Firefox, or Safari.
3. Start a new life.

For the most consistent local experience, you can also serve the folder with any static web server, for example VS Code's **Live Server** extension.

## Publish with GitHub Pages

1. Create a GitHub repository and add all files from this folder.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the `main` branch and `/ (root)` folder, then save.
5. GitHub will provide a public link after deployment finishes.

## Included in v0.1

- A seven-day playable loop with a Week 1 summary
- Three career paths with automatic daily work, experience, and promotions
- One-time career-specific equipment purchases, workers, passive team income, and unlockable opportunities
- Promotion milestone bonuses so progress creates noticeable rewards
- Choice events, a want-versus-wealth dilemma, and a small-business investment
- A phone-theft chase whose outcome uses stats and chance
- Cash, net worth, health, energy, knowledge, social, happiness, and reputation
- Automatic browser saving with `localStorage`
- Responsive, touch-friendly layout

## Project structure

```text
one-more-day/
├── index.html          Game screens and interface
├── styles.css          Mobile-first visual design
├── js/
│   └── game.js         State, events, economy, saving, and progression
├── README.md           Setup and publishing guide
└── TESTER_CHECKLIST.md Short playtest script
```

## Expanding later

Add new daily events to the `events` object in `js/game.js`, or add hustles to the `hustles` array. The state and rendering functions are kept separate enough to extend the week, add achievements, or introduce deeper businesses later.

All progress is stored only in the current browser. Clearing site data resets the save.
