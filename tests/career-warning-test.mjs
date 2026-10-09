import assert from "node:assert/strict";
import { createNewLife } from "../js/core/state.js";
import {
  startCareer,
  assessWorkConsequence,
  resolveCareerChoice,
} from "../js/systems/career.js";

const tests = [];
const test = (name, run) => tests.push({ name, run });

const employee = () => startCareer(createNewLife({ name: "Musa", gender: "man" }), "office");

test("a low-severity bad choice can pass without a formal warning", () => {
  const state = employee();
  state.career.performance = 85;
  state.career.boss = 80;
  state.career.attendanceStreak = 12;
  const outcome = assessWorkConsequence(state, {
    severity: 18,
    communication: 12,
    random: () => 0.99,
  });
  assert.equal(outcome.type, "got-away");
  assert.equal(outcome.formalWarning, false);
});

test("medium misconduct can produce a verbal warning without adding a written warning", () => {
  const state = employee();
  state.career.performance = 45;
  state.career.boss = 42;
  state.career.attendanceStreak = 1;
  const outcome = assessWorkConsequence(state, {
    severity: 52,
    communication: -12,
    random: () => 0,
  });
  assert.equal(outcome.type, "verbal-warning");
  assert.equal(outcome.formalWarning, false);
  assert.ok(outcome.performanceDelta < 0);
});

test("repeated poor behaviour can escalate to a written warning", () => {
  const state = employee();
  state.career.performance = 38;
  state.career.boss = 30;
  state.career.attendanceStreak = 0;
  state.career.warnings = [{ id: "old", day: 1, reason: "old" }];
  const outcome = assessWorkConsequence(state, {
    severity: 65,
    communication: -20,
    random: () => 0,
  });
  assert.equal(outcome.type, "written-warning");
  assert.equal(outcome.formalWarning, true);
});

test("severe repeated behaviour can dismiss the employee", () => {
  const state = employee();
  state.career.performance = 20;
  state.career.boss = 15;
  state.career.attendanceStreak = 0;
  state.career.warnings = [
    { id: "w1", day: 1, reason: "one" },
    { id: "w2", day: 2, reason: "two" },
  ];
  const outcome = assessWorkConsequence(state, {
    severity: 92,
    communication: -30,
    random: () => 0,
  });
  assert.equal(outcome.type, "dismissal");
  assert.equal(outcome.formalWarning, false);
});

test("qualifications never excuse severe repeated misconduct", () => {
  const state = employee();
  state.education.completed = [
    { programmeId: "business-finance-diploma", outcome: "distinction", score: 92 },
    { programmeId: "community-development-degree", outcome: "pass", score: 74 },
  ];
  state.career.performance = 88;
  state.career.boss = 70;
  state.career.attendanceStreak = 16;
  state.career.warnings = [
    { id: "w1", day: 1, reason: "one" },
    { id: "w2", day: 2, reason: "two" },
  ];
  const outcome = assessWorkConsequence(state, {
    severity: 92,
    communication: -30,
    random: () => 0,
  });
  assert.equal(outcome.type, "dismissal");
});

test("a middling incident can cost performance without a warning", () => {
  const state = employee();
  state.career.performance = 72;
  state.career.boss = 70;
  state.career.attendanceStreak = 8;
  const outcome = assessWorkConsequence(state, {
    severity: 38,
    communication: 6,
    random: () => 0.95,
  });
  assert.equal(outcome.type, "performance-loss");
  assert.equal(outcome.formalWarning, false);
});

test("a risky work decision uses the escalation result instead of always issuing a warning", () => {
  const state = employee();
  const result = resolveCareerChoice(state, "career-honesty", "hide", { random: () => 0.99 });
  assert.equal(result.status.consequence.type, "verbal-warning");
  assert.equal(result.state.career.verbalWarnings.length, 1);
  assert.equal(result.state.career.warnings.length, 0);
});

let passed = 0;
for (const entry of tests) {
  await entry.run();
  passed += 1;
}
console.log("career warnings: " + passed + " tests passed");
