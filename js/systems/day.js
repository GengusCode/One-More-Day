import { contributeStokvel, settleHouseholdDay, settleStokvelPayout } from "./household.js";
import { applyEffects } from "../core/state.js";
import { formatRand } from "../data/economy.js";
import { EVENTS, WORK_DECISIONS, getEventById, isEventEligible } from "../data/events.js";
import {
  createDeckState,
  drawEvent,
  getChoiceStage,
  resolveDueEvents,
  describeConsequence,
  scheduleDelayedEvent,
  scheduleChoiceConsequence,
} from "./event-deck.js";
import { startCareer, resolveCareerChoice, settleCareerDay, getPromotionDecision } from "./career.js";
import { startBusiness, resolveOwnerChoice, settleBusinessDay } from "./business.js";
import { getTravelOptions, resolveTravel, resetDailyTransport, assignCarForDay } from "./travel.js";
import { advanceLifeCalendar, evaluateLifeEnding, getSchoolDecision } from "./life.js";
import { resolveJobApplication, getInterviewDecision } from "./jobs.js";
import { getCurrentStudyDecision, settleEducationDay } from "./education.js";

const clone = (value) => (
  typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value))
);
const clamp = (value) => Math.max(0, Math.min(100, Number(value) || 0));
const BAD_SURPRISES = new Set(['phone-theft', 'water-off', 'loadshedding-deadline', 'rain-on-wash-day']);
const surpriseType = event => event.surprise || (event.id === 'lost-wallet' ? 'good' : BAD_SURPRISES.has(event.id) ? 'bad' : null);

function shuffleIds(items, random = Math.random) {
  const ids = items.map((item) => item.id);
  for (let index = ids.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [ids[index], ids[swap]] = [ids[swap], ids[index]];
  }
  return ids;
}

function resetDailyState(state) {
  const next = clone(state);
  next.dailyState = {
    day: next.calendar.day,
    phase: "morning",
    activeEventId: null,
    activeChoiceId: null,
    choiceOrder: [],
    followUpOrder: [],
    followUp: null,
    workDecisionId: null,
    needsTravel: false,
    travelContext: {},
    afterTravel: "headline",
    travelResolved: false,
    stayedHome: false,
    updates: [],
    dayPlan: null,
    scheduledActivity: null,
    settledIds: [],
    result: null,
    chase: null,
    complete: false,
  };
  return next;
}

function isWorkingDay(state) {
  return state.calendar.weekday >= 1 && state.calendar.weekday <= 5;
}

function hasPath(state) {
  return state.career.active || state.business.active;
}

function dueActivity(state) {
  return (state.routine?.pending || []).find(item => {
    const event = getEventById(item.eventId);
    return event && item.dueDay <= state.calendar.day && isEventEligible(event,state)
      && (!['owner','corporate'].includes(event.deck) || (isWorkingDay(state) && hasPath(state) && !state.dailyState.stayedHome));
  });
}

function applyDomainEffects(state, effects = {}, meta = {}) {
  let next = clone(state);
  const career = effects.career || {};
  const business = effects.business || {};
  for (const key of ["performance", "boss", "coworkers", "readiness"]) {
    if (career[key]) next.career[key] = clamp(next.career[key] + Number(career[key]));
  }
  if (business.trust) next.business.trust = clamp(next.business.trust + Number(business.trust));
  const applied = applyEffects(next, effects, { source: "event", ...meta });
  return { state: applied.state, transactions: applied.transactions };
}


function setHeadline(state, event, random) {
  const next = clone(state);
  next.dailyState.phase = "headline";
  next.dailyState.activeEventId = event.id;
  next.dailyState.activeChoiceId = null;
  next.dailyState.choiceOrder = shuffleIds(event.choices, random);
  next.dailyState.followUpOrder = [];
  next.dailyState.followUp = null;
  return next;
}

