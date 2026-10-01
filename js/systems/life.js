import { ENTRANCE_QUESTIONS } from "../data/entrance-test.js";
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
  if (state.life.school?.step === "entrance-test") {
    const quiz = state.life.school.quiz;
    const question = ENTRANCE_QUESTIONS.find(item=>item.id===quiz?.order[quiz.index]);
    if (!question) return null;
    const order = quiz.choiceOrders?.[question.id] || question.choices.map(choice=>choice.id);
    const category = ['logic','reading','priority','instructions','date','delivery'].some(prefix=>question.id.startsWith(prefix)) ? 'Reading & reasoning' : 'Numbers & everyday problems';
    return { icon: "📝", kicker: `STARTING TEST · ${quiz.index+1}/8 · ${category}`, title: question.text, text: "Choose one answer before the timer ends. Pass mark: 50%. Your score determines starting knowledge and available jobs.", timerSeconds: Math.max(0,Math.ceil((quiz.deadline-Date.now())/1000)), choices: order.map(id=>question.choices.find(choice=>choice.id===id)).filter(Boolean).map((choice,index)=>({...choice,label:`${String.fromCharCode(65+index)}. ${choice.label}`,action:"CHOOSE_SCHOOL"})) };
  }
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

function recordEntranceAnswer(state, answer, now) {
  const quiz=state.life.school.quiz;
  const question=ENTRANCE_QUESTIONS.find(item=>item.id===quiz?.order[quiz.index]);
  if(!question)return state;
  const next=clone(state);
  next.life.school.quiz.answers.push({questionId:question.id,answer,correct:answer===question.correct});
  next.life.school.quiz.index++;
  next.life.school.quiz.deadline=now+30000;
  if(next.life.school.quiz.index<8)return next;
  const correct=next.life.school.quiz.answers.filter(item=>item.correct).length;
  const score=Math.round(correct/8*100);
  next.life.examResult={score,correct,total:8,band:score>=75?'strong':score>=50?'pass':'developing',label:score>=75?'Strong pass':score>=50?'Pass':'Needs practice',approach:'entrance-test'};
  next.stats.knowledge=Math.round(20+score*.65);
  next.stats.happiness=Math.min(100,next.stats.happiness+(score>=50?5:0));
  const completed=completeSchool(next);
  completed.dailyState.result=`Test result: ${score}% (${correct}/8). ${next.life.examResult.label}. Starting knowledge: ${next.stats.knowledge}/100. R650 in gifts helps you start. Open Jobs to compare your starting paths.`;
  return completed;
}
export function expireEntranceQuestion(state,{now=Date.now()}={}) {
  if(state.life.stage!=='school-finale'||state.life.school.step!=='entrance-test'||now<state.life.school.quiz.deadline)return state;
  return recordEntranceAnswer(state,null,now);
}
export function chooseSchoolDecision(state, choiceId, {now=Date.now()}={}) {
  const step=state.life?.school?.step;
  if(step==='entrance-test') {
    if(now>=state.life.school.quiz.deadline)return expireEntranceQuestion(state,{now});
    const question=ENTRANCE_QUESTIONS.find(item=>item.id===state.life.school.quiz?.order[state.life.school.quiz.index]);
    if(!question?.choices.some(choice=>choice.id===choiceId))return state;
    return recordEntranceAnswer(state,choiceId,now);
  }

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
