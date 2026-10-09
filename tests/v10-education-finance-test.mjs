import assert from "node:assert/strict";
import { createDefaultState } from "../js/core/state.js";
import {
  enrolInProgramme,
  withdrawFromProgramme,
  settleEducationDay,
} from "../js/systems/education.js";

function studyReady({ cash = 20_000 } = {}) {
  const state = createDefaultState();
  state.life.stage = "adult";
  state.life.school.step = "complete";
  state.life.examResult = { score: 88, band: "strong", label: "Strong pass" };
  state.stats.knowledge = 82;
  state.stats.social = 70;
  state.stats.reputation = 68;
  state.dailyState.complete = true;
  state.dailyState.phase = "complete";
  state.finances.cash = cash;
  state.finances.netWorth = cash;
  return state;
}

const personalStart = studyReady({ cash: 5_000 });
const personal = enrolInProgramme(
  personalStart,
  { programmeId: "foundation-bridge", fundingId: "personal" },
  { random: () => 0.5 },
);
assert.equal(personal.ok, true);
assert.equal(personal.state.finances.cash, 4_100);
assert.equal(personal.state.education.active.programmeId, "foundation-bridge");
assert.equal(personal.state.education.active.fundingId, "personal");
assert.deepEqual(personal.state.education.active.checkpointDays, {
  strategy: 1,
  pressure: 8,
  assessment: 15,
});
assert.equal(personal.state.finances.transactions.length, 1);
assert.equal(personal.state.education.applications.at(-1).status, "accepted");
assert.equal(personalStart.finances.cash, 5_000);

const bursaryAccepted = enrolInProgramme(
  studyReady(),
  { programmeId: "computing-degree", fundingId: "bursary" },
  { random: () => 0 },
);
assert.equal(bursaryAccepted.ok, true);
assert.equal(bursaryAccepted.state.finances.cash, 20_000);
assert.deepEqual(bursaryAccepted.state.finances.liabilities, []);

const bursaryStart = studyReady();
const bursaryRejected = enrolInProgramme(
  bursaryStart,
  { programmeId: "computing-degree", fundingId: "bursary" },
  { random: () => 0.99 },
);
assert.equal(bursaryRejected.ok, false);
assert.equal(bursaryRejected.status, "bursary-rejected");
assert.equal(bursaryRejected.state.finances.cash, bursaryStart.finances.cash);
assert.deepEqual(bursaryRejected.state.finances.liabilities, []);
assert.equal(bursaryRejected.state.education.active, null);
assert.equal(bursaryRejected.state.education.applications.length, 1);
assert.equal(bursaryRejected.state.education.applications[0].status, "rejected");

const loanStart = studyReady({ cash: 350 });
loanStart.calendar.day = 5;
const loan = enrolInProgramme(
  loanStart,
  { programmeId: "computing-degree", fundingId: "study-loan" },
  { random: () => 0.2 },
);
assert.equal(loan.ok, true);
assert.equal(loan.state.finances.cash, 350);
assert.equal(loan.state.finances.liabilities.length, 1);
assert.equal(loan.state.finances.netWorth, -11_650);
assert.deepEqual(
  {
    originalPrincipal: loan.state.finances.liabilities[0].originalPrincipal,
    outstandingBalance: loan.state.finances.liabilities[0].outstandingBalance,
    paymentAmount: loan.state.finances.liabilities[0].paymentAmount,
    nextPaymentDay: loan.state.finances.liabilities[0].nextPaymentDay,
  },
  {
    originalPrincipal: 12_000,
    outstandingBalance: 12_000,
    paymentAmount: 480,
    nextPaymentDay: 65,
  },
);

const partTime = enrolInProgramme(
  studyReady({ cash: 1_000 }),
  { programmeId: "foundation-bridge", fundingId: "part-time" },
  { random: () => 0.4 },
);
const partTimeDay = settleEducationDay(partTime.state, { day: 1, random: () => 0.4 });
const partTimeAgain = settleEducationDay(partTimeDay.state, { day: 1, random: () => 0.4 });
assert.equal(partTimeDay.state.finances.cash, 1_090);
assert.equal(partTimeDay.state.stats.energy, 66);
assert.equal(partTimeDay.transactions.length, 1);
assert.equal(partTimeAgain.status.duplicate, true);
assert.equal(partTimeAgain.state.finances.cash, 1_090);
assert.equal(partTimeAgain.state.stats.energy, 66);
assert.equal(partTimeAgain.transactions.length, 0);

const learnershipStart = studyReady({ cash: 500 });
const learnership = enrolInProgramme(
  learnershipStart,
  { programmeId: "office-admin-learnership", fundingId: "paid-learnership" },
  { random: () => 0.4 },
);
const learnershipDay = settleEducationDay(learnership.state, { day: 1, random: () => 0.4 });
assert.equal(learnershipDay.state.finances.cash, 620);
assert.equal(learnershipDay.transactions[0].amount, 120);

const employed = studyReady();
employed.career.active = true;
employed.career.pathId = "office";
employed.career.familyId = "business";
const employedBefore = JSON.stringify(employed);
const conflict = enrolInProgramme(
  employed,
  { programmeId: "office-admin-learnership", fundingId: "paid-learnership" },
  { random: () => 0.4 },
);
assert.equal(conflict.ok, false);
assert.equal(conflict.status, "career-conflict");
assert.equal(JSON.stringify(conflict.state), employedBefore);

const secondBefore = JSON.stringify(personal.state);
const secondCourse = enrolInProgramme(
  personal.state,
  { programmeId: "office-admin-learnership", fundingId: "paid-learnership" },
  { random: () => 0.4 },
);
assert.equal(secondCourse.ok, false);
assert.equal(JSON.stringify(secondCourse.state), secondBefore);

const withdrawnInput = structuredClone(loan.state);
withdrawnInput.calendar.day = 10;
const withdrawn = withdrawFromProgramme(withdrawnInput);
assert.equal(withdrawn.ok, true);
assert.equal(withdrawn.state.education.active, null);
assert.equal(withdrawn.state.education.incomplete.at(-1).outcome, "withdrawal");
assert.equal(withdrawn.state.finances.liabilities[0].nextPaymentDay, 40);

const arrearsInput = structuredClone(withdrawn.state);
arrearsInput.calendar.day = 40;
arrearsInput.finances.cash = 10;
const arrears = settleEducationDay(arrearsInput, { day: 40, random: () => 0.4 });
const arrearsAgain = settleEducationDay(arrears.state, { day: 40, random: () => 0.4 });
assert.equal(arrears.status.liabilityArrears, true);
assert.equal(arrears.state.finances.cash, 10);
assert.equal(arrears.state.finances.liabilities[0].arrears, 1);
assert.equal(arrears.state.finances.liabilities[0].nextPaymentDay, 70);
assert.equal(arrearsAgain.state.finances.cash, 10);
assert.equal(arrearsAgain.state.finances.liabilities[0].arrears, 1);
assert.equal(arrearsAgain.transactions.length, 0);

console.log("v0.10 education finance: funding, settlement and debt passed");