function drawHeadline(state, random, { transportOnly = false, excludeTransport = false, decks = null, fortune = null } = {}) {
  const eligible = EVENTS.filter((event) => {
    if (event.followUpOnly) return false;
    if (fortune ? surpriseType(event) !== fortune : surpriseType(event)) return false;
    if (decks && !decks.includes(event.deck)) return false;
    if (event.choices.some(choice => choice.nextActivity && (state.routine?.pending || []).some(item => item.eventId === choice.nextActivity.eventId))) return false;
    if (transportOnly && event.deck !== "transport") return false;
    if (excludeTransport && event.deck === "transport") return false;
    return isEventEligible(event, state);
  });
  if (!eligible.length) {
    const next = clone(state);
    next.dailyState.phase = "work";
    return next;
  }
  const ids = eligible.map((event) => event.id);
  const deckKey = fortune ? 'surprise-' + fortune : decks ? 'routine-' + decks.join('-') : transportOnly ? "transport" : "headline";
  const deck = state.eventDecks[deckKey] || createDeckState(ids, random);
  const drawn = drawEvent({
    deckState: deck,
    eligibleIds: ids,
    recentIds: state.eventHistory.headlineIds || [],
    random,
  });
  const event = eligible.find((item) => item.id === drawn.eventId) || eligible[0];
  let next = clone(state);
  next.eventDecks[deckKey] = drawn.deckState;
  next.eventHistory.headlineIds = [...next.eventHistory.headlineIds, event.id].slice(-40);
  return setHeadline(next, event, random);
}

function assignWorkDecision(state, random) {
  const next = clone(state);
  if (!isWorkingDay(next) || !hasPath(next)) return next;
  const path = next.career.active ? "career" : "business";
  const choices = WORK_DECISIONS.filter((item) => item.path === path && item.id !== 'owner-equipment' && isEventEligible(item, next)).map((item) => item.id);
  if (!choices.length) return next;
  const deckKey = "work-" + path;
  const drawn = drawEvent({
    deckState: next.eventDecks[deckKey], eligibleIds: choices,
    recentIds: next.eventHistory.workIds || [], random,
    recentLimit: Math.max(1,Math.floor(choices.length/2)),
  });
  next.dailyState.workDecisionId = drawn.eventId;
  next.eventDecks[deckKey] = drawn.deckState;
  next.eventHistory.workIds = [...(next.eventHistory.workIds || []), drawn.eventId].slice(-40);
  return next;
}

function enterTravel(state, context, afterTravel) {
  const next = clone(state);
  next.dailyState.phase = "travel";
  next.dailyState.travelContext = context;
  next.dailyState.afterTravel = afterTravel;
  return next;
}

