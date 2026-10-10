import assert from "node:assert/strict";
import { createDefaultState } from "../js/core/state.js";
import {
  getAvailableJobs,
  applyForJob,
  resolveJobApplication,
  getInterviewDecision,
  resolveInterview,
} from "../js/systems/jobs.js";

function unemployed({ day = 8 } = {}) {
  const state = createDefaultState();
  state.profile.name = "Lerato";
  state.life.stage = "adult";
  state.life.school.step = "complete";
  state.life.examResult = { score: 68, band: "pass", label: "Pass" };
  state.calendar.day = day;
  state.dailyState.day = day;
  state.dailyState.phase = "complete";
  state.dailyState.complete = true;
  state.stats.knowledge = 62;
  state.stats.reputation = 58;
  state.finances.cash = 5_000;
  state.finances.netWorth = 5_000;
  return state;
}

const basic = unemployed();
const openings = getAvailableJobs(basic);
assert.ok(openings.length <= 3);
assert.equal(new Set(openings.map((opening) => opening.id)).size, openings.length);
assert.deepEqual(getAvailableJobs(basic), openings);
assert.ok(openings.some((opening) => opening.type === "business" && opening.eligible));
assert.ok(openings.some((opening) => opening.type === "career"));

const qualified = unemployed();
qualified.education.completed.push({ programmeId: "computing-degree", outcome: "distinction", score: 88 });
const qualifiedOpenings = getAvailableJobs(qualified, { limit: 20 });
const specialist = qualifiedOpenings.find((opening) => (
  opening.familyId === "technology" && opening.roleIndex === 2
));
assert.ok(specialist);
assert.equal(specialist.eligible, true);

const weak = unemployed();
weak.stats.knowledge = 28;
weak.stats.reputation = 30;
const lockedSpecialist = getAvailableJobs(weak, { limit: 20 }).find((opening) => (
  opening.familyId === "technology" && opening.roleIndex === 2
));
assert.ok(lockedSpecialist);
assert.equal(lockedSpecialist.eligible, false);

const experienced = unemployed();
experienced.education.accessModifiers.experienceByField.technology = 90;
const experiencedSpecialist = getAvailableJobs(experienced, { limit: 20 }).find((opening) => (
  opening.familyId === "technology" && opening.roleIndex === 2
));
assert.equal(experiencedSpecialist.eligible, true);

const experiencedCommunity = unemployed();
experiencedCommunity.education.accessModifiers.experienceByField.community = 120;
const lockedProfessional = getAvailableJobs(experiencedCommunity, { limit: 20 }).find((opening) => (
  opening.familyId === "community" && opening.roleIndex === 2
));
assert.equal(lockedProfessional.eligible, false);

const referred = unemployed();
referred.relationships.people.friend = {
  id: "friend",
  name: "Tshepo",
  type: "friend",
  score: 82,
  trait: "connected",
  reaction: "warm",
};
const referralOpenings = getAvailableJobs(referred);
const referredCards = referralOpenings.filter((opening) => opening.referralPersonId === "friend");
assert.equal(referredCards.length, 1);
assert.equal(
  getAvailableJobs(referred).find((opening) => opening.referralPersonId === "friend")?.id,
  referredCards[0].id,
);

const careerOpening = referralOpenings.find((opening) => opening.type === "career" && opening.eligible);
assert.ok(careerOpening);
const applied = applyForJob(referred, careerOpening.id);
assert.equal(applied.ok, true);
assert.equal(applied.status, "pending");
assert.equal(applied.state.jobs.pendingInterview, null);
assert.deepEqual(getAvailableJobs(applied.state), []);

const invited = resolveJobApplication(applied.state, applied.applicationId);
assert.equal(invited.resolved, true);
assert.equal(invited.interviewScheduled, true);
assert.equal(invited.state.career.active, false);
assert.equal(invited.state.jobs.pendingInterview.applicationId, applied.applicationId);
const interview = getInterviewDecision(invited.state);
assert.equal(interview.choices.every((choice) => choice.action === "RESOLVE_INTERVIEW"), true);

const firstOutcome = resolveInterview(invited.state, "show-examples", { random: () => 0 });
const secondOutcome = resolveInterview(structuredClone(invited.state), "show-examples", { random: () => 0 });
assert.deepEqual(firstOutcome.status, secondOutcome.status);
assert.equal(firstOutcome.status.accepted, true);
assert.equal(firstOutcome.state.career.active, true);
assert.equal(firstOutcome.state.career.familyId, careerOpening.familyId);
assert.equal(firstOutcome.state.career.roleIndex, careerOpening.roleIndex);
assert.equal(firstOutcome.state.career.employerId, careerOpening.employerId);

const rejectBase = unemployed({ day: 15 });
rejectBase.stats.knowledge = 35;
rejectBase.stats.reputation = 30;
const rejectOpening = getAvailableJobs(rejectBase, { limit: 20 })
  .find((opening) => opening.type === "career" && opening.eligible);
const rejectApplied = applyForJob(rejectBase, rejectOpening.id);
const rejectInvited = resolveJobApplication(rejectApplied.state, rejectApplied.applicationId).state;
const rejected = resolveInterview(rejectInvited, "oversell", { random: () => 0.99 });
assert.equal(rejected.status.accepted, false);
assert.equal(rejected.state.career.active, false);
assert.ok(rejected.state.career.openingCooldowns[rejectOpening.openingKey] > rejected.state.calendar.day);
const soon = structuredClone(rejected.state);
soon.calendar.day += 3;
soon.dailyState.day = soon.calendar.day;
assert.equal(
  getAvailableJobs(soon, { limit: 20 }).some((opening) => opening.openingKey === rejectOpening.openingKey),
  false,
);
assert.ok(getAvailableJobs(soon, { limit: 20 }).some((opening) => (
  opening.type === "career" && opening.familyId !== rejectOpening.familyId
)));

const invalid = unemployed();
invalid.jobs.activeApplicationId = "application-broken";
invalid.jobs.pendingInterview = {
  applicationId: "application-broken",
  openingId: "missing-opening",
  familyId: "missing-family",
  roleId: "missing-role",
  employerId: "missing-employer",
};
assert.match(getInterviewDecision(invalid).title, /unavailable/i);
const closed = resolveInterview(invalid, "close-invalid");
assert.equal(closed.ok, true);
assert.equal(closed.state.jobs.pendingInterview, null);
assert.equal(closed.state.jobs.activeApplicationId, null);

console.log("v0.10 jobs: rotating openings, referrals and interviews passed");
