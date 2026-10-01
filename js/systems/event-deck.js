import { applyEffects } from "../core/state.js";
import { EVENTS, WORK_DECISIONS, isEventEligible } from "../data/events.js";

const clone = (value) => (
  typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value))
);

function shuffle(items, random = Math.random) {
  const result = items.slice();
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

export function createDeckState(ids, random = Math.random) {
  return { order: shuffle([...new Set(ids)], random), seen: [] };
}

export function drawEvent({
  deckState,
  eligibleIds,
  recentIds = [],
  random = Math.random,
}) {
  const eligible = [...new Set(eligibleIds)];
  if (!eligible.length) return { eventId: null, deckState: { order: [], seen: [] } };
  const recent = new Set(recentIds.filter((id) => eligible.includes(id))
    .slice(-Math.min(10, Math.max(1, eligible.length - 1))));
  let state = deckState && Array.isArray(deckState.order)
    ? { order: deckState.order.slice(), seen: Array.isArray(deckState.seen) ? deckState.seen.slice() : [] }
    : createDeckState(eligible, random);
  const known = new Set([...state.order, ...state.seen]);
  state.order.push(...shuffle(eligible.filter((id) => !known.has(id)), random));
  const usable = (ids) => ids.filter((id) => eligible.includes(id) && !recent.has(id));
  let candidates = usable(state.order);
  if (!candidates.length) {
    state = createDeckState(eligible, random);
    candidates = usable(state.order);
  }
  // If the pool is too small, choose the least recently seen card, never deadlock.
  if (!candidates.length) candidates = state.order.slice().sort((a, b) => recentIds.lastIndexOf(a) - recentIds.lastIndexOf(b));
  if (!candidates.length) return { eventId: null, deckState: state };
  const eventId = candidates[0];
  state.order = state.order.filter((id) => id !== eventId);
  state.seen = [...state.seen.filter((id) => eligible.includes(id)), eventId];
  return { eventId, deckState: state };
}

export function getEligibleEventIds(state, deckName) {
  return EVENTS
    .filter((event) => event.deck === deckName && isEventEligible(event, state))
    .map((event) => event.id);
}

export function getChoiceStage(event, choiceId) {
  const selected = event?.choices?.find((choice) => choice.id === choiceId);
  return selected?.followUp ? clone(selected.followUp) : null;
}

export function scheduleDelayedEvent(state, item) {
  const next = clone(state);
  const duplicate = next.delayedEvents.some((entry) => (
    entry.dueDay === item.dueDay && entry.eventId === item.eventId && entry.outcomeId === item.outcomeId
  ));
  if (!duplicate) next.delayedEvents.push(clone(item));
  return next;
}

export function scheduleChoiceConsequence(state, eventId, choice, random = Math.random) {
  const delay = choice?.delayed;
  if (!delay) return state;
  const [min, max] = delay.daysRange || [Number(delay.days || 1), Number(delay.days || 1)];
  const days = min === max ? min : min + Math.floor(random() * (max - min + 1));
  const outcome = delay.outcomes?.length ? delay.outcomes[Math.min(delay.outcomes.length - 1, Math.floor(random() * delay.outcomes.length))] : {};
  return scheduleDelayedEvent(state, {
    dueDay: state.calendar.day + days,
    eventId,
    outcomeId: delay.outcomeId + "-" + choice.id + "-" + state.calendar.day,
    severity: delay.severity || 1,
    payload: { ...clone(delay), ...clone(outcome), cause: choice.label },
  });
}

export function describeConsequence(item) {
  if(!item)return "";
  const candidates=[...EVENTS,...WORK_DECISIONS].find(event=>event.id===item.eventId)?.choices || [];
  const choices=candidates.flatMap(choice=>[choice,...(choice.followUp?.choices||[])]);
  const cause=item.payload?.cause || choices.find(choice=>choice.delayed && item.outcomeId.startsWith(choice.delayed.outcomeId))?.label;
  const result=item.payload?.result || item.outcomeId;
  return cause ? `Because you chose “${cause}” earlier: ${result}` : result;
}

export function resolveDueEvents(state, day) {
  let next = clone(state);
  const resolved = new Set(next.eventHistory.resolvedOutcomeIds || []);
  const due = next.delayedEvents
    .filter((item) => Number(item.dueDay) <= day && !resolved.has(item.outcomeId))
    .sort((a, b) => (Number(b.severity) || 0) - (Number(a.severity) || 0));
  next.delayedEvents = next.delayedEvents.filter((item) => !due.includes(item));
  due.forEach((item) => {
    if (resolved.has(item.outcomeId)) return;
    const effects = item.payload?.effects || {};
    if (effects.business?.trust) next.business.trust = Math.max(0, Math.min(100, next.business.trust + effects.business.trust));
    for (const key of ["performance", "boss", "coworkers", "readiness"]) {
      if (effects.career?.[key]) next.career[key] = Math.max(0, Math.min(100, next.career[key] + effects.career[key]));
    }
    next = applyEffects(next, effects, { source: item.eventId + "-consequence",label:item.payload?.cause ? 'Earlier choice: '+item.payload.cause : 'Earlier decision consequence' }).state;
    resolved.add(item.outcomeId);
  });
  next.eventHistory.resolvedOutcomeIds = [...resolved].slice(-100);
  return {
    state: next,
    primary: due[0] || null,
    updates: due.slice(1),
  };
}