function prepareActivity(state, random) {
  let next = clone(state);
  next.routine ||= {lastSurpriseDay:0,pending:[]};
  const working = isWorkingDay(next) && hasPath(next);
  next.dailyState.dayPlan = {
    kind:'routine', moment: working ? 'AT WORK' : 'YOUR FREE TIME',
    morning: working
      ? next.career.active ? `You get ready for your shift as ${next.career.role || 'an employee'}.` : 'You get ready to serve today’s customers and manage your business.'
      : ['A day off gives you time for home, errands and the people in your life.', 'There is no scheduled shift today. You have room for your own plans.', 'You start a free day with some rest and a few things to sort out.'][next.calendar.day % 3],
    cause:'', fortune:null,
  };
  // A commitment takes priority over a fresh random situation.
  const pending = next.routine.pending || [];
  next.routine.pending = pending.filter(item => getEventById(item.eventId));
  const due = dueActivity(next);
  if (due) {
    next.dailyState.scheduledActivity = due;
    next.routine.pending = next.routine.pending.filter(item => item !== due);
    next.dailyState.dayPlan.kind = 'follow-up';
    next.dailyState.dayPlan.cause = due.cause;
    if (working && !['owner','corporate'].includes(getEventById(due.eventId).deck)) next.dailyState.dayPlan.moment = 'AFTER WORK';
    return setHeadline(next,getEventById(due.eventId),random);
  }
  // Surprises remain rare at any luck level, with at least a week between them.
  if (next.calendar.day - next.routine.lastSurpriseDay >= 7 && random() < .06) {
    const fortune = random() < .2 + .6 * clamp(next.stats.luck ?? 50) / 100 ? 'good' : 'bad';
    const surprised = drawHeadline(next,random,{excludeTransport:true,fortune});
    if (surprised.dailyState.activeEventId) {
      surprised.routine.lastSurpriseDay = next.calendar.day;
      surprised.dailyState.dayPlan.kind = 'surprise';
      surprised.dailyState.dayPlan.fortune = fortune;
      surprised.dailyState.dayPlan.moment = 'AN UNPLANNED MOMENT';
      return surprised;
    }
  }
  if (working && random() < .8) {
    if (random() < .75) {
      next = assignWorkDecision(next,random);
      if (next.dailyState.workDecisionId) {next.dailyState.phase='work';return next;}
    }
    return drawHeadline(next,random,{excludeTransport:true,decks:[next.career.active ? 'corporate' : 'owner']});
  }
  next.dailyState.dayPlan.moment = working ? 'AFTER WORK' : 'YOUR FREE TIME';
  return drawHeadline(next,random,{excludeTransport:true,decks:['community','relationships','money','opportunity']});
}

function finishDay(state) {
  const next = settleHouseholdDay(state);
  next.dailyState.phase = "complete";
  next.dailyState.complete = true;
  return next;
}

function createChaseSeed(state, eventId) {
  let value = state.calendar.day * 10_007 + state.eventHistory.headlineIds.length * 97;
  for (const character of String(state.profile.name) + eventId) {
    value = (value * 31 + character.codePointAt(0)) >>> 0;
  }
  return value || 1;
}

function beginWork(state) {
  const next = clone(state);
  if (!isWorkingDay(next) || !hasPath(next)) return finishDay(next);
  if (next.dailyState.stayedHome) {
    const id = (next.career.active ? "career-day-" : "business-day-") + next.calendar.day;
    if (!next.dailyState.settledIds.includes(id)) next.dailyState.settledIds.push(id);
    return finishDay(next);
  }
  next.dailyState.workDecisionId = null;
  return resolveWork(next, "");
}

function settleCommute(state) {
  if (state.dailyState.travelResolved || state.dailyState.stayedHome || !state.dailyState.needsTravel) return state;
  const options = getTravelOptions(state,{});
  const mode = [state.transport.preferredVehicleId,'bicycle','car','sports','fleet-1','fleet-2','fleet-3','taxi'].find(id=>options.some(item=>item.id===id));
  if (!mode) return state;
  const next = resolveTravel(state,mode,{}).state;
  next.dailyState.travelResolved = true;
  return next;
}

export function canStayHomeToday(state) {
  return isWorkingDay(state) && hasPath(state) && !state.dailyState.stayedHome && !state.dailyState.travelResolved
    && ['headline','work','travel'].includes(state.dailyState.phase);
}

export function stayHomeToday(state, {random=Math.random} = {}) {
  if (!canStayHomeToday(state)) return state;
  let next=resolveTravel(state,'stay-home',{calledAhead:true}).state;
  next.dailyState.stayedHome=true;
  next.dailyState.travelResolved=true;
  next.dailyState.needsTravel=false;
  if (next.dailyState.scheduledActivity) next.routine.pending.push(next.dailyState.scheduledActivity);
  next.dailyState.scheduledActivity=null;
  next.dailyState.workDecisionId=null;
  next.dailyState.dayPlan={kind:'routine',moment:'AT HOME',morning:next.career.active?'You let work know you are staying home. There is no shift pay today, and your attendance affects your performance.':'You stay home today. Your business has less capacity without you.',cause:'',fortune:null};
  const homeDue=dueActivity(next);
  if(homeDue && !['owner','corporate'].includes(getEventById(homeDue.eventId).deck)) {
    next.routine.pending=next.routine.pending.filter(item=>item!==homeDue);
    next.dailyState.dayPlan.cause=homeDue.cause;
    return setHeadline(next,getEventById(homeDue.eventId),random);
  }
  return drawHeadline(next,random,{excludeTransport:true,decks:['community','relationships','money']});
}

