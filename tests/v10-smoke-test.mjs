import assert from "node:assert/strict";
import {
  SAVE_KEY_V10,
  createDefaultState,
  createNewLife,
  loadGame,
  migrateState,
  saveGame,
} from "../js/core/state.js";
import { ENTRANCE_QUESTIONS } from "../js/data/entrance-test.js";
import { chooseSchoolDecision } from "../js/systems/life.js";
import {
  enrolInProgramme,
  getCurrentStudyDecision,
  resolveStudyDecision,
} from "../js/systems/education.js";
import {
  applyForJob,
  getAvailableJobs,
  getInterviewDecision,
  resolveInterview,
  resolveJobApplication,
} from "../js/systems/jobs.js";
import {
  getPromotionDecision,
  resolvePromotionDecision,
  settleCareerDay,
} from "../js/systems/career.js";

class MemoryStorage {
  constructor(entries = {}) { this.values = new Map(Object.entries(entries)); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

function completeQualification(state, expectedProgrammeId) {
  let next = state;
  for (const checkpointId of ["strategy", "pressure", "assessment"]) {
    const active = next.education.active;
    assert.equal(active.programmeId, expectedProgrammeId);
    next.calendar.day = active.checkpointDays[checkpointId];
    next.dailyState.day = next.calendar.day;
    next.dailyState.phase = "complete";
    next.dailyState.complete = true;
    if (checkpointId === "assessment") {
      next.stats.knowledge = 95;
      next.stats.energy = 95;
      next.education.active.focus = 95;
      next.education.active.attendance = 95;
      next.education.active.integrity = 95;
    }
    const decision = getCurrentStudyDecision(next);
    assert.equal(decision.checkpointId, checkpointId, `${checkpointId} is a valid interruption`);
    const choice = decision.choices.find((item) => item.id === "check-everything") || decision.choices[0];
    const resolved = resolveStudyDecision(next, choice.id, { random: () => 0 });
    assert.equal(resolved.ok, true);
    next = resolved.state;
  }
  assert.equal(next.education.active, null);
  assert.ok(next.education.completed.some((entry) => entry.programmeId === expectedProgrammeId));
  return next;
}

let life = createNewLife({ name: "Buhle", gender: "non-binary" });
const starterPeople = Object.keys(life.relationships.people);
assert.equal(starterPeople.length, 4);

// Get only two school-finale questions right for a weak but recoverable result.
for (let index = 0; index < 8; index += 1) {
  const questionId = life.life.school.quiz.order[life.life.school.quiz.index];
  const question = ENTRANCE_QUESTIONS.find((item) => item.id === questionId);
  const choice = index < 2
    ? question.choices.find((item) => item.id === question.correct)
    : question.choices.find((item) => item.id !== question.correct);
  life = chooseSchoolDecision(life, choice.id, { now: life.life.school.quiz.deadline - 1 });
}
assert.equal(life.life.stage, "adult");
assert.equal(life.life.examResult.band, "developing");
assert.ok(life.life.examResult.score < 50);

const bridge = enrolInProgramme(life, { programmeId: "foundation-bridge", fundingId: "part-time" });
assert.equal(bridge.ok, true);
assert.equal(bridge.state.dailyState.phase, "complete", "Study can be the first adult path");
life = completeQualification(bridge.state, "foundation-bridge");
assert.ok(life.education.accessModifiers.bridgeBonus > 0);

const learnership = enrolInProgramme(life, {
  programmeId: "office-admin-learnership",
  fundingId: "paid-learnership",
});
assert.equal(learnership.ok, true);
life = completeQualification(learnership.state, "office-admin-learnership");
assert.equal(life.education.completed.length, 2);

life.stats.knowledge = 90;
life.stats.reputation = 90;
life.stats.social = 85;
const opening = getAvailableJobs(life, { limit: 30 }).find((item) => (
  item.type === "career" && item.familyId === "business" && item.roleIndex === 0 && item.eligible
));
assert.ok(opening, "the funded qualification leads to a matching entry opening");
const applied = applyForJob(life, opening.id);
assert.equal(applied.ok, true);
const invited = resolveJobApplication(applied.state, applied.applicationId);
assert.equal(invited.interviewScheduled, true);
const interview = getInterviewDecision(invited.state);
assert.ok(interview && interview.choices.length >= 3, "the interview is a valid interruption");
const hired = resolveInterview(invited.state, "show-examples", { random: () => 0 });
assert.equal(hired.status.accepted, true);
life = hired.state;

Object.assign(life.career, {
  performance: 94,
  readiness: 94,
  boss: 90,
  coworkers: 86,
  attendanceStreak: 18,
  experience: 60,
});
life.stats.reputation = 90;
const routine = settleCareerDay(life, { day: life.calendar.day, attendance: "present" });
assert.equal(routine.status.duplicate, false);
assert.equal(routine.transactions.length, 1);
assert.ok(routine.state.career.pendingPromotion);
const promotion = getPromotionDecision(routine.state);
assert.ok(promotion && promotion.choices.length >= 3, "the promotion panel is a valid interruption");
const promoted = resolvePromotionDecision(routine.state, "show-results", { random: () => 0 });
assert.equal(promoted.ok, true);
assert.equal(promoted.status.promoted, true);
life = promoted.state;

const sourceDays = life.finances.transactions.map((item) => `${item.source}:${item.day}`);
assert.equal(new Set(sourceDays).size, sourceDays.length, "cash sources settle once per day");
assert.deepEqual(Object.keys(life.relationships.people), starterPeople, "all four generated starter people survive the path");

const storage = new MemoryStorage();
saveGame(life, storage);
const reloaded = loadGame(storage);
assert.equal(reloaded.status, "loaded");
assert.equal(reloaded.state.schemaVersion, 10);
assert.equal(reloaded.state.career.roleIndex, life.career.roleIndex);
assert.equal(reloaded.state.education.completed.length, 2);
assert.ok(storage.getItem(SAVE_KEY_V10));

// Work-first remains a complete alternative to Study.
const worker = createNewLife({ name: "Sipho", gender: "man" });
worker.life.stage = "adult";
worker.life.school.step = "complete";
worker.life.examResult = { score: 45, band: "developing", label: "Needs practice" };
worker.dailyState.phase = "complete";
worker.dailyState.complete = true;
const startup = getAvailableJobs(worker, { limit: 30 }).find((item) => item.type === "business" && item.eligible);
assert.ok(startup);
const launched = applyForJob(worker, startup.id);
assert.equal(launched.ok, true);
assert.equal(launched.state.business.active, true);
assert.equal(launched.state.education.completed.length, 0);

// A v0.9 employee migrates without invented study history or lost life state.
const old = createDefaultState();
old.schemaVersion = 9;
old.profile = { name: "Naledi", gender: "woman" };
old.life.stage = "adult";
old.life.school.step = "complete";
old.career.active = true;
old.career.pathId = "office";
old.career.roleIndex = 2;
old.career.role = "Team Supervisor";
old.career.warnings = [{ id: "warning-1", day: 40, severity: "written" }];
old.assets.ownedUpgradeIds = ["laptop"];
old.relationships.people.friend = { id: "friend", name: "Anele", type: "friend", score: 76 };
delete old.education;
delete old.finances.liabilities;
const migrated = migrateState(old);
assert.equal(migrated.schemaVersion, 10);
assert.equal(migrated.career.familyId, "business");
assert.equal(migrated.career.roleIndex, 2);
assert.equal(migrated.career.warnings.length, 1);
assert.deepEqual(migrated.assets.ownedUpgradeIds, ["laptop"]);
assert.equal(migrated.relationships.people.friend.name, "Anele");
assert.deepEqual(migrated.education.completed, []);
assert.deepEqual(migrated.finances.liabilities, []);
assert.equal(migrated.life.school.step, "complete");

console.log("v0.10 smoke: school, recovery, study, career, work-first and migration passed");
