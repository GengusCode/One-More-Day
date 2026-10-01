import { applyEffects } from "../core/state.js";
import { WORK_DECISIONS } from "../data/events.js";
import { scheduleChoiceConsequence } from "./event-deck.js";

const clone = (value) => (
  typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value))
);
const clamp = (value) => Math.max(0, Math.min(100, Number(value) || 0));

export const CAREER_ROLES = Object.freeze([
  { name: "Office Junior", salary: 180, performance: 75, knowledge: 55, reputation: 50, readiness: 70 },
  { name: "Administrator", salary: 260, performance: 78, knowledge: 60, reputation: 55, readiness: 74 },
  { name: "Team Coordinator", salary: 380, performance: 80, knowledge: 67, reputation: 62, readiness: 78 },
  { name: "Department Manager", salary: 560, performance: 84, knowledge: 74, reputation: 70, readiness: 84 },
  { name: "Executive Director", salary: 850, performance: 100, knowledge: 100, reputation: 100, readiness: 100 },
]);

const CAREER_TRACKS = {
  retail: CAREER_ROLES.map((role,index)=>({...role,name:["Shop Assistant","Senior Assistant","Shop Supervisor","Store Manager","Regional Manager"][index],salary:[125,165,225,320,480][index]})),
  logistics: CAREER_ROLES.map((role,index)=>({...role,name:["Logistics Clerk","Stock Coordinator","Shift Supervisor","Operations Manager","Logistics Director"][index],salary:[200,285,400,580,850][index]})),
};
const careerRoles = career => CAREER_TRACKS[career.pathId] || CAREER_ROLES;

export function startCareer(state, careerId = "office", { roleIndex = 0 } = {}) {
  const roles=CAREER_TRACKS[careerId]||CAREER_ROLES;
  const index=Math.max(0,Math.min(roles.length-1,roleIndex));
  const next = clone(state);
  next.business.active = false;
  next.career = {
    ...next.career,
    active: true,
    pathId: careerId,
    roleIndex: index,
    role: roles[index].name,
    salary: roles[index].salary,
    performance: 50,
    boss: 50,
    coworkers: 50,
    warnings: [],
    verbalWarnings: [],
    conductHistory: [],
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
  const applied = applyEffects(next, choice.effects || {}, { source: eventId });
  next = applied.state;
  const consequence = choice.risk
    ? assessWorkConsequence(next, { ...choice.risk, random })
    : { type: "none", formalWarning: false, performanceDelta: 0, score: 0 };
  if (choice.risk) next = applyConsequence(next, consequence, eventId);
  next.career.recentDecisionIds = [...next.career.recentDecisionIds.filter((id) => id !== eventId), eventId].slice(-6);
  next = scheduleChoiceConsequence(next, eventId, choice, random);
  return { state: next, status: { valid: true, result: choice.result, consequence }, transactions: applied.transactions };
}

function isPromotionReady(state) {
  const roles=careerRoles(state.career);
  const role = roles[state.career.roleIndex];
  return state.career.roleIndex < roles.length - 1
    && state.career.performance >= role.performance
    && state.stats.knowledge >= role.knowledge
    && state.stats.reputation >= role.reputation
    && state.career.readiness >= role.readiness;
}

export function settleCareerDay(state, { day = state.calendar.day, attendance = "present" } = {}) {
  const settlementId = "career-day-" + day;
  if (state.dailyState.settledIds.includes(settlementId)) {
    return { state, transactions: [], status: { duplicate: true, promotion: false } };
  }
  let next = clone(state);
  const status = { duplicate: false, promotion: false, dismissed: false };
  if (!next.career.active || next.career.dismissed) return { state: next, transactions: [], status };
  if (next.career.warnings.length >= 3) {
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
    next.career.roleIndex += 1;
    const promoted = careerRoles(next.career)[next.career.roleIndex];
    next.career.role = promoted.name;
    next.career.salary = promoted.salary;
    next.career.readiness = clamp(next.career.readiness - 40);
    status.promotion = true;
  }
  next.dailyState.settledIds.push(settlementId);
  return { state: next, transactions, status };
}