function needsTravelAfterChoice(choice) {
  return Boolean(choice?.flags?.travelDecision || choice?.flags?.stayHomePrompt);
}

function resolveTransportHeadline(state, event, choice) {
  let next = clone(state);
  if (needsTravelAfterChoice(choice)) {
    const context = {
      taxiStrike: Boolean(choice.flags?.taxiStrike),
      surge: event.id === "ehailing-surge",
      calledAhead: Boolean(choice.flags?.calledAhead || next.dailyState.travelContext.calledAhead),
    };
    return enterTravel(next, context, "work");
  }
  if (choice?.flags?.forceTravel) {
    next = resolveTravel(next, "ehailing", { surge: true }).state;
    next.dailyState.travelResolved = true;
    return next;
  }
  if (event.id === "taxi-full" && ["bag-lap", "bag-boot", "wait"].includes(choice.id)) {
    next.dailyState.travelResolved = true;
    return next;
  }
  if (!next.dailyState.travelResolved) {
    const options = getTravelOptions(next, {});
    if (options.some((item) => item.id === "taxi")) {
      next = resolveTravel(next, "taxi", {}).state;
      next.dailyState.travelResolved = true;
    } else return enterTravel(next, {}, "work");
  }
  return next;
}

function finalizeHeadline(state, event, choice) {
  let next = clone(state);
  if (choice?.minigame) {
    next.dailyState.phase = "minigame";
    next.dailyState.chase = {
      status: "pending",
      eventId: event.id,
      seed: createChaseSeed(next, event.id),
      resolutionId: null,
    };
    return next;
  }
  if (event.deck === "transport") {
    next = resolveTransportHeadline(next, event, choice);
    if (next.dailyState.phase === "travel") return next;
  }
  return beginWork(next);
}

function applyEventChoice(state, event, choice, random) {
  let next = clone(state);
  if (event.id === "stokvel-pressure" && ["full-stokvel", "partial-stokvel"].includes(choice.id)) {
    const contribution = contributeStokvel(next, choice.id === "full-stokvel" ? 180 : 80);
    if (!contribution.ok) { next.dailyState.result = "You cannot afford this contribution, or this month is already paid."; return next; }
    next = contribution.state;
  }
  next = applyDomainEffects(next, choice.effects || {}, {source:event.id,label:choice.label}).state;
  next = scheduleChoiceConsequence(next, event.id, choice, random);
  if (choice.nextActivity) {
    const follow = choice.nextActivity;
    next.routine ||= {lastSurpriseDay:0,pending:[]};
    if (!next.routine.pending.some(item => item.eventId === follow.eventId)) {
      const days = follow.minDays + Math.floor(random() * (follow.maxDays - follow.minDays + 1));
      next.routine.pending.push({eventId:follow.eventId,dueDay:next.calendar.day+days,cause:choice.result});
    }
  }
  next.dailyState.result = choice.result || "";
  return next;
}

