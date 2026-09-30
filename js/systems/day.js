import { applyEffects } from "../core/state.js";
import { EVENTS, WORK_DECISIONS, getEventById, isEventEligible } from "../data/events.js";
import {
  createDeckState,
  drawEvent,
  getChoiceStage,
  resolveDueEvents,
  scheduleDelayedEvent,
} from "./event-deck.js";
import { startCareer, resolveCareerChoice, settleCareerDay, getCareerDecisionIds } from "./career.js";
import { startBusiness, resolveOwnerChoice, settleBusinessDay } from "./business.js";
import { getTravelOptions, resolveTravel, resetDailyTransport, assignCarForDay } from "./travel.js";
import { advanceLifeCalendar, evaluateLifeEnding, getSchoolDecision } from "./life.js";
import { resolveJobApplication } from "./jobs.js";

const clone = (value) => (
  typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value))
);
const clamp = (value) => Math.max(0, Math.min(100, Number(value) || 0));

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

function applyDomainEffects(state, effects = {}) {
  let next = clone(state);
  const career = effects.career || {};
  const business = effects.business || {};
  for (const key of ["performance", "boss", "coworkers", "readiness"]) {
    if (career[key]) next.career[key] = clamp(next.career[key] + Number(career[key]));
  }
  if (business.trust) next.business.trust = clamp(next.business.trust + Number(business.trust));
  const applied = applyEffects(next, effects, { source: "event" });
  return { state: applied.state, transactions: applied.transactions };
}

