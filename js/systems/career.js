import { applyEffects } from "../core/state.js";
import { WORK_DECISIONS } from "../data/events.js";
import { CAREER_FAMILIES, EMPLOYER_CULTURES } from "../data/jobs.js";
import { scheduleChoiceConsequence } from "./event-deck.js";

const clone = (value) => (
  typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value))
);
const clamp = (value) => Math.max(0, Math.min(100, Number(value) || 0));

export { CAREER_FAMILIES, EMPLOYER_CULTURES };
export const CAREER_ROLES = CAREER_FAMILIES.find((family) => family.id === "business").roles;

const FAMILY_ALIASES = Object.freeze({
  office: "business",
  retail: "hospitality",
  logistics: "trades",
});

function getFamily(id) {
  const familyId = FAMILY_ALIASES[id] || id;
  return CAREER_FAMILIES.find((family) => family.id === familyId)
    || CAREER_FAMILIES.find((family) => family.id === "business");
}

function getEmployer(id) {
  return EMPLOYER_CULTURES.find((culture) => culture.id === id)
    || EMPLOYER_CULTURES.find((culture) => culture.id === "neutral");
}

const careerRoles = (career) => getFamily(career.familyId || career.pathId).roles;

export function startCareer(state, familyId = "business", { roleIndex = 0, employerId = "neutral" } = {}) {
  const requestedFamily = FAMILY_ALIASES[familyId] || familyId;
  const family = getFamily(requestedFamily);
  const validFamily = CAREER_FAMILIES.some((entry) => entry.id === requestedFamily);
  const roles = family.roles;
  const index = validFamily
    ? Math.max(0, Math.min(roles.length - 1, Math.round(Number(roleIndex) || 0)))
    : 0;
  const employer = getEmployer(employerId);
  const next = clone(state);
  next.business.active = false;
  next.career = {
    ...next.career,
    active: true,
    pathId: family.id === "business" ? "office" : family.id,
    familyId: family.id,
    employerId: employer.id,
    roleIndex: index,
    role: roles[index].name,
    salary: roles[index].salary,
    experience: 0,
    pendingPromotion: null,
    performance: 50,
    boss: 50,
    coworkers: 50,
    warnings: [],
    verbalWarnings: [],
    readiness: 0,
    recentDecisionIds: [],
    attendanceStreak: 0,
    dismissed: false,
  };
  return next;
}

export function getCareerDecisionIds(state) {
  const recent = new Set(state.career.recentDecisionIds.slice(-3));
  const available = WORK_DECISIONS.filter((item) => item.path === "career" && !recent.has(item.id));
  return (available.length ? available : WORK_DECISIONS.filter((item) => item.path === "career")).map((item) => item.id);
}

function applyCareerValues(state, values = {}) {
  const next = clone(state);
  for (const key of ["performance", "boss", "coworkers", "readiness"]) {
    if (values[key]) next.career[key] = clamp(next.career[key] + Number(values[key]));
  }
  return next;
}

export function assessWorkConsequence(state, {
  severity = 0,
  communication = 0,
  random = Math.random,
} = {}) {
  const career = state.career;
  const previousWarnings = career.warnings.length;
  const performanceRisk = Math.max(0, 60 - career.performance) * 0.35;
  const bossRisk = Math.max(0, 55 - career.boss) * 0.3;
  const attendanceRisk = Math.max(0, 3 - career.attendanceStreak) * 5;
  const warningRisk = previousWarnings * 14;
  const communicationRisk = Math.max(0, -communication) * 0.4;
  const chanceRisk = (1 - Math.max(0, Math.min(1, Number(random()) || 0))) * 14;
  const score = severity + performanceRisk + bossRisk + attendanceRisk + warningRisk + communicationRisk + chanceRisk;
  const performanceLoss = (factor, minimum) => -Math.max(minimum, Math.round(severity * factor));

  if (severity >= 85 && previousWarnings >= 2) {
    return { type: "dismissal", formalWarning: false, performanceDelta: -20, score };
  }
  if (score >= 180 && severity >= 90) {
    return { type: "dismissal", formalWarning: false, performanceDelta: -20, score };
  }
  if (score >= 98) {
    return { type: "written-warning", formalWarning: true, performanceDelta: performanceLoss(0.13, 8), score };
  }
  if (score >= 62) {
    return { type: "verbal-warning", formalWarning: false, performanceDelta: performanceLoss(0.1, 5), score };
  }
  if (score >= 30) {
    return { type: "performance-loss", formalWarning: false, performanceDelta: performanceLoss(0.08, 3), score };
  }
  return { type: "got-away", formalWarning: false, performanceDelta: 0, score };
}

