import assert from "node:assert/strict";
import { createNewLife } from "../js/core/state.js";
import {
  advanceLifeCalendar,
  buildLifeSummary,
  evaluateLifeEnding,
} from "../js/systems/life.js";
import { canAdvanceDay } from "../js/systems/day.js";
import { canFastForward } from "../js/systems/timeline.js";
import { createRenderer } from "../js/ui/render.js";

const adult = createNewLife({ name: "Lerato", gender: "woman" });
adult.life.stage = "adult";
adult.life.school.step = "complete";

const nearlyBirthday = advanceLifeCalendar(adult, 364);
assert.equal(nearlyBirthday.calendar.age, 18);
const birthday = advanceLifeCalendar(nearlyBirthday, 1);
assert.equal(birthday.calendar.age, 19);
assert.equal(birthday.life.lastMilestone.type, "birthday");
const tomorrow = advanceLifeCalendar(birthday, 1);
assert.equal(tomorrow.calendar.age, 19, "the same birthday cannot fire twice");
assert.equal(tomorrow.life.lastMilestone, null);

const older = structuredClone(adult);
older.calendar.age = 59;
older.life.ageDays = 364;
const laterLife = advanceLifeCalendar(older, 1);
assert.equal(laterLife.calendar.age, 60);
assert.equal(laterLife.life.stage, "later-life");

const tooYoung = structuredClone(adult);
tooYoung.calendar.age = 69;
assert.equal(evaluateLifeEnding(tooYoung, { random: () => 0 }).life.ended, false);

const healthy = structuredClone(adult);
healthy.calendar.age = 75;
healthy.life.stage = "later-life";
healthy.stats.health = 90;
assert.equal(evaluateLifeEnding(healthy, { random: () => 0.01 }).life.ended, false);

const frail = structuredClone(healthy);
frail.stats.health = 10;
const healthEnding = evaluateLifeEnding(frail, { random: () => 0.01 });
assert.equal(healthEnding.life.ended, true, "health should affect eligible later-life outcomes");

const centenarian = structuredClone(healthy);
centenarian.calendar.age = 100;
const completed = evaluateLifeEnding(centenarian, { random: () => 1 });
assert.equal(completed.life.ended, true);
assert.equal(completed.life.stage, "ended");
assert.equal(completed.dailyState.phase, "ended");
assert.equal(canAdvanceDay(completed), false);
assert.equal(canFastForward(completed, 7).ok, false);

const summary = buildLifeSummary(completed);
assert.equal(summary.name, "Lerato");
assert.equal(summary.age, 100);
assert.ok(summary.achievement.length > 10);
assert.ok(Number.isFinite(summary.netWorth));

const root = {
  html: "",
  addEventListener() {},
  removeEventListener() {},
  querySelector() { return null; },
  set innerHTML(value) { this.html = value; },
  get innerHTML() { return this.html; },
};
const renderer = createRenderer({ root, dispatch() {} });
renderer.render(completed, { screen: "game", event: null, canAdvance: false });
assert.match(root.html, /A LIFE REMEMBERED/);
assert.match(root.html, /BEGIN A NEW LIFE/);
assert.doesNotMatch(root.html, /class="phone-launch"/);

console.log("v09 life ending: birthdays, later life and summary passed");
