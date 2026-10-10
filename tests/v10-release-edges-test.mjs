import assert from "node:assert/strict";
import test from "node:test";
import { createDefaultState } from "../js/core/state.js";
import { buildPhoneModel } from "../js/ui/phone.js";
import {
  enrolInProgramme,
  getCurrentStudyDecision,
  resolveStudyDecision,
} from "../js/systems/education.js";
import {
  advanceDay,
  canAdvanceDay,
  getCurrentDecision,
  settleRoutineDay,
} from "../js/systems/day.js";
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
  startCareer,
} from "../js/systems/career.js";
import { fastForward } from "../js/systems/timeline.js";

function adult({ phase = "complete", complete = true } = {}) {
  const state = createDefaultState();
  state.profile.name = "Lerato";
  state.life.stage = "adult";
  state.life.school.step = "complete";
  state.life.examResult = { score: 82, band: "strong", label: "Strong pass" };
  state.dailyState.phase = phase;
  state.dailyState.complete = complete;
  state.stats.knowledge = 82;
  state.stats.energy = 82;
  state.stats.reputation = 78;
  state.stats.social = 72;
  state.finances.cash = 20_000;
  state.finances.netWorth = 20_000;
  return state;
}

function beginStudy(fundingId = "paid-learnership") {
  const state = adult({ phase: "path", complete: false });
  const enrolled = enrolInProgramme(state, {
    programmeId: "office-admin-learnership",
    fundingId,
  }, { random: () => 0 });
  assert.equal(enrolled.ok, true);
  const strategy = resolveStudyDecision(enrolled.state, "focused-plan", { random: () => 0 });
  assert.equal(strategy.ok, true);
  return strategy.state;
}

test("Study remains a playable first adult path and incompatible jobs stay closed", () => {
  for (const fundingId of ["paid-learnership", "part-time"]) {
    let state = fundingId === "paid-learnership"
      ? beginStudy(fundingId)
      : (() => {
          const input = adult({ phase: "path", complete: false });
          const enrolled = enrolInProgramme(input, { programmeId: "foundation-bridge", fundingId });
          assert.equal(enrolled.ok, true);
          return resolveStudyDecision(enrolled.state, "focused-plan").state;
        })();
    state = advanceDay(state, { random: () => 0.99 });
    assert.notEqual(state.dailyState.phase, "path", `${fundingId} must not return to the job-path gate`);
    assert.ok(state.education.active);
    assert.deepEqual(getAvailableJobs(state, { limit: 30 }), []);
  }
});

test("education and loan money settle before a timeline day interrupts", () => {
  const learner = beginStudy("paid-learnership");
  learner.life.ageDays = 364;
  learner.calendar.age = 18;
  learner.dailyState.phase = "complete";
  learner.dailyState.complete = true;
  const beforeCash = learner.finances.cash;
  const birthday = settleRoutineDay(learner, { random: () => 0.99 });
  assert.equal(birthday.reason, "birthday");
  assert.equal(birthday.state.finances.cash, beforeCash + 120);
  assert.ok(birthday.state.education.settledDayIds.includes("office-admin-learnership:2"));
  assert.equal(birthday.transactions.some((entry) => entry.source.includes("education:stipend")), true);

  const debtor = adult();
  debtor.life.ageDays = 364;
  debtor.finances.cash = 500;
  debtor.finances.liabilities.push({
    id: "loan-due",
    programmeId: "computing-degree",
    originalPrincipal: 1_000,
    outstandingBalance: 1_000,
    nextPaymentDay: 2,
    paymentAmount: 100,
    status: "active",
    arrears: 0,
    settledPeriodIds: [],
  });
  const due = settleRoutineDay(debtor, { random: () => 0.99 });
  assert.equal(due.reason, "birthday");
  assert.equal(due.state.finances.cash, 400);
  assert.equal(due.state.finances.liabilities[0].outstandingBalance, 900);
});