function applyConsequence(state, consequence, eventId) {
  const next = clone(state);
  if (consequence.performanceDelta) {
    next.career.performance = clamp(next.career.performance + consequence.performanceDelta);
  }
  const entry = {
    id: eventId + "-" + next.calendar.day + "-" + (next.career.conductHistory.length + 1),
    day: next.calendar.day,
    outcome: consequence.type,
  };
  next.career.conductHistory = [...next.career.conductHistory, entry].slice(-12);
  if (consequence.type === "verbal-warning") {
    next.career.verbalWarnings = [...next.career.verbalWarnings, entry].slice(-3);
  }
  if (consequence.type === "written-warning") {
    next.career.warnings = [...next.career.warnings, {
      id: "written-" + entry.id,
      day: next.calendar.day,
      reason: "Work conduct",
    }].slice(-3);
  }
  if (consequence.type === "dismissal") {
    next.career.active = false;
    next.career.dismissed = true;
  }
  return next;
}

export function resolveCareerChoice(state, eventId, choiceId, { random = Math.random } = {}) {
  const event = WORK_DECISIONS.find((item) => item.id === eventId && item.path === "career");
  const choice = event?.choices.find((item) => item.id === choiceId);
  if (!choice) return { state, status: { valid: false }, transactions: [] };
  let next = applyCareerValues(state, choice.effects?.career);
  const applied = applyEffects(next, choice.effects || {}, { source: eventId, label: choice.label });
  next = applied.state;
  const consequence = choice.risk
    ? assessWorkConsequence(next, { ...choice.risk, random })
    : { type: "none", formalWarning: false, performanceDelta: 0, score: 0 };
  if (choice.risk) next = applyConsequence(next, consequence, eventId);
  next.career.recentDecisionIds = [...next.career.recentDecisionIds.filter((id) => id !== eventId), eventId].slice(-6);
  next = scheduleChoiceConsequence(next, eventId, choice, random);
  return { state: next, status: { valid: true, result: choice.result, consequence }, transactions: applied.transactions };
}

function completedQualificationIds(state) {
  return new Set((state.education?.completed || []).flatMap((entry) => (
    typeof entry === "string" ? [entry] : typeof entry?.programmeId === "string" ? [entry.programmeId] : []
  )));
}

function qualificationFit(state, role) {
  if (!role?.minQualifications?.length) return true;
  const completed = completedQualificationIds(state);
  return role.minQualifications.some((id) => completed.has(id));
}

function isPromotionReady(state) {
  const roles = careerRoles(state.career);
  const target = roles[state.career.roleIndex + 1];
  if (!target || state.career.pendingPromotion) return false;
  return state.career.performance >= target.performance
    && state.stats.knowledge >= target.knowledge
    && state.stats.reputation >= target.reputation
    && state.career.readiness >= target.readiness
    && state.career.experience >= target.minExperience
    && qualificationFit(state, target);
}

const PROMOTION_CHOICES = Object.freeze([
  { id: "show-results", label: "Walk them through your results", detail: "Use clear evidence from the work you have delivered.", answerFit: 14 },
  { id: "back-team", label: "Credit the team and your role in it", detail: "Show leadership without claiming every win.", answerFit: 10 },
  { id: "show-plan", label: "Present a plan for the new role", detail: "Explain what you would improve in your first month.", answerFit: 11 },
  { id: "growth-idea", label: "Pitch one practical new idea", detail: "Show that you can improve the work, not only maintain it.", answerFit: 11 },
  { id: "wing-it", label: "Keep it casual and wing it", detail: "Trust your charm instead of preparing an answer.", answerFit: -28 },
]);

export function getPromotionDecision(state) {
  if (state.life?.ended || state.life?.stage === "ended") return null;
  const pending = state.career?.pendingPromotion;
  if (!pending) return null;
  const family = getFamily(pending.familyId || state.career.familyId);
  const target = family.roles.find((role) => role.id === pending.targetRoleId)
    || family.roles[state.career.roleIndex + 1];
  if (!target) return null;
  return {
    icon: "📈",
    kicker: "PROMOTION PANEL",
    title: `Why should you become ${target.name}?`,
    text: "The panel is listening. Choose the answer that fits the workplace and your record.",
    targetRoleId: target.id,
    choices: PROMOTION_CHOICES.map((choice) => ({ ...choice, action: "RESOLVE_PROMOTION" })),
  };
}

