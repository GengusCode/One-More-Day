import { EVENTS, isEventEligible } from "../data/events.js";

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
  const recent = new Set(recentIds.slice(-3));
  let state = deckState && Array.isArray(deckState.order)
    ? { order: deckState.order.slice(), seen: Array.isArray(deckState.seen) ? deckState.seen.slice() : [] }
    : createDeckState(eligible, random);
  const usable = (ids) => {
    const available = ids.filter((id) => eligible.includes(id));
    const protectedIds = available.filter((id) => !recent.has(id));
    return protectedIds.length ? protectedIds : available;
  };
  let candidates = usable(state.order);
  const threshold = Math.ceil(eligible.length * 0.75);
  if (!candidates.length || (state.seen.length >= threshold && state.order.length === 0)) {
    state = createDeckState(eligible, random);
    candidates = usable(state.order);
  }
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

export function resolveDueEvents(state, day) {
  const next = clone(state);
  const resolved = new Set(next.eventHistory.resolvedOutcomeIds || []);
  const due = next.delayedEvents
    .filter((item) => Number(item.dueDay) <= day && !resolved.has(item.outcomeId))
    .sort((a, b) => (Number(b.severity) || 0) - (Number(a.severity) || 0));
  next.delayedEvents = next.delayedEvents.filter((item) => !due.includes(item));
  due.forEach((item) => resolved.add(item.outcomeId));
  next.eventHistory.resolvedOutcomeIds = [...resolved].slice(-100);
  return {
    state: next,
    primary: due[0] || null,
    updates: due.slice(1),
  };
}
