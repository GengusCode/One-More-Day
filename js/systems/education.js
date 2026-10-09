import {
  EDUCATION_PROGRAMMES,
  getProgrammeById,
} from "../data/education.js";
import {
  applyEffects,
  calculateNetWorth,
} from "../core/state.js";

const BRIDGE_ID = "foundation-bridge";
const clone = (value) => (
  typeof globalThis.structuredClone === "function"
    ? globalThis.structuredClone(value)
    : JSON.parse(JSON.stringify(value))
);

function completedProgrammeIds(state) {
  return new Set((state.education?.completed || []).flatMap((entry) => {
    if (typeof entry === "string") return [entry];
    return typeof entry?.programmeId === "string" ? [entry.programmeId] : [];
  }));
}

function examScore(state) {
  const explicit = Number(state.life?.examResult?.score);
  if (Number.isFinite(explicit)) return Math.max(0, Math.min(100, explicit));
  return { strong: 80, pass: 60, developing: 40 }[state.life?.examResult?.band] || 40;
}

function relevantExperience(state, field) {
  const stored = Math.max(0, Number(state.education?.accessModifiers?.experienceByField?.[field]) || 0);
  const familyId = state.career?.familyId
    || (state.career?.pathId === "office" ? "business" : null);
  const career = state.career?.active && familyId === field
    ? Math.max(0, Number(state.career?.experience) || Number(state.career?.readiness) || 0)
    : 0;
  return stored + career;
}

function recoveryHint(key, requirement, hasBridge) {
  const hints = {
    minExam: hasBridge
      ? `Build relevant experience or improve your exam result to ${requirement}.`
      : `Complete the Foundation Bridge or improve your exam result to ${requirement}.`,
    minKnowledge: `Raise Knowledge to ${requirement} or gain relevant work experience.`,
    minHealth: `Recover Health to ${requirement} before starting this physical route.`,
    minEnergy: `Recover Energy to ${requirement} before starting this demanding route.`,
    minReputation: `Build Reputation to ${requirement} through reliable choices or work.`,
    minSocial: `Build Social to ${requirement} through people and community choices.`,
    minCash: `Save R${requirement.toLocaleString("en-ZA")} or gain relevant experience first.`,
  };
  return hints[key] || "Build your results or relevant experience, then try again.";
}

export function getStudyEligibility(state, programmeId) {
  const programme = getProgrammeById(programmeId);
  if (!programme) {
    return {
      eligible: false,
      reason: "That programme is no longer available.",
      unlockHint: "Choose another study route.",
    };
  }

  const stage = state.life?.stage;
  if (stage === "school-finale") {
    return {
      eligible: false,
      reason: "School is not finished yet.",
      unlockHint: "Complete your final school day first.",
    };
  }
  if (stage === "ended") {
    return {
      eligible: false,
      reason: "This life has ended.",
      unlockHint: "Start a new life to study again.",
    };
  }
  if (!state.dailyState?.complete) {
    return {
      eligible: false,
      reason: "Finish today's decision before enrolling.",
      unlockHint: "Complete the current day, then open Study again.",
    };
  }
  if (state.education?.active) {
    return {
      eligible: false,
      reason: "You already have an active programme.",
      unlockHint: "Finish or withdraw from it before starting another.",
    };
  }

  const requirements = programme.eligibility || {};
  const completed = completedProgrammeIds(state);
  const hasBridge = completed.has(BRIDGE_ID);
  const bridgeBonus = Math.max(0, Number(state.education?.accessModifiers?.bridgeBonus) || 0);
  const experience = relevantExperience(state, programme.field);

  if (requirements.prerequisiteId && !completed.has(requirements.prerequisiteId)) {
    const prerequisite = getProgrammeById(requirements.prerequisiteId);
    return {
      eligible: false,
      reason: "A prerequisite is still missing.",
      unlockHint: `Complete ${prerequisite?.title || "the required qualification"} first.`,
    };
  }

  const experiencePass = Number.isFinite(requirements.experienceAlternative)
    && experience >= requirements.experienceAlternative;
  const bridgeExperiencePass = Number.isFinite(requirements.bridgeExperienceAlternative)
    && hasBridge
    && experience >= requirements.bridgeExperienceAlternative;
  const bridgePass = Boolean(requirements.bridgeAlternative && hasBridge);
  if (experiencePass || bridgeExperiencePass || bridgePass) {
    return { eligible: true, reason: "", unlockHint: "" };
  }

  const values = {
    minExam: examScore(state) + bridgeBonus,
    minKnowledge: Number(state.stats?.knowledge) || 0,
    minHealth: Number(state.stats?.health) || 0,
    minEnergy: Number(state.stats?.energy) || 0,
    minReputation: Number(state.stats?.reputation) || 0,
    minSocial: Number(state.stats?.social) || 0,
    minCash: Number(state.finances?.cash) || 0,
  };
  const labels = {
    minExam: "Your current access result is below the entry level.",
    minKnowledge: "Your Knowledge is below the entry level.",
    minHealth: "Your Health is too low for this physical route.",
    minEnergy: "Your Energy is too low for this demanding route.",
    minReputation: "Your Reputation is below the entry level.",
    minSocial: "Your Social skill is below the entry level.",
    minCash: "You cannot yet cover the self-guided setup cost.",
  };

  for (const key of Object.keys(values)) {
    const required = Number(requirements[key]);
    if (!Number.isFinite(required) || values[key] >= required) continue;
    return {
      eligible: false,
      reason: labels[key],
      unlockHint: recoveryHint(key, required, hasBridge),
    };
  }

  return { eligible: true, reason: "", unlockHint: "" };
}

