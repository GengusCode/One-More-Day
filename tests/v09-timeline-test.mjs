import assert from "node:assert/strict";
import { createDefaultState, createNewLife } from "../js/core/state.js";
import { startCareer } from "../js/systems/career.js";
import { chooseSchoolDecision } from "../js/systems/life.js";
import { applyForJob } from "../js/systems/jobs.js";
import { canFastForward, fastForward } from "../js/systems/timeline.js";

const state = createDefaultState();
assert.deepEqual(state.timeline, { lastSummary: null, settledDayIds: [], educationMilestone: null });

function completeAdult(name = "Neo") {
  const life = createNewLife({ name, gender: "man" });
  life.life.stage = "adult";
  life.life.school.step = "complete";
  life.dailyState.phase = "complete";
  life.dailyState.complete = true;
  return life;
}

const worker = startCareer(completeAdult(), "office");
const week = fastForward(worker, 7, { random: () => 0.5 });
assert.equal(week.interrupted, false);
assert.equal(week.summary.daysAdvanced, 7);
assert.equal(week.state.calendar.day, 8);
assert.equal(week.state.finances.cash, 855, "five salaries minus five taxi fares, seven food bills and one electricity bill");
assert.equal(week.state.timeline.settledDayIds.length, 7);
assert.ok(week.summary.items.length <= 3);

const funded = completeAdult("Liam");
funded.finances.cash = 3000;
const month = fastForward(funded, 30, { random: () => 0.5 });
assert.equal(month.interrupted, false);
assert.equal(month.state.calendar.day, 31);
assert.equal(month.state.timeline.settledDayIds.length, 30);

const birthdayStart = completeAdult("Palesa");
birthdayStart.life.ageDays = 364;
const birthdayStop = fastForward(birthdayStart, 7, { random: () => 0.5 });
assert.equal(birthdayStop.interrupted, false);
assert.equal(birthdayStop.summary.daysAdvanced, 7);
assert.ok(birthdayStop.summary.milestones.some(row=>row.reason==="birthday"));
assert.equal(birthdayStop.state.calendar.age, 19);

const interruptedState = completeAdult("Ayesha");
interruptedState.delayedEvents.push({
  dueDay: 2,
  eventId: "family-check-in",
  outcomeId: "family-check-in-2",
  severity: 4,
  payload: { highImpact: true, result: "Your family needs an answer." },
});
const important = fastForward(interruptedState, 7, { random: () => 0.5 });
assert.equal(important.interrupted, false);
assert.equal(important.summary.daysAdvanced, 7);
assert.ok(important.summary.milestones.some(row=>row.reason==="important-event"));

let graduate = createNewLife({ name: "Karabo", gender: "non-binary" });
graduate.life.school.step = "last-morning";
graduate = chooseSchoolDecision(graduate, "revise-notes");
graduate = chooseSchoolDecision(graduate, "steady");
graduate = chooseSchoolDecision(graduate, "head-home");
const pending = applyForJob(graduate, "office-trainee");
pending.state.delayedEvents.push({
  dueDay: pending.state.calendar.day + 1,
  eventId: "family-emergency",
  outcomeId: "family-emergency-before-job",
  severity: 6,
  payload: { highImpact: true, result: "A family issue also needs attention." },
});
const jobResult = fastForward(pending.state, 7, { random: () => 0.5 });
assert.equal(jobResult.interrupted, false);
assert.equal(jobResult.summary.daysAdvanced, 7);
assert.ok(jobResult.summary.milestones.some(row=>row.reason==="important-event"));
assert.equal(jobResult.state.career.active, true);

const driver = completeAdult("Nadia");
driver.transport.owned = ["car"];
driver.transport.car = { roadworthy: true, damage: 0 };
driver.transport.dailyAssignment = { day: 1, mode: "driver" };
const drivenWeek = fastForward(driver, 7, { random: () => 0.5 });
const driverIncome = drivenWeek.state.finances.transactions.filter((item) => item.source === "e-hailing-driver");
assert.equal(driverIncome.length, 7);
assert.equal(new Set(driverIncome.map((item) => item.day)).size, 7, "driver income should not duplicate a day");

assert.deepEqual(canFastForward(createNewLife({ name: "Zola", gender: "woman" }), 7), {
  ok: false,
  reason: "Finish school first.",
});
assert.equal(canFastForward(completeAdult(), 14).ok, false);

console.log("v09 timeline: week/month settlement and interruptions passed");
