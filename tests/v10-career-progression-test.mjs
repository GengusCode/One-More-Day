import assert from "node:assert/strict";
import { createDefaultState } from "../js/core/state.js";
import {
  CAREER_FAMILIES,
  EMPLOYER_CULTURES,
} from "../js/data/jobs.js";
import {
  CAREER_ROLES,
  startCareer,
  settleCareerDay,
  getPromotionDecision,
  resolvePromotionDecision,
} from "../js/systems/career.js";

assert.deepEqual(
  CAREER_FAMILIES.map((family) => family.id),
  ["trades", "technology", "business", "hospitality", "community"],
);
assert.ok(EMPLOYER_CULTURES.length >= 3);

const roleIds = new Set();
for (const family of CAREER_FAMILIES) {
  assert.equal(family.roles.length, 5, family.id);
  for (const role of family.roles) {
    assert.equal(roleIds.has(role.id), false, role.id);
    roleIds.add(role.id);
    assert.ok(role.salary > 0, `${role.id}: salary`);
    assert.ok(Number.isFinite(role.minExperience), `${role.id}: experience metadata`);
    assert.ok(Array.isArray(role.minQualifications), `${role.id}: qualification metadata`);
  }
}
assert.equal(roleIds.size, 25);
assert.equal(CAREER_ROLES.length, 5);
assert.equal(CAREER_ROLES[0].name, "Office Junior");

const legacy = startCareer(createDefaultState(), "office");
assert.equal(legacy.career.familyId, "business");
assert.equal(legacy.career.pathId, "office");
assert.equal(legacy.career.role, "Office Junior");

const selectedEntry = startCareer(createDefaultState(), "technology", {
  roleIndex: 1,
  employerId: "innovative",
});
assert.equal(selectedEntry.career.familyId, "technology");
assert.equal(selectedEntry.career.roleIndex, 1);
assert.equal(selectedEntry.career.employerId, "innovative");

const fallback = startCareer(createDefaultState(), "removed-family", {
  roleIndex: 99,
  employerId: "removed-employer",
});
assert.equal(fallback.career.familyId, "business");
assert.equal(fallback.career.roleIndex, 0);
assert.equal(fallback.career.employerId, "neutral");

function promotionReady() {
  const state = startCareer(createDefaultState(), "business", { employerId: "results-first" });
  state.calendar.day = 12;
  state.dailyState.day = 12;
  state.career.performance = 92;
  state.career.readiness = 90;
  state.career.boss = 84;
  state.career.coworkers = 82;
  state.career.attendanceStreak = 14;
  state.career.experience = 40;
  state.stats.knowledge = 78;
  state.stats.reputation = 75;
  state.education.completed.push({
    programmeId: "office-admin-learnership",
    outcome: "pass",
    score: 70,
  });
  return state;
}

const settled = settleCareerDay(promotionReady(), { day: 12, attendance: "present" });
assert.equal(settled.state.career.roleIndex, 0);
assert.ok(settled.state.career.pendingPromotion);
assert.equal(settled.status.promotion, false);
assert.equal(settled.status.promotionPending, true);
const panel = getPromotionDecision(settled.state);
assert.equal(panel.choices.length >= 3, true);
assert.equal(panel.choices.every((choice) => choice.action === "CHOOSE_PROMOTION"), true);

const promoted = resolvePromotionDecision(settled.state, "show-results", { random: () => 0 });
assert.equal(promoted.ok, true);
assert.equal(promoted.status.promoted, true);
assert.equal(promoted.state.career.roleIndex, 1);
assert.equal(promoted.state.career.role, "Administrator");
assert.equal(promoted.state.career.pendingPromotion, null);

const weakInput = promotionReady();
weakInput.career.performance = 78;
weakInput.career.readiness = 75;
weakInput.career.boss = 58;
weakInput.career.coworkers = 60;
weakInput.stats.reputation = 58;
const weakSettled = settleCareerDay(weakInput, { day: 12, attendance: "present" }).state;
const weakBefore = {
  roleIndex: weakSettled.career.roleIndex,
  performance: weakSettled.career.performance,
  readiness: weakSettled.career.readiness,
};
const weakPanel = resolvePromotionDecision(weakSettled, "wing-it", { random: () => 0.99 });
assert.equal(weakPanel.ok, true);
assert.equal(weakPanel.status.promoted, false);
assert.equal(weakPanel.state.career.roleIndex, weakBefore.roleIndex);
assert.ok(
  weakPanel.state.career.performance < weakBefore.performance
    || weakPanel.state.career.readiness < weakBefore.readiness,
);
assert.equal(weakPanel.state.career.pendingPromotion, null);

console.log("v0.10 career progression: five ladders and promotion panels passed");
