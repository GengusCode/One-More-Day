import assert from "node:assert/strict";
import { createNewLife } from "../js/core/state.js";
import { getCurrentDecision } from "../js/systems/day.js";
import { chooseSchoolDecision } from "../js/systems/life.js";
import { applyForJob, getAvailableJobs, resolveJobApplication, resolveInterview } from "../js/systems/jobs.js";
import { startCareer } from "../js/systems/career.js";

const fresh = createNewLife({ name: "Karabo", gender: "non-binary" });
// Existing school saves keep their original three-step opening.
fresh.life.school.step = "last-morning";
const opening = getCurrentDecision(fresh);

assert.equal(opening?.kicker, "LAST DAY OF SCHOOL");
assert.equal(opening?.choices?.length, 3);
assert.deepEqual(getAvailableJobs(fresh), []);
assert.equal(applyForJob(fresh, "car-wash-startup").ok, false);

const exam = chooseSchoolDecision(fresh, "revise-notes");
assert.equal(exam.life.school.step, "final-exam");
assert.equal(getCurrentDecision(exam)?.kicker, "FINAL EXAM");

const ending = chooseSchoolDecision(exam, "steady");
assert.equal(ending.life.school.step, "school-ends");
assert.ok(ending.life.examResult.score >= 45);
assert.equal(getCurrentDecision(ending)?.kicker, "SCHOOL'S OUT");

const adult = chooseSchoolDecision(ending, "thank-mentor");
assert.equal(adult.life.stage, "adult");
assert.equal(adult.life.school.step, "complete");
assert.equal(adult.finances.cash, 1_000);

const jobs = getAvailableJobs(adult);
assert.ok(jobs.length <= 3);
assert.ok(jobs.some((job) => job.eligible));
assert.ok(jobs.some((job) => job.type === "business" && job.eligible));

const careerOpening = jobs.find((job) => job.type === "career" && job.eligible);
assert.equal(careerOpening.eligible, true);
const applied = applyForJob(adult, careerOpening.id);
assert.equal(applied.ok, true);
assert.equal(applied.status, "pending");
assert.deepEqual(getAvailableJobs(applied.state), []);
assert.equal(applyForJob(applied.state, careerOpening.id).ok, false);
const resolved = resolveJobApplication(applied.state, applied.applicationId);
assert.equal(resolved.resolved, true);
assert.equal(resolved.interviewScheduled, true);
assert.equal(resolved.state.career.active, false);
const interviewed = resolveInterview(resolved.state, "show-examples", { random: () => 0 });
assert.equal(interviewed.status.accepted, true);
assert.equal(interviewed.state.career.active, true);

const startup = jobs.find((job) => job.type === "business" && job.eligible);
const launched = applyForJob(adult, startup.id);
assert.equal(launched.status, "accepted");
assert.equal(launched.state.business.active, true);
assert.equal(launched.state.dailyState.phase, "complete");
assert.equal(launched.state.dailyState.complete, true);

const employed = startCareer(adult, "office");
assert.deepEqual(getAvailableJobs(employed), []);
assert.equal(applyForJob(employed, careerOpening.id).ok, false);

console.log("v09 school/jobs: school opening and opportunity rules passed");
