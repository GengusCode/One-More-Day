import assert from "node:assert/strict";
import { createDefaultState } from "../js/core/state.js";
import {
  enrolInProgramme,
  getCurrentStudyDecision,
  resolveStudyDecision,
  getNextStudyCheckpointDay,
} from "../js/systems/education.js";

function readyState() {
  const state = createDefaultState();
  state.life.stage = "adult";
  state.life.school.step = "complete";
  state.life.examResult = { score: 82, band: "strong", label: "Strong pass" };
  state.stats.knowledge = 78;
  state.stats.energy = 80;
  state.dailyState.phase = "complete";
  state.dailyState.complete = true;
  state.finances.cash = 20_000;
  state.finances.netWorth = 20_000;
  return state;
}

const enrolled = enrolInProgramme(
  readyState(),
  { programmeId: "foundation-bridge", fundingId: "personal" },
  { random: () => 0.5 },
).state;
const strategy = getCurrentStudyDecision(enrolled);
assert.equal(strategy.checkpointId, "strategy");
assert.equal(strategy.choices.every((choice) => choice.action === "CHOOSE_STUDY"), true);
assert.equal(getNextStudyCheckpointDay(enrolled), 1);

const strategyResult = resolveStudyDecision(enrolled, "focused-plan", { random: () => 0.5 });
assert.equal(strategyResult.ok, true);
assert.equal(strategyResult.state.education.active.resolvedCheckpointIds.includes("strategy"), true);
assert.equal(strategyResult.state.education.checkpointHistory.length, 1);
const repeatedBefore = JSON.stringify(strategyResult.state);
const repeated = resolveStudyDecision(strategyResult.state, "focused-plan", { random: () => 0.5 });
assert.equal(repeated.ok, false);
assert.equal(JSON.stringify(repeated.state), repeatedBefore);

const atPressure = structuredClone(strategyResult.state);
atPressure.calendar.day = atPressure.education.active.checkpointDays.pressure;
const pressure = getCurrentStudyDecision(atPressure);
assert.equal(pressure.checkpointId, "pressure");
const pressureResult = resolveStudyDecision(atPressure, "protect-deadline", { random: () => 0.5 });
assert.equal(pressureResult.ok, true);
assert.equal(pressureResult.state.education.active.resolvedCheckpointIds.includes("pressure"), true);

const atAssessment = structuredClone(pressureResult.state);
atAssessment.calendar.day = atAssessment.education.active.checkpointDays.assessment;
const assessment = getCurrentStudyDecision(atAssessment);
assert.equal(assessment.checkpointId, "assessment");
const assessed = resolveStudyDecision(atAssessment, "check-everything", { random: () => 0.5 });
assert.equal(assessed.ok, true);
assert.ok(["distinction", "pass"].includes(assessed.status.outcome));
assert.equal(assessed.state.education.active, null);
assert.equal(assessed.state.education.completed.length, 1);
assert.ok(assessed.state.education.accessModifiers.bridgeBonus > 0);

function assessmentState({ knowledge, energy, focus, attendance, integrity, experience }) {
  const state = enrolInProgramme(
    readyState(),
    { programmeId: "foundation-bridge", fundingId: "personal" },
    { random: () => 0.5 },
  ).state;
  state.education.active.resolvedCheckpointIds = ["strategy", "pressure"];
  Object.assign(state.education.active, { focus, attendance, integrity, experience });
  state.stats.knowledge = knowledge;
  state.stats.energy = energy;
  state.calendar.day = state.education.active.checkpointDays.assessment;
  return state;
}

const cases = [
  { expected: "distinction", values: { knowledge: 100, energy: 100, focus: 100, attendance: 100, integrity: 100, experience: 100 } },
  { expected: "pass", values: { knowledge: 65, energy: 65, focus: 65, attendance: 65, integrity: 70, experience: 40 } },
  { expected: "rewrite", values: { knowledge: 45, energy: 45, focus: 45, attendance: 45, integrity: 60, experience: 10 } },
  { expected: "incomplete", values: { knowledge: 25, energy: 25, focus: 25, attendance: 25, integrity: 40, experience: 0 } },
  { expected: "withdrawal", values: { knowledge: 0, energy: 0, focus: 0, attendance: 0, integrity: 5, experience: 0 } },
];

for (const entry of cases) {
  const input = assessmentState(entry.values);
  const first = resolveStudyDecision(input, "check-everything", { random: () => 0.5 });
  const second = resolveStudyDecision(structuredClone(input), "check-everything", { random: () => 0.5 });
  assert.equal(first.status.outcome, entry.expected);
  assert.equal(second.status.outcome, entry.expected);
  assert.equal(first.status.score, second.status.score);
  if (entry.expected === "rewrite") {
    assert.ok(first.state.education.active);
    assert.equal(first.state.education.completed.length, 0);
    assert.ok(first.state.education.active.checkpointDays.assessment > input.calendar.day);
  } else if (["distinction", "pass"].includes(entry.expected)) {
    assert.equal(first.state.education.active, null);
    assert.equal(first.state.education.completed.at(-1).outcome, entry.expected);
  } else {
    assert.equal(first.state.education.active, null);
    assert.equal(first.state.education.incomplete.at(-1).outcome, entry.expected);
  }
}

const invalid = readyState();
invalid.education.active = {
  programmeId: "removed-programme",
  checkpointDays: { strategy: 1, pressure: 2, assessment: 3 },
  resolvedCheckpointIds: [],
};
const fallback = getCurrentStudyDecision(invalid);
assert.match(fallback.title, /unavailable/i);
assert.equal(resolveStudyDecision(invalid, "close-invalid").state.education.active, null);

console.log("v0.10 study progress: checkpoints and outcomes passed");