export function startDay(state, { random = Math.random } = {}) {
  if (state.dailyState.phase !== "morning") return state;
  if (state.life?.stage === "school-finale") return state;
  let next = settleStokvelPayout(resetDailyTransport(state, state.calendar.day));
  next = applyEffects(next, { stats: { energy: 12 } }, { source: "morning-recovery" }).state;
  const due = resolveDueEvents(next, next.calendar.day);
  next = due.state;
  next.dailyState.updates = [due.primary, ...due.updates].filter(Boolean).map(describeConsequence);
  if (due.primary) {
    next.dailyState.result = describeConsequence(due.primary);
  }
  for (const dueItem of [due.primary, ...due.updates].filter(Boolean)) {
    if (dueItem.eventId !== "job-application") continue;
    const jobResult = resolveJobApplication(next, dueItem.payload?.applicationId || dueItem.outcomeId);
    next = jobResult.state;
    if (jobResult.resolved) next.dailyState.result = next.jobs.lastResult?.message || next.dailyState.result;
  }
  if (!hasPath(next)) {
    next.dailyState.phase = "path";
    return next;
  }
  next.dailyState.needsTravel = isWorkingDay(next);
  return prepareActivity(next, random);
}

export function choosePath(state, pathId, { random = Math.random } = {}) {
  let next;
  if (pathId === "office") next = startCareer(state, "office");
  else if (["car-wash", "moving-service", "buy-resell"].includes(pathId)) next = startBusiness(state, pathId);
  else return state;
  next.dailyState.needsTravel = isWorkingDay(next);
  return prepareActivity(next, random);
}

export function chooseTravel(state, optionId) {
  if (state.dailyState.phase !== "travel") return state;
  if (optionId === 'stay-home') return stayHomeToday(state);
  let next = resolveTravel(state, optionId, state.dailyState.travelContext || {}).state;
  next.dailyState.stayedHome = optionId === "stay-home";
  next.dailyState.travelResolved = true;
  if (next.dailyState.afterTravel === "work") return beginWork(next);
  return drawHeadline(next, Math.random, { excludeTransport: true });
}

export function chooseEvent(state, eventId, choiceId, { random = Math.random } = {}) {
  if (state.dailyState.phase === "travel") return chooseTravel(state, choiceId);
  const event = getEventById(eventId);
  if (!event) return state;
  if (state.dailyState.phase === "headline") {
    const choice = event.choices.find((item) => item.id === choiceId);
    if (!choice) return state;
    const followUp = getChoiceStage(event, choiceId);
    if (followUp) {
      const next = clone(state);
      next.dailyState.phase = "follow-up";
      next.dailyState.activeChoiceId = choiceId;
      next.dailyState.followUp = followUp;
      next.dailyState.followUpOrder = shuffleIds(followUp.choices, Math.random);
      return next;
    }
    return finalizeHeadline(applyEventChoice(state, event, choice, random), event, choice);
  }
  if (state.dailyState.phase === "follow-up") {
    const choice = state.dailyState.followUp?.choices?.find((item) => item.id === choiceId);
    if (!choice) return state;
    return finalizeHeadline(applyEventChoice(state, event, choice, random), event, choice);
  }
  return state;
}

export function resolveWork(state, choiceId, { random = Math.random } = {}) {
  if (state.dailyState.phase === "complete") return state;
  let next = clone(state);
  next = settleCommute(next);
  if (next.dailyState.phase === "work" && next.dailyState.workDecisionId && choiceId) {
    const result = next.career.active
      ? resolveCareerChoice(next, next.dailyState.workDecisionId, choiceId, { random })
      : resolveOwnerChoice(next, next.dailyState.workDecisionId, choiceId, { random });
    next = result.state;
    next.dailyState.result = result.status?.result || next.dailyState.result;
  }
  if (!next.dailyState.stayedHome) {
    const result = next.career.active
      ? settleCareerDay(next, { day: next.calendar.day, attendance: "present" })
      : next.business.active
        ? settleBusinessDay(next, { day: next.calendar.day, operating: true, random })
        : { state: next };
    next = result.state;
  }
  return finishDay(next);
}