function availableFundingIds(state, programme) {
  const isWorking = Boolean(state.career?.active || state.business?.active);
  return programme.fundingIds.filter((fundingId) => {
    if (fundingId === "existing-work") return isWorking;
    if (fundingId === "part-time") return !isWorking;
    return true;
  });
}

export function getStudyOptions(state) {
  return EDUCATION_PROGRAMMES.map((programme) => {
    const eligibility = getStudyEligibility(state, programme.id);
    return {
      ...programme,
      ...eligibility,
      availableFundingIds: availableFundingIds(state, programme),
    };
  });
}

function applicationRecord(state, programmeId, fundingId, status, reason = "") {
  return {
    id: `study-application-${(state.education?.applications?.length || 0) + 1}`,
    programmeId,
    fundingId,
    day: Math.max(1, Math.round(Number(state.calendar?.day) || 1)),
    status,
    reason,
  };
}

function bursaryChance(state) {
  const result = examScore(state) / 100;
  const knowledge = Math.max(0, Math.min(100, Number(state.stats?.knowledge) || 0)) / 100;
  const reputation = Math.max(0, Math.min(100, Number(state.stats?.reputation) || 0)) / 100;
  const need = (Number(state.finances?.cash) || 0) < 2_000 ? 0.12 : 0;
  return Math.max(0.25, Math.min(0.85, 0.3 + result * 0.2 + knowledge * 0.15 + reputation * 0.1 + need));
}

function activeStudyRecord(state, programme, fundingId) {
  const startDay = Math.max(1, Math.round(Number(state.calendar?.day) || 1));
  const duration = programme.durationDays;
  return {
    id: `study-${programme.id}-${startDay}`,
    programmeId: programme.id,
    fundingId,
    status: "active",
    startDay,
    endDay: startDay + duration,
    checkpointDays: {
      strategy: startDay,
      pressure: startDay + Math.floor(duration / 2),
      assessment: startDay + duration,
    },
    focus: 50,
    attendance: 50,
    integrity: 70,
    experience: 0,
    resolvedCheckpointIds: [],
    rewriteCount: 0,
  };
}

function fundingConflict(state, programme, fundingId) {
  if (!programme.fundingIds.includes(fundingId)) {
    return { status: "invalid-funding", reason: "That funding option is not available for this programme." };
  }
  const isWorking = Boolean(state.career?.active || state.business?.active);
  if (fundingId === "existing-work" && !isWorking) {
    return { status: "funding-unavailable", reason: "You need an active job or business for this option." };
  }
  if (fundingId === "part-time" && isWorking) {
    return { status: "funding-unavailable", reason: "Part-time funding is only available without an active job or business." };
  }
  if (fundingId === "paid-learnership" && isWorking) {
    return { status: "career-conflict", reason: "End your current work commitment before accepting a paid learnership." };
  }
  return null;
}

