import { applyEffects } from "../core/state.js";
import {
  SCHOOL_COMPLETION_CASH,
  SCHOOL_DECISIONS,
  SCHOOL_STEPS,
} from "../data/life.js";

const clone = (value) => (
  typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value))
);

function examOutcome(state, choice) {
  const knowledgeBonus = Math.round((Number(state.stats.knowledge) || 0) * 0.28);
  const preparationBonus = state.life.school.choiceIds.includes("revise-notes") ? 7 : 0;
  const score = Math.max(30, Math.min(92, choice.scoreBase + knowledgeBonus + preparationBonus));
  return {
    score,
    band: score >= 75 ? "strong" : score >= 55 ? "pass" : "developing",
    label: score >= 75 ? "Strong pass" : score >= 55 ? "Pass" : "Entry pass",
    approach: choice.id,
  };
}

export function getSchoolDecision(state) {
  if (state.life?.stage !== "school-finale") return null;
  const decision = SCHOOL_DECISIONS[state.life.school?.step];
  if (!decision) return null;
  const face = state.relationships?.people?.[
    state.life.school.step === "last-morning" ? "friend" : state.life.school.step === "school-ends" ? "mentor" : "classmate"
  ];
  return {
    ...decision,
    text: face ? `${face.name} is ${face.reaction}. ${decision.text}` : decision.text,
    choices: decision.choices.map((choice) => ({ ...choice, action: "CHOOSE_SCHOOL" })),
  };
}

export function completeSchool(state) {
  if (state.life?.stage !== "school-finale" || state.life.school?.step === "complete") return state;
  let next = applyEffects(
    state,
    { cash: SCHOOL_COMPLETION_CASH, stats: { happiness: 5 } },
    { source: "school-completion" },
  ).state;
  next.life.stage = "adult";
  next.life.school.step = "complete";
  next.dailyState.phase = "path";
  next.dailyState.result = "School is finished. R650 in gifts gives your adult life a small start.";
  return next;
}

export function chooseSchoolDecision(state, choiceId) {
  const step = state.life?.school?.step;
  const decision = SCHOOL_DECISIONS[step];
  const choice = decision?.choices.find((item) => item.id === choiceId);
  if (!choice) return state;

  let next = applyEffects(state, choice.effects || {}, { source: `school-${step}` }).state;
  next.life.school.choiceIds = [...next.life.school.choiceIds, choice.id].slice(-3);
  if (step === "final-exam") next.life.examResult = examOutcome(next, choice);

  const currentIndex = SCHOOL_STEPS.indexOf(step);
  const nextStep = SCHOOL_STEPS[Math.min(currentIndex + 1, SCHOOL_STEPS.length - 1)];
  next.life.school.step = nextStep;
  return step === "school-ends" ? completeSchool({ ...next, life: { ...next.life, school: { ...next.life.school, step } } }) : next;
}

export function advanceLifeCalendar(state, days = 1) {
  if (state.life?.ended) return state;
  const next = clone(state);
  const previousDays = Math.max(0, Number(next.life.ageDays) || 0);
  const addedDays = Math.max(0, Math.round(Number(days) || 0));
  const totalDays = previousDays + addedDays;
  const birthdays = Math.floor(totalDays / 365) - Math.floor(previousDays / 365);
  next.life.ageDays = totalDays;
  next.life.lastMilestone = null;
  if (birthdays > 0) {
    next.calendar.age += birthdays;
    next.life.lastMilestone = {
      type: "birthday",
      age: next.calendar.age,
      day: next.calendar.day,
      message: `Happy birthday! ${next.profile.name} is now ${next.calendar.age}.`,
    };
  }
  if (next.calendar.age >= 60 && next.life.stage === "adult") next.life.stage = "later-life";
  return next;
}

export function advanceLifeClock(state, days = 1) {
  return advanceLifeCalendar(state, days);
}

function averageRelationship(state) {
  const people = Object.values(state.relationships?.people || {});
  if (!people.length) return 0;
  return Math.round(people.reduce((total, person) => total + (Number(person.score) || 0), 0) / people.length);
}

function memorableAchievement(state) {
  if (state.finances.netWorth >= 1_000_000) return "Built a million-rand life";
  if (state.business.value >= 100_000 || state.business.premises.length >= 2) return "Built a business with real roots";
  if (state.career.roleIndex >= 3) return "Became a respected workplace leader";
  if (averageRelationship(state) >= 75) return "Kept a strong circle close";
  if (state.assets.ownedUpgradeIds.length >= 3) return "Turned small upgrades into lasting progress";
  return "Kept showing up, one more day at a time";
}

export function buildLifeSummary(state) {
  const closest = Object.values(state.relationships?.people || {})
    .sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0))[0];
  const work = state.business?.title || state.career?.role || "Independent path";
  return {
    name: state.profile.name,
    age: state.calendar.age,
    daysLived: Math.max(state.calendar.day, state.life.ageDays),
    work,
    netWorth: state.finances.netWorth,
    closestPerson: closest?.name || "Their community",
    relationshipScore: averageRelationship(state),
    achievement: memorableAchievement(state),
    closingLine: `${state.profile.name}'s story reached a peaceful closing chapter.`,
  };
}

export function evaluateLifeEnding(state, { random = Math.random } = {}) {
  if (state.life?.ended || state.calendar.age < 70) return state;
  const health = Math.max(0, Math.min(100, Number(state.stats.health) || 0));
  const age = state.calendar.age;
  const chance = ((100 - health) / 5_000) + ((age - 70) / 10_000);
  if (age < 100 && random() >= chance) return state;
  const next = clone(state);
  next.life.stage = "ended";
  next.life.ended = true;
  next.life.endingSummary = buildLifeSummary(next);
  next.dailyState.phase = "ended";
  next.dailyState.complete = false;
  next.dailyState.result = next.life.endingSummary.closingLine;
  next.settings.phone = { open: false, app: "home" };
  return next;
}