test("a rewrite moves study-loan repayment to 30 days after the new end date", () => {
  const enrolled = enrolInProgramme(
    adult(),
    { programmeId: "business-finance-diploma", fundingId: "study-loan" },
    { random: () => 0.5 },
  ).state;
  enrolled.education.active.resolvedCheckpointIds = ["strategy", "pressure"];
  Object.assign(enrolled.education.active, {
    focus: 45,
    attendance: 45,
    integrity: 60,
    experience: 10,
  });
  enrolled.stats.knowledge = 45;
  enrolled.stats.energy = 45;
  enrolled.calendar.day = enrolled.education.active.checkpointDays.assessment;
  const rewritten = resolveStudyDecision(enrolled, "check-everything", { random: () => 0.5 });
  assert.equal(rewritten.status.outcome, "rewrite");
  const liability = rewritten.state.finances.liabilities[0];
  assert.equal(liability.nextPaymentDay, rewritten.state.education.active.endDay + 30);
});

test("ended lives cannot expose or resolve interviews, study, or promotion decisions", () => {
  const interviewBase = adult();
  const opening = getAvailableJobs(interviewBase, { limit: 30 }).find((item) => item.type === "career" && item.eligible);
  const applied = applyForJob(interviewBase, opening.id);
  let interviewState = resolveJobApplication(applied.state, applied.applicationId).state;
  interviewState.life.ended = true;
  interviewState.life.stage = "ended";
  interviewState.dailyState.phase = "ended";
  const interviewBefore = JSON.stringify(interviewState);
  assert.equal(getInterviewDecision(interviewState), null);
  assert.equal(getCurrentDecision(interviewState), null);
  const interviewResult = resolveInterview(interviewState, "show-examples", { random: () => 0 });
  assert.equal(interviewResult.ok, false);
  assert.equal(JSON.stringify(interviewResult.state), interviewBefore);

  let studyState = beginStudy("paid-learnership");
  studyState.life.ended = true;
  studyState.life.stage = "ended";
  const studyBefore = JSON.stringify(studyState);
  assert.equal(getCurrentStudyDecision(studyState), null);
  assert.equal(resolveStudyDecision(studyState, "focused-plan").ok, false);
  assert.equal(JSON.stringify(studyState), studyBefore);

  let promotionState = startCareer(adult(), "business");
  promotionState.career.pendingPromotion = {
    id: "promotion-ended",
    familyId: "business",
    employerId: "neutral",
    fromRoleId: "business-office-junior",
    targetRoleId: "business-administrator",
    createdDay: 1,
  };
  promotionState.life.ended = true;
  promotionState.life.stage = "ended";
  const promotionBefore = JSON.stringify(promotionState);
  assert.equal(getPromotionDecision(promotionState), null);
  assert.equal(resolvePromotionDecision(promotionState, "show-results").ok, false);
  assert.equal(JSON.stringify(promotionState), promotionBefore);
});

test("fast-forward stops as soon as a promotion panel is created", () => {
  const state = startCareer(adult(), "business", { employerId: "results-first" });
  state.dailyState.phase = "complete";
  state.dailyState.complete = true;
  Object.assign(state.career, {
    performance: 94,
    readiness: 94,
    boss: 90,
    coworkers: 86,
    attendanceStreak: 18,
    experience: 60,
  });
  state.stats.knowledge = 90;
  state.stats.reputation = 90;
  state.education.completed.push({ programmeId: "office-admin-learnership", outcome: "pass", score: 75 });
  const skipped = fastForward(state, 7, { random: () => 0.99 });
  assert.equal(skipped.summary.daysAdvanced, 1);
  assert.equal(skipped.summary.reason, "promotion-panel");
  assert.ok(skipped.state.career.pendingPromotion);
});

test("study checkpoint messaging and phone funding status stay accurate", () => {
  let state = beginStudy("paid-learnership");
  state.calendar.day = state.education.active.checkpointDays.pressure - 1;
  state.dailyState.day = state.calendar.day;
  state.dailyState.phase = "complete";
  state.dailyState.complete = true;
  const checkpoint = settleRoutineDay(state, { random: () => 0.99 });
  assert.equal(checkpoint.reason, "study-checkpoint");
  assert.match(checkpoint.state.dailyState.result, /study|checkpoint|course/i);
  assert.doesNotMatch(checkpoint.state.dailyState.result, /cash has dropped below zero/i);
  const studyCard = buildPhoneModel(state).apps.find((app) => app.id === "study").cards[0];
  assert.match(`${studyCard.badge} ${studyCard.text}`, /paid learnership/i);
});

