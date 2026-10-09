import assert from "node:assert/strict";
import { createDefaultState } from "../js/core/state.js";
import {
  EDUCATION_PROGRAMMES,
  FUNDING_OPTIONS,
  getProgrammeById,
} from "../js/data/education.js";
import {
  getStudyEligibility,
  getStudyOptions,
} from "../js/systems/education.js";

const expectedIds = [
  "foundation-bridge",
  "office-admin-learnership",
  "digital-support-learnership",
  "construction-skills-learnership",
  "electrical-trade-certificate",
  "hospitality-tourism-certificate",
  "business-finance-diploma",
  "self-taught-digital-certificate",
  "computing-degree",
  "community-development-degree",
];

assert.deepEqual(EDUCATION_PROGRAMMES.map((programme) => programme.id), expectedIds);
assert.ok(Object.isFrozen(EDUCATION_PROGRAMMES));
assert.ok(Object.isFrozen(FUNDING_OPTIONS));

for (const programme of EDUCATION_PROGRAMMES) {
  assert.ok(programme.route, `${programme.id}: route`);
  assert.ok(programme.field, `${programme.id}: field`);
  assert.ok(Number.isInteger(programme.durationDays), `${programme.id}: duration`);
  assert.ok(Number.isFinite(programme.cost), `${programme.id}: cost`);
  assert.ok(programme.eligibility && typeof programme.eligibility === "object", `${programme.id}: eligibility`);
  assert.ok(Array.isArray(programme.fundingIds), `${programme.id}: funding`);
  assert.ok(Array.isArray(programme.careerUnlocks), `${programme.id}: career unlocks`);

  if (programme.route === "bridging") assert.equal(programme.durationDays, 14);
  if (["self-taught", "learnership"].includes(programme.route)) assert.equal(programme.durationDays, 21);
  if (["occupational", "diploma", "university-style"].includes(programme.route)) {
    assert.equal(programme.durationDays, 30);
  }
}

assert.equal(getProgrammeById("computing-degree")?.title, "Computing Degree");
assert.equal(getProgrammeById("missing-programme"), null);

function adultState() {
  const state = createDefaultState();
  state.life.stage = "adult";
  state.life.school.step = "complete";
  state.life.examResult = { score: 42, band: "developing", label: "Needs practice" };
  state.dailyState.complete = true;
  state.dailyState.phase = "complete";
  state.stats.knowledge = 30;
  state.stats.social = 40;
  state.stats.reputation = 35;
  return state;
}

for (const stage of ["school-finale", "ended"]) {
  const state = adultState();
  state.life.stage = stage;
  assert.equal(getStudyOptions(state).some((option) => option.eligible), false);
}

const unfinished = adultState();
unfinished.dailyState.complete = false;
unfinished.dailyState.phase = "headline";
assert.equal(getStudyEligibility(unfinished, "foundation-bridge").eligible, false);
assert.match(getStudyEligibility(unfinished, "foundation-bridge").reason, /finish|decision|day/i);

const weak = adultState();
const lockedDegree = getStudyEligibility(weak, "computing-degree");
assert.equal(lockedDegree.eligible, false);
assert.ok(lockedDegree.reason);
assert.ok(lockedDegree.unlockHint);

const secondChance = adultState();
secondChance.education.completed.push({
  programmeId: "foundation-bridge",
  outcome: "pass",
  completedDay: 18,
});
secondChance.education.accessModifiers.bridgeBonus = 18;
secondChance.education.accessModifiers.experienceByField.technology = 35;
assert.equal(getStudyEligibility(secondChance, "computing-degree").eligible, true);

const experienced = adultState();
experienced.education.accessModifiers.experienceByField.trades = 28;
assert.equal(getStudyEligibility(experienced, "electrical-trade-certificate").eligible, true);

const invalidActive = adultState();
invalidActive.education.active = { programmeId: "removed-programme" };
const before = JSON.stringify(invalidActive);
const safeOptions = getStudyOptions(invalidActive);
assert.equal(safeOptions.length, 10);
assert.equal(safeOptions.every((option) => option.eligible === false), true);
assert.equal(JSON.stringify(invalidActive), before);
assert.ok(safeOptions.every((option) => Array.isArray(option.availableFundingIds)));

console.log("v0.10 education eligibility: catalogue and second chances passed");