export function resolvePromotionDecision(state, choiceId, { random = Math.random } = {}) {
  const decision = getPromotionDecision(state);
  const choice = PROMOTION_CHOICES.find((entry) => entry.id === choiceId);
  if (!decision || !choice) {
    return { state, ok: false, status: { promoted: false, reason: "invalid-panel" } };
  }

  const next = clone(state);
  const family = getFamily(next.career.familyId);
  const targetIndex = family.roles.findIndex((role) => role.id === decision.targetRoleId);
  const target = family.roles[targetIndex];
  if (!target || targetIndex <= next.career.roleIndex) {
    next.career.pendingPromotion = null;
    return { state: next, ok: false, status: { promoted: false, reason: "invalid-target" } };
  }

  const employer = getEmployer(next.career.employerId);
  const cultureBonus = employer.preferredChoiceId === choiceId ? 6 : 0;
  const educationBonus = qualificationFit(next, target) ? 10 : 0;
  const warningPenalty = next.career.warnings.length * 12 + next.career.verbalWarnings.length * 4;
  const score = next.career.performance * 0.2
    + next.career.readiness * 0.18
    + next.career.boss * 0.12
    + next.career.coworkers * 0.1
    + next.stats.reputation * 0.1
    + Math.min(20, next.career.attendanceStreak) * 0.7
    + Math.min(10, (next.career.experience / Math.max(1, target.minExperience)) * 10)
    + educationBonus
    + choice.answerFit
    + cultureBonus
    + (1 - Math.max(0, Math.min(1, Number(random()) || 0))) * 10
    - warningPenalty;
  const promoted = score >= 72;
  const record = {
    id: `promotion-${next.calendar.day}-${next.career.interviewHistory.length + 1}`,
    type: "promotion",
    day: next.calendar.day,
    familyId: family.id,
    targetRoleId: target.id,
    choiceId,
    score: Math.round(score),
    outcome: promoted ? "promoted" : "not-yet",
  };
  next.career.interviewHistory = [...next.career.interviewHistory, record].slice(-40);
  next.career.pendingPromotion = null;

  if (promoted) {
    next.career.roleIndex = targetIndex;
    next.career.role = target.name;
    next.career.salary = target.salary;
    next.career.readiness = clamp(next.career.readiness - 35);
    next.career.performance = clamp(next.career.performance + 2);
  } else {
    next.career.readiness = clamp(next.career.readiness - 8);
    next.career.performance = clamp(next.career.performance - (choiceId === "wing-it" ? 5 : 2));
    if (choiceId === "wing-it") next.career.boss = clamp(next.career.boss - 2);
  }
  return {
    state: next,
    ok: true,
    status: {
      promoted,
      reason: promoted ? "promoted" : "not-yet",
      score: Math.round(score),
      role: next.career.role,
    },
  };
}

export function settleCareerDay(state, { day = state.calendar.day, attendance = "present" } = {}) {
  const settlementId = "career-day-" + day;
  if (state.dailyState.settledIds.includes(settlementId)) {
    return { state, transactions: [], status: { duplicate: true, promotion: false } };
  }
  let next = clone(state);
  const status = { duplicate: false, promotion: false, promotionPending: false, dismissed: false };
  if (!next.career.active || next.career.dismissed) return { state: next, transactions: [], status };
  if (next.career.warnings.length >= 3) {
    next.career.conductHistory = [...next.career.conductHistory, {
      id: `warning-dismissal-${day}-${next.career.conductHistory.length + 1}`,
      day,
      outcome: "dismissal",
      reason: "Repeated written warnings",
    }].slice(-12);
    next.career.active = false;
    next.career.dismissed = true;
    status.dismissed = true;
    next.dailyState.settledIds.push(settlementId);
    return { state: next, transactions: [], status };
  }

  let transactions = [];
  if (attendance === "present") {
    const paid = applyEffects(next, { cash: next.career.salary }, { source: "salary" });
    next = paid.state;
    transactions = paid.transactions;
    next.career.attendanceStreak += 1;
    next.career.experience = Math.max(0, Number(next.career.experience) || 0) + 1;
    next.career.performance = clamp(next.career.performance + 1);
  } else {
    next.career.attendanceStreak = 0;
  }

  next.career.warnings = next.career.warnings.filter((warning) => !(
    next.career.attendanceStreak >= 6
    && next.career.performance >= 60
    && day - warning.day >= 7
  ));

  if (isPromotionReady(next)) {
    const roles = careerRoles(next.career);
    const target = roles[next.career.roleIndex + 1];
    next.career.pendingPromotion = {
      id: `promotion-${next.career.familyId}-${target.id}-${day}`,
      familyId: next.career.familyId,
      employerId: next.career.employerId,
      fromRoleId: roles[next.career.roleIndex].id,
      targetRoleId: target.id,
      createdDay: day,
    };
    status.promotionPending = true;
  }
  next.dailyState.settledIds.push(settlementId);
  return { state: next, transactions, status };
}
