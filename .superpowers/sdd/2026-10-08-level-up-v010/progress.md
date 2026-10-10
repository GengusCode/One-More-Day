# SDD ledger — plan: docs/superpowers/plans/2026-10-08-level-up-v010.md

## Setup

- Execution: Native, sequential, test-driven.
- Ruling: No local `.git` metadata and shell execution is blocked; implement in the shared workspace, verify each task locally with Node, and publish each verified task as a GitHub contents commit — cost if wrong: task boundaries rely on connector commits instead of local commit ancestry.
- Ruling: The initial local snapshot predated several already-published v0.9 systems. The workspace was reconciled byte-for-byte to the deployed GitHub runtime and test baseline before reapplying Task 1 — cost if wrong: none of the newer entrance-exam, household, vehicle, betting, routine-event, or UI work may be regressed by v0.10.

## Pre-flight interfaces

- Task 1 → Tasks 2–7: schema-10 state shape and exported constants must match every downstream consumer — clean.
- Task 2 → Tasks 3 and 7: education catalogue and eligibility selectors must share stable IDs and reason codes — clean.
- Task 3 → Task 4: active-study records and financial settlement must be consumable by study progression — clean.
- Task 4 → Task 7: study decisions and timeline milestones must expose stable UI actions — clean.
- Task 5 → Task 6: career catalogue, career-start, and promotion interfaces must match the jobs system — clean.
- Tasks 2–6 → Task 7: system selectors and mutations must match the phone app actions — clean.
- Task 7 → Task 8: v0.10 entry files, visible version, and UI hooks must satisfy release checks — clean.

## Task progress

- Task 1: complete (GitHub commit `acb2af1fef1b4e5d3f01b84aed6b6407550f8a09` on `v0.10-level-up`; focused migration, foundation, and v0.9 life-state tests PASS).
- Task 2: complete (GitHub commit `0908a80dd27c5c70e94b6567393f290cadf09819`; catalogue, eligibility, and migration regressions PASS).
- Task 3: complete (GitHub commit `fee9cc96df670dbc2ebcc789ca97d725ff3eabed`; enrolment, funding, debt, and migration tests PASS).
- Task 4: complete (GitHub commit `488bf552d50de1b37bb6733496fbaa343a1e48d4`; study progress, timeline, and v0.9 timeline/travel regressions PASS).
- Task 5: complete (GitHub commit `c53493311ebc9e3be8eb38fa4f4349201b2201b6`; career, warning, smoke, and travel/business regressions PASS).
- Task 6: complete (GitHub commit `9a904b8cc12deb1edc218fedb3be1174ed393252`; jobs, interview, school, career, event, and timeline regressions PASS).
- Task 7: complete (GitHub commit `698fe936ae15fa66fb0f0cf23945afc2c1b69442`; Study phone app, clean seven-app launcher, preserved Bank/Betway utilities, résumé/debt UI, action wiring, responsive polish; 46/46 test files PASS).
- Task 8: complete (v0.10 smoke coverage plus release-edge regressions; all 48/48 test files PASS; independent release re-review found no remaining Critical or Important issues and returned READY TO MERGE. GitHub Pages verification is the post-merge release check).
