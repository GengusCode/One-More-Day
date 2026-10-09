import assert from "node:assert/strict";
import { createDefaultState, saveGame, loadGame } from "../js/core/state.js";
import {
  enrolInProgramme,
  resolveStudyDecision,
  getCurrentStudyDecision,
} from "../js/systems/education.js";
import { fastForwardToStudyCheckpoint } from "../js/systems/timeline.js";

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
}

function enrolledState() {
  const state = createDefaultState();
  state.life.stage = "adult";
  state.life.school.step = "complete";
  state.life.examResult = { score: 70, band: "pass", label: "Pass" };
  state.stats.knowledge = 60;
  state.dailyState.phase = "complete";
  state.dailyState.complete = true;
  state.finances.cash = 1_000;
  state.finances.netWorth = 1_000;
  const enrolled = enrolInProgramme(
    state,
    { programmeId: "foundation-bridge", fundingId: "part-time" },
    { random: () => 0.9 },
  ).state;
  return resolveStudyDecision(enrolled, "focused-plan", { random: () => 0.5 }).state;
}

const start = enrolledState();
const advanced = fastForwardToStudyCheckpoint(start, { random: () => 0.9 });
assert.equal(advanced.state.calendar.day, 8);
assert.equal(advanced.summary.daysAdvanced, 7);
assert.equal(advanced.summary.reason, "study-checkpoint");
assert.equal(advanced.interrupted, true);
assert.equal(getCurrentStudyDecision(advanced.state).checkpointId, "pressure");
const studyIncome = advanced.state.finances.transactions
  .filter((transaction) => transaction.source.startsWith("education:part-time:"));
assert.equal(studyIncome.length, 7);
assert.equal(studyIncome.reduce((total, transaction) => total + transaction.amount, 0), 630);
const cashAtCheckpoint = advanced.state.finances.cash;
assert.equal(advanced.state.education.settledDayIds.length, 7);
assert.equal(new Set(advanced.state.timeline.settledDayIds).size, advanced.state.timeline.settledDayIds.length);

const storage = new MemoryStorage();
saveGame(advanced.state, storage);
const restored = loadGame(storage).state;
const transactionCount = restored.finances.transactions.length;
const duplicateAttempt = fastForwardToStudyCheckpoint(restored, { random: () => 0.9 });
assert.equal(duplicateAttempt.summary.daysAdvanced, 0);
assert.equal(duplicateAttempt.state.finances.cash, cashAtCheckpoint);
assert.equal(duplicateAttempt.state.finances.transactions.length, transactionCount);
assert.equal(duplicateAttempt.state.education.settledDayIds.length, 7);

const interrupted = enrolledState();
interrupted.delayedEvents.push({
  dueDay: 3,
  eventId: "family-emergency",
  outcomeId: "family-emergency-3",
  severity: 4,
  payload: { highImpact: true, cause: "A family member needs help." },
});
const familyFirst = fastForwardToStudyCheckpoint(interrupted, { random: () => 0.9 });
assert.equal(familyFirst.state.calendar.day, 3);
assert.equal(familyFirst.summary.reason, "important-event");
assert.ok(familyFirst.state.calendar.day < interrupted.education.active.checkpointDays.pressure);

console.log("v0.10 study timeline: checkpoint targeting and interruptions passed");