export function resolveMinigame(state, result) {
  const chase = state.dailyState.chase;
  if (state.dailyState.phase !== "minigame" || !chase || chase.status === "resolved") return state;
  const resolutionId = "chase-" + state.calendar.day + "-" + chase.seed;
  if (state.dailyState.settledIds.includes(resolutionId)) return state;
  const effects = result?.outcome === "caught"
    ? { stats: { happiness: 6, reputation: 5 } }
    : { stats: { happiness: -10, reputation: -2 } };
  let next = applyEffects(state, effects, { source: "phone-theft-chase" }).state;
  next.dailyState.settledIds.push(resolutionId);
  next.dailyState.chase = {
    ...chase,
    status: "resolved",
    resolutionId,
    result: result?.outcome || "escaped",
    reason: String(result?.reason || "unknown"),
  };
  next.dailyState.result = result?.outcome === "caught"
    ? "You get your phone back. The crowd cheers."
    : "The thief disappears. You are safe, but the phone is gone.";
  return beginWork(next);
}

export function resolveUnavailableMinigame(state) {
  return resolveMinigame(state, {
    outcome: "escaped",
    reason: "runner-unavailable",
  });
}

export function canAdvanceDay(state) {
  return state.dailyState.phase === "complete" && state.dailyState.complete === true;
}

export function advanceDay(state, { random = Math.random } = {}) {
  if (!canAdvanceDay(state)) return state;
  let next = clone(state);
  next.calendar.day += 1;
  next.calendar.weekday = next.calendar.weekday === 7 ? 1 : next.calendar.weekday + 1;
  next = advanceLifeCalendar(next, 1);
  const milestone = next.life.lastMilestone;
  next = evaluateLifeEnding(next, { random });
  if (next.life.ended) return next;
  next = resetDailyState(next);
  next = settleEducationDay(next, { day: next.calendar.day, random }).state;
  next = startDay(next, { random });
  if (milestone?.type === "birthday") next.dailyState.result = milestone.message;
  return next;
}