export function enrolInProgramme(state, { programmeId, fundingId } = {}, { random = Math.random } = {}) {
  if (state.education?.active) {
    return { state, ok: false, status: "already-studying", reason: "Finish or withdraw from your current programme first." };
  }

  const programme = getProgrammeById(programmeId);
  if (!programme) {
    return { state, ok: false, status: "invalid-programme", reason: "That programme is no longer available." };
  }

  const eligibility = getStudyEligibility(state, programmeId);
  if (!eligibility.eligible) {
    return { state, ok: false, status: "ineligible", reason: eligibility.unlockHint || eligibility.reason };
  }

  const conflict = fundingConflict(state, programme, fundingId);
  if (conflict) return { state, ok: false, ...conflict };
  if (fundingId === "personal" && (Number(state.finances?.cash) || 0) < programme.cost) {
    return { state, ok: false, status: "insufficient-funds", reason: "You do not have enough cash to pay the course fee." };
  }

  if (fundingId === "bursary" && Number(random()) >= bursaryChance(state)) {
    const rejected = clone(state);
    rejected.education.applications.push(applicationRecord(
      rejected,
      programme.id,
      fundingId,
      "rejected",
      "The bursary application was not successful this time.",
    ));
    return {
      state: rejected,
      ok: false,
      status: "bursary-rejected",
      reason: "The bursary application was not successful this time.",
    };
  }

  let next = clone(state);
  const transactions = [];
  if (fundingId === "personal" && programme.cost > 0) {
    const paid = applyEffects(
      next,
      { cash: -programme.cost },
      { source: `education:enrol:${programme.id}:personal`, label: programme.title },
    );
    next = paid.state;
    transactions.push(...paid.transactions);
  }

  const active = activeStudyRecord(next, programme, fundingId);
  if (fundingId === "study-loan" && programme.cost > 0) {
    const principal = Math.round(programme.cost);
    next.finances.liabilities.push({
      id: `study-loan-${programme.id}-${active.startDay}-${next.finances.liabilities.length + 1}`,
      programmeId: programme.id,
      originalPrincipal: principal,
      outstandingBalance: principal,
      nextPaymentDay: active.endDay + 30,
      paymentAmount: Math.max(50, Math.round(principal * 0.04)),
      status: "active",
      arrears: 0,
      settledPeriodIds: [],
    });
  }

  next.education.active = active;
  next.education.applications.push(applicationRecord(next, programme.id, fundingId, "accepted"));
  next.finances.netWorth = calculateNetWorth(next);
  return { state: next, transactions, ok: true, status: "enrolled", reason: "" };
}

export function withdrawFromProgramme(state) {
  if (!state.education?.active) {
    return { state, ok: false, status: "no-active-programme", reason: "There is no active programme to withdraw from." };
  }
  const next = clone(state);
  const active = next.education.active;
  const day = Math.max(1, Math.round(Number(next.calendar?.day) || 1));
  next.education.incomplete.push({
    programmeId: active.programmeId,
    fundingId: active.fundingId,
    outcome: "withdrawal",
    day,
    focus: Number(active.focus) || 0,
    experience: Number(active.experience) || 0,
  });
  next.education.lastOutcome = {
    programmeId: active.programmeId,
    outcome: "withdrawal",
    day,
  };
  for (const liability of next.finances.liabilities) {
    if (liability.programmeId !== active.programmeId || liability.status === "paid") continue;
    liability.nextPaymentDay = day + 30;
  }
  next.education.active = null;
  next.finances.netWorth = calculateNetWorth(next);
  return { state: next, ok: true, status: "withdrawn", reason: "" };
}

function dueCheckpoint(active, day) {
  if (!active?.checkpointDays) return null;
  const resolved = new Set(active.resolvedCheckpointIds || []);
  for (const id of ["strategy", "pressure", "assessment"]) {
    if (day >= Number(active.checkpointDays[id]) && !resolved.has(id)) return id;
  }
  return null;
}