function scheduleChoiceDelay(state, eventId, choice) {
  if (!choice?.delayed) return state;
  return scheduleDelayedEvent(state, {
    dueDay: state.calendar.day + Number(choice.delayed.days || 1),
    eventId,
    outcomeId: choice.delayed.outcomeId,
    severity: choice.delayed.severity || 1,
    payload: choice.delayed,
  });
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

function drawHeadline(state, random, { transportOnly = false, excludeTransport = false } = {}) {
  const eligible = EVENTS.filter((event) => {
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
  const deck = state.eventDecks.headline || createDeckState(ids, random);
  const drawn = drawEvent({
    deckState: deck,
    eligibleIds: ids,
    recentIds: state.eventHistory.headlineIds || [],
    random,
  });
  const event = eligible.find((item) => item.id === drawn.eventId) || eligible[0];
  let next = clone(state);
  next.eventDecks.headline = drawn.deckState;
  next.eventHistory.headlineIds = [...next.eventHistory.headlineIds, event.id].slice(-40);
  return setHeadline(next, event, random);
}

function assignWorkDecision(state, random) {
  const next = clone(state);
  if (!isWorkingDay(next) || !hasPath(next)) return next;
  if (random() >= 0.42) return next;
  const choices = next.career.active
    ? getCareerDecisionIds(next)
    : WORK_DECISIONS.filter((item) => item.path === "business").map((item) => item.id);
  if (!choices.length) return next;
  next.dailyState.workDecisionId = choices[Math.floor(random() * choices.length)];
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
  let next = assignWorkDecision(state, random);
  if (!next.dailyState.needsTravel) return drawHeadline(next, random, { excludeTransport: true });
  const transportChance = random();
  if (transportChance < 0.3) return drawHeadline(next, random, { transportOnly: true });
  const options = getTravelOptions(next, {});
  if (options.some((item) => item.id === "taxi")) {
    next = resolveTravel(next, "taxi", {}).state;
    next.dailyState.travelResolved = true;
    return drawHeadline(next, random, { excludeTransport: true });
  }
  return enterTravel(next, {}, "headline");
}

function finishDay(state) {
  const next = clone(state);
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
  if (next.dailyState.workDecisionId) {
    next.dailyState.phase = "work";
    return next;
  }
  return resolveWork(next, "");
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

function applyEventChoice(state, event, choice) {
  const applied = applyDomainEffects(state, choice.effects || {});
  let next = applied.state;
  next = scheduleChoiceDelay(next, event.id, choice);
  next.dailyState.result = choice.result || "";
  return next;
}

export function startDay(state, { random = Math.random } = {}) {
  if (state.dailyState.phase !== "morning") return state;
  if (state.life?.stage === "school-finale") return state;
  let next = resetDailyTransport(state, state.calendar.day);
  next = applyEffects(next, { stats: { energy: 12 } }, { source: "morning-recovery" }).state;
  const due = resolveDueEvents(next, next.calendar.day);
  next = due.state;
  next.dailyState.updates = due.updates.map((item) => item.payload?.result || item.outcomeId);
  if (due.primary) {
    next.dailyState.result = due.primary.payload?.result || due.primary.outcomeId;
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
  let next = resolveTravel(state, optionId, state.dailyState.travelContext || {}).state;
  next.dailyState.stayedHome = optionId === "stay-home";
  next.dailyState.travelResolved = true;
  if (next.dailyState.afterTravel === "work") return beginWork(next);
  return drawHeadline(next, Math.random, { excludeTransport: true });
}

export function chooseEvent(state, eventId, choiceId) {
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
    return finalizeHeadline(applyEventChoice(state, event, choice), event, choice);
  }
  if (state.dailyState.phase === "follow-up") {
    const choice = state.dailyState.followUp?.choices?.find((item) => item.id === choiceId);
    if (!choice) return state;
    return finalizeHeadline(applyEventChoice(state, event, choice), event, choice);
  }
  return state;
}

export function resolveWork(state, choiceId, { random = Math.random } = {}) {
  if (state.dailyState.phase === "complete") return state;
  let next = clone(state);
  if (next.dailyState.phase === "work" && next.dailyState.workDecisionId && choiceId) {
    const result = next.career.active
      ? resolveCareerChoice(next, next.dailyState.workDecisionId, choiceId, { random })
      : resolveOwnerChoice(next, next.dailyState.workDecisionId, choiceId);
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
    .find((item) => item.eventId === "job-application" || item.payload?.highImpact || Number(item.severity) >= 3);
  if (highImpactDue) {
    const interruptedState = startDay(next, { random });
    return {
      state: interruptedState,
      transactions: [],
      interrupted: true,
      reason: highImpactDue.eventId === "job-application" ? "job-result" : "important-event",
    };
  }

  next = applyEffects(next, { stats: { energy: 8 } }, { source: "routine-recovery" }).state;
  const due = resolveDueEvents(next, next.calendar.day);
  next = due.state;
  next.dailyState.updates = due.updates.map((item) => item.payload?.result || item.outcomeId);
  if (due.primary) next.dailyState.result = due.primary.payload?.result || due.primary.outcomeId;

  const transactions = [];
  if (driverMode && next.transport.owned.includes("car")) {
    const driver = assignCarForDay(next, "driver", random);
    if (driver.ok) {
      next = driver.state;
      transactions.push(...driver.transactions);
      if (driver.followUp) next = scheduleDelayedEvent(next, driver.followUp);
    }
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

  next = applyEffects(next, { stats: { energy: -3, happiness: -1 } }, { source: "routine-day" }).state;
  next = finishDay(next);
  const reason = status.promotion ? "promotion"
    : status.dismissed ? "dismissed"
      : status.reason === "closed" ? "business-closed"
        : next.stats.health <= 15 ? "critical-health"
          : next.finances.cash < 0 ? "low-cash"
            : "";
  if (reason) next.dailyState.result = reason === "promotion"
    ? `Promotion: you are now ${next.career.role}.`
    : reason === "dismissed" ? "Your employment has ended."
      : reason === "business-closed" ? "Your business has closed."
        : reason === "critical-health" ? "Your health needs your attention."
          : "Your cash has dropped below zero.";
  return { state: next, transactions, interrupted: Boolean(reason), reason };
}

export function getCurrentDecision(state) {
  const schoolDecision = getSchoolDecision(state);
  if (schoolDecision) return schoolDecision;
  if (state.dailyState.phase === "path") {
    return {
      icon: "📱", kicker: "ADULT LIFE", title: "Your first opportunity is waiting",
      text: "Open Jobs on your phone. Pick one path now; you can build it from the ground up.",
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
      text: "The outcome depends on more than one choice.",
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
      icon: "✓", kicker: "DAY COMPLETE", title: "That choice is now part of your story",
      text: state.dailyState.result, choices: [],
    };
  }
  return null;
}