export function settleRoutineDay(state, { random = Math.random, driverMode = false } = {}) {
  if (!canAdvanceDay(state)) {
    return { state, transactions: [], interrupted: true, reason: "unfinished-day" };
  }
  let next = clone(state);
  next.calendar.day += 1;
  next.calendar.weekday = next.calendar.weekday === 7 ? 1 : next.calendar.weekday + 1;
  next = advanceLifeCalendar(next, 1);
  const milestone = next.life.lastMilestone;
  next = evaluateLifeEnding(next, { random });
  if (next.life.ended) {
    return { state: next, transactions: [], interrupted: true, reason: "life-ending" };
  }
  next = resetDailyState(next);
  next = resetDailyTransport(next, next.calendar.day);

  if (milestone?.type === "birthday") {
    const interruptedState = startDay(next, { random });
    interruptedState.dailyState.result = milestone.message;
    return { state: interruptedState, transactions: [], interrupted: true, reason: "birthday" };
  }

  const highImpactDue = next.delayedEvents
    .filter((item) => Number(item.dueDay) <= next.calendar.day)
    .sort((a, b) => (Number(b.severity) || 0) - (Number(a.severity) || 0))
    .find((item) => !item.payload?.automaticRoutine && (item.eventId === "job-application" || item.payload?.highImpact || Number(item.severity) >= 3));
  if (highImpactDue) {
    const interruptedState = startDay(next, { random });
    return {
      state: interruptedState,
      transactions: [],
      interrupted: true,
      reason: highImpactDue.eventId === "job-application" ? "job-result" : "important-event",
    };
  }

  if (dueActivity(next)) {
    return {state:startDay(next,{random}),transactions:[],interrupted:true,reason:'planned-commitment'};
  }

  const transactions = [];
  const education = settleEducationDay(next, { day: next.calendar.day, random });
  next = education.state;
  transactions.push(...education.transactions);
  const educationCheckpoint = education.status.checkpointDue;

  next = applyEffects(next, { stats: { energy: 12 } }, { source: "routine-recovery" }).state;
  const due = resolveDueEvents(next, next.calendar.day);
  next = due.state;
  next.dailyState.updates = [due.primary, ...due.updates].filter(Boolean).map(describeConsequence);
  if (due.primary) next.dailyState.result = describeConsequence(due.primary);

  let automaticChoice = null;
  if (isWorkingDay(next) && hasPath(next) && random()<.45) {
    next = assignWorkDecision(next,random);
    const event=WORK_DECISIONS.find(item=>item.id===next.dailyState.workDecisionId);
    const suitable=event?.choices.filter(item=> {
      const effects=item.effects || {};
      return !item.risk && !(effects.cash<0) && !item.followUp &&
        !(effects.business?.trust<=-8) &&
        !(effects.stats?.reputation<0);
    }) || [];
    const choice=suitable[Math.min(suitable.length-1,Math.floor(random()*suitable.length))];
    if(event && !choice) {
      next.dailyState.phase='work';
      next.dailyState.needsTravel=true;
      return {state:next,transactions:[],interrupted:true,reason:'decision-needed'};
    }
    if(choice) {
      const previousIds=new Set(next.delayedEvents.map(item=>item.outcomeId));
      const resolved=next.career.active ? resolveCareerChoice(next,event.id,choice.id,{random}) : resolveOwnerChoice(next,event.id,choice.id,{random});
      next=resolved.state;
      transactions.push(...resolved.transactions);
      next.delayedEvents.forEach(item=>{if(!previousIds.has(item.outcomeId))item.payload.automaticRoutine=true;});
      automaticChoice={day:next.calendar.day,title:event.title,choice:choice.label,result:resolved.status.result};
    }
  }
  if (driverMode && next.transport.owned.includes("car")) {
    const driver = assignCarForDay(next, "driver", random);
    if (driver.ok) {
      next = driver.state;
      transactions.push(...driver.transactions);
      if (driver.followUp) next = scheduleDelayedEvent(next, driver.followUp);
    }
  }

  if (isWorkingDay(next) && hasPath(next)) {
    const options=getTravelOptions(next);
    const preferred=next.transport.preferredVehicleId;
    const mode=options.some(option=>option.id===preferred) ? preferred : options.some(option=>option.id==='bicycle') ? 'bicycle' : 'taxi';
    const commute = resolveTravel(next, mode, {});
    next = commute.state;
    transactions.push(...commute.transactions);
  }
  let status = {};
  if (isWorkingDay(next) && next.career.active) {
    const settled = settleCareerDay(next, { day: next.calendar.day, attendance: "present" });
    next = settled.state;
    transactions.push(...settled.transactions);
    status = settled.status;
  } else if (isWorkingDay(next) && next.business.active) {
    const settled = settleBusinessDay(next, { day: next.calendar.day, operating: true, random });
    next = settled.state;
    transactions.push(...settled.transactions);
    status = settled.status;
  }

  next = applyEffects(next, { stats: { energy: -3, happiness: next.calendar.day % 30 === 0 ? -1 : 0 } }, { source: "routine-day" }).state;
  next = finishDay(next);
  const repossessed = next.garage.vehicles.some(v => v.status === "repossessed" && state.garage.vehicles.find(old => old.id === v.id)?.status === "owned");
  const reason = repossessed ? "vehicle-repossessed" : status.promotion ? "promotion"
    : status.dismissed ? "dismissed"
      : status.reason === "closed" ? "business-closed"
        : next.stats.health <= 15 ? "critical-health"
          : state.finances.cash >= 0 && next.finances.cash < 0 ? "low-cash"
            : educationCheckpoint ? "study-checkpoint"
              : "";
  if (reason === "study-checkpoint") {
    next.timeline.educationMilestone = {
      day: next.calendar.day,
      programmeId: next.education.active?.programmeId || null,
      checkpointId: educationCheckpoint,
    };
  }
  if (reason && reason !== "vehicle-repossessed") next.dailyState.result = reason === "promotion"
    ? `Promotion: you are now ${next.career.role}.`
    : reason === "dismissed" ? "Your employment has ended."
      : reason === "business-closed" ? "Your business has closed."
        : reason === "critical-health" ? "Your health needs your attention."
          : "Your cash has dropped below zero.";
  return { state: next, transactions, automaticChoice, interrupted: Boolean(reason), reason };
}