function settleLiabilities(state, day) {
  let next = state;
  const transactions = [];
  let arrears = false;
  let settled = false;

  for (let index = 0; index < (next.finances?.liabilities?.length || 0); index += 1) {
    let liability = next.finances.liabilities[index];
    if (liability.status === "paid" || day < Number(liability.nextPaymentDay)) continue;
    const periodId = `${liability.id}:${liability.nextPaymentDay}`;
    if ((liability.settledPeriodIds || []).includes(periodId)) continue;
    settled = true;
    const payment = Math.min(
      Math.max(0, Number(liability.paymentAmount) || 0),
      Math.max(0, Number(liability.outstandingBalance) || 0),
    );

    if ((Number(next.finances.cash) || 0) < payment) {
      liability.arrears = Math.max(0, Number(liability.arrears) || 0) + 1;
      liability.status = "arrears";
      liability.settledPeriodIds = [...(liability.settledPeriodIds || []), periodId];
      liability.nextPaymentDay = Number(liability.nextPaymentDay) + 30;
      arrears = true;
      continue;
    }

    const paid = applyEffects(
      next,
      { cash: -payment },
      { source: `education:loan:${liability.id}:${day}`, label: "Study loan payment" },
    );
    next = paid.state;
    transactions.push(...paid.transactions);
    liability = next.finances.liabilities[index];
    liability.outstandingBalance = Math.max(0, Number(liability.outstandingBalance) - payment);
    liability.status = liability.outstandingBalance === 0 ? "paid" : "active";
    liability.settledPeriodIds = [...(liability.settledPeriodIds || []), periodId];
    liability.nextPaymentDay = Number(liability.nextPaymentDay) + 30;
  }

  next.finances.netWorth = calculateNetWorth(next);
  return { state: next, transactions, arrears, settled };
}

export function settleEducationDay(state, { day = state.calendar?.day, random = Math.random } = {}) {
  const currentDay = Math.max(1, Math.round(Number(day) || 1));
  let next = clone(state);
  const transactions = [];
  const active = next.education?.active;
  let duplicate = false;

  if (active && currentDay >= Number(active.startDay) && currentDay <= Number(active.endDay)) {
    const settlementId = `${active.programmeId}:${currentDay}`;
    if (next.education.settledDayIds.includes(settlementId)) {
      duplicate = true;
    } else {
      const programme = getProgrammeById(active.programmeId);
      if (active.fundingId === "part-time") {
        const settled = applyEffects(
          next,
          { cash: 90, stats: { energy: -6 } },
          { source: `education:part-time:${active.programmeId}:${currentDay}`, label: "Part-time shift" },
        );
        next = settled.state;
        transactions.push(...settled.transactions);
        if (next.education.active) next.education.active.focus = Math.max(0, Number(next.education.active.focus) - 1);
      } else if (active.fundingId === "paid-learnership") {
        const stipend = Math.max(0, Number(programme?.stipend) || 0);
        const settled = applyEffects(
          next,
          { cash: stipend, stats: { energy: -3 } },
          { source: `education:stipend:${active.programmeId}:${currentDay}`, label: "Learnership stipend" },
        );
        next = settled.state;
        transactions.push(...settled.transactions);
        if (next.education.active) next.education.active.experience = Math.max(0, Number(next.education.active.experience) + 1);
      } else if (active.fundingId === "existing-work") {
        next.stats.energy = Math.max(0, Number(next.stats.energy) - 4);
        next.education.active.focus = Math.max(0, Number(next.education.active.focus) - 1);
      }
      next.education.settledDayIds.push(settlementId);
    }
  }

  const liabilities = settleLiabilities(next, currentDay, random);
  next = liabilities.state;
  transactions.push(...liabilities.transactions);
  return {
    state: next,
    transactions,
    status: {
      duplicate,
      checkpointDue: dueCheckpoint(next.education?.active, currentDay),
      liabilityArrears: liabilities.arrears,
      liabilitySettled: liabilities.settled,
    },
  };
}