test("starting a new job preserves prior interviews, cooldowns, and dismissal history", () => {
  const state = adult();
  state.career.dismissed = true;
  state.career.interviewHistory = [{ id: "old-interview", outcome: "declined" }];
  state.career.openingCooldowns = { "business:assistant": 12 };
  state.career.conductHistory = [{ id: "old-dismissal", day: 4, outcome: "dismissal" }];
  const restarted = startCareer(state, "technology");
  assert.equal(restarted.career.dismissed, false, "the new current job is active");
  assert.equal(restarted.career.interviewHistory.some((item) => item.id === "old-interview"), true);
  assert.equal(restarted.career.openingCooldowns["business:assistant"], 12);
  assert.equal(restarted.career.conductHistory.some((item) => item.outcome === "dismissal"), true);
});

test("pending applications cannot create a paid-learnership or part-time work conflict", () => {
  const base = adult();
  const opening = getAvailableJobs(base, { limit: 30 }).find((item) => item.type === "career" && item.eligible);
  const applied = applyForJob(base, opening.id);
  assert.equal(applied.ok, true);

  for (const option of [
    { programmeId: "office-admin-learnership", fundingId: "paid-learnership" },
    { programmeId: "foundation-bridge", fundingId: "part-time" },
  ]) {
    const whileApplied = enrolInProgramme(applied.state, option, { random: () => 0 });
    assert.equal(whileApplied.ok, false);
    assert.match(whileApplied.reason, /application|interview|job/i);

    const invited = resolveJobApplication(applied.state, applied.applicationId).state;
    const whileInvited = enrolInProgramme(invited, option, { random: () => 0 });
    assert.equal(whileInvited.ok, false);
    assert.match(whileInvited.reason, /application|interview|job/i);
  }

  const invited = resolveJobApplication(applied.state, applied.applicationId).state;
  const impossible = beginStudy("paid-learnership");
  impossible.jobs = structuredClone(invited.jobs);
  const defended = resolveInterview(impossible, "show-examples", { random: () => 0 });
  assert.equal(defended.ok, false);
  assert.equal(defended.status.reason, "study-work-conflict");
  assert.equal(defended.state.career.active, false);
});

test("Next Day cannot skip pending decisions and terminal study resets loan timing", () => {
  const interviewBase = adult();
  const opening = getAvailableJobs(interviewBase, { limit: 30 }).find((item) => item.type === "career" && item.eligible);
  const applied = applyForJob(interviewBase, opening.id);
  const interviewState = resolveJobApplication(applied.state, applied.applicationId).state;
  assert.equal(canAdvanceDay(interviewState), false);

  const promotionState = startCareer(adult(), "business");
  promotionState.dailyState.phase = "complete";
  promotionState.dailyState.complete = true;
  promotionState.career.pendingPromotion = {
    id: "promotion-waiting",
    familyId: "business",
    employerId: "neutral",
    fromRoleId: "business-office-junior",
    targetRoleId: "business-administrator",
    createdDay: promotionState.calendar.day,
  };
  assert.equal(canAdvanceDay(promotionState), false);

  const enrolled = enrolInProgramme(
    adult(),
    { programmeId: "business-finance-diploma", fundingId: "study-loan" },
    { random: () => 0 },
  ).state;
  Object.assign(enrolled.education.active, {
    resolvedCheckpointIds: ["strategy", "pressure"],
    focus: 100,
    attendance: 100,
    integrity: 100,
    experience: 60,
  });
  enrolled.stats.knowledge = 100;
  enrolled.stats.energy = 100;
  enrolled.calendar.day = enrolled.education.active.checkpointDays.assessment;
  enrolled.dailyState.day = enrolled.calendar.day;
  enrolled.dailyState.phase = "complete";
  enrolled.dailyState.complete = true;
  assert.ok(getCurrentStudyDecision(enrolled));
  assert.equal(canAdvanceDay(enrolled), false);
  assert.equal(advanceDay(enrolled).calendar.day, enrolled.calendar.day);

  enrolled.calendar.day += 1;
  enrolled.dailyState.day = enrolled.calendar.day;
  const completed = resolveStudyDecision(enrolled, "check-everything", { random: () => 0.5 });
  assert.equal(["pass", "distinction"].includes(completed.status.outcome), true);
  assert.equal(completed.state.finances.liabilities[0].nextPaymentDay, enrolled.calendar.day + 30);
});