export function getCurrentDecision(state) {
  const schoolDecision = getSchoolDecision(state);
  if (schoolDecision) return schoolDecision;
  const interviewDecision = getInterviewDecision(state);
  if (interviewDecision) return interviewDecision;
  const studyDecision = getCurrentStudyDecision(state);
  if (studyDecision) return studyDecision;
  const promotionDecision = getPromotionDecision(state);
  if (promotionDecision) return promotionDecision;
  if (state.dailyState.phase === "path") {
    return {
      icon: "📱", kicker: "ADULT LIFE", title: "Your first opportunity is waiting",
      text: "Open Jobs on your phone. Pick one path now; you can build it from the ground up.",
      result: state.dailyState.result,
      choices: [
        { id: "jobs", label: "Open Jobs", detail: "See the opportunities available to you.", action: "OPEN_PHONE_APP" },
      ],
    };
  }
  if (state.dailyState.phase === "travel") {
    const options = getTravelOptions(state, state.dailyState.travelContext || {});
    return {
      icon: "🛣️", kicker: "GETTING THERE", title: "How are you moving today?",
      text: "Price, comfort and reliability are all part of the choice.",
      choices: options.map((item) => ({ ...item, detail: item.cost ? "R" + item.cost : "No travel fare", action: "CHOOSE_TRAVEL" })),
    };
  }
  if (state.dailyState.phase === "headline") {
    const event = getEventById(state.dailyState.activeEventId);
    if (!event) return null;
    const order = state.dailyState.choiceOrder;
    return {
      ...event,
      kicker: [state.dailyState.dayPlan?.moment, event.kicker].filter(Boolean).join(' · '),
      text: [state.dailyState.dayPlan?.cause ? `Because of your earlier decision: ${state.dailyState.dayPlan.cause}` : '',event.text].filter(Boolean).join(' '),
      result: state.dailyState.result || event.result,
      choices: order
        .map((id) => event.choices.find((item) => item.id === id))
        .filter(Boolean)
        .map((choice) => ({ ...choice, action: "CHOOSE_EVENT" })),
    };
  }
  if (state.dailyState.phase === "follow-up") {
    const followUp = state.dailyState.followUp;
    if (!followUp) return null;
    return {
      icon: "↪", kicker: "YOUR MOVE", title: followUp.title, text: followUp.text,
      choices: state.dailyState.followUpOrder
        .map((id) => followUp.choices.find((item) => item.id === id))
        .filter(Boolean)
        .map((choice) => ({ ...choice, action: "CHOOSE_EVENT" })),
    };
  }
  if (state.dailyState.phase === "work") {
    const event = WORK_DECISIONS.find((item) => item.id === state.dailyState.workDecisionId);
    if (!event) return null;
    return {
      icon: state.career.active ? "💼" : "🧰",
      kicker: state.career.active ? "WORK DECISION" : "OWNER DECISION",
      title: event.title,
      text: state.career.active ? 'During your shift, this needs your attention. Your pay comes from your work, while this choice shapes how it goes.' : 'While serving today’s customers, this needs your attention. Sales still have to cover your supplies and expenses.',
      choices: event.choices.map((choice) => ({ ...choice, action: "RESOLVE_WORK" })),
    };
  }
  if (state.dailyState.phase === "minigame") {
    return {
      icon: "📱", kicker: "THEFT CHASE", title: "The thief is moving.",
      text: "The runner challenge is loading.",
      choices: [],
    };
  }
  if (state.dailyState.phase === "complete" && state.dailyState.result) {
    return {
      icon: "🌙", kicker: "EVENING · DAY COMPLETE", title: "How your day turned out",
      text: state.dailyState.result, choices: [],
    };
  }
  return null;
}
