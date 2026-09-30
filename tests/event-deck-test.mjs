import assert from "node:assert/strict";
import {
  createDeckState,
  drawEvent,
  getChoiceStage,
  scheduleDelayedEvent,
  resolveDueEvents,
} from "../js/systems/event-deck.js";
import { EVENTS } from "../js/data/events.js";
import { createNewLife } from "../js/core/state.js";

const tests = [];
const test = (name, run) => tests.push({ name, run });

test("draws without replacement until the 75 percent reshuffle threshold", () => {
  const ids = ["a", "b", "c", "d"];
  let deck = createDeckState(ids, () => 0);
  const drawn = [];
  for (let index = 0; index < 3; index += 1) {
    const result = drawEvent({ deckState: deck, eligibleIds: ids, recentIds: [], random: () => 0 });
    drawn.push(result.eventId);
    deck = result.deckState;
  }
  assert.equal(new Set(drawn).size, 3);
  const fourth = drawEvent({ deckState: deck, eligibleIds: ids, recentIds: [], random: () => 0 });
  assert.ok(ids.includes(fourth.eventId));
});

test("protects the last three headlines when another eligible card exists", () => {
  const result = drawEvent({
    deckState: { order: ["a", "b", "c", "d"], seen: [] },
    eligibleIds: ["a", "b", "c", "d"],
    recentIds: ["a", "b", "c"],
    random: () => 0.4,
  });
  assert.equal(result.eventId, "d");
});

test("recovers when eligibility removes every remaining card", () => {
  const result = drawEvent({
    deckState: { order: ["career-only"], seen: ["weekend-one", "weekend-two"] },
    eligibleIds: ["fresh-option", "weekend-two"],
    recentIds: ["weekend-two"],
    random: () => 0,
  });
  assert.equal(result.eventId, "fresh-option");
});

test("returns only the follow-up owned by the selected choice", () => {
  const event = EVENTS.find((item) => item.id === "taxi-full");
  assert.ok(event);
  assert.equal(getChoiceStage(event, "stand-passage").title, "The conductor waves you in");
  assert.equal(getChoiceStage(event, "wait"), null);
  assert.equal(getChoiceStage(event, "missing"), null);
});

test("resolves two due consequences once, keeping one primary and one update", () => {
  let state = createNewLife({ name: "Naledi", gender: "woman" });
  state = scheduleDelayedEvent(state, {
    dueDay: 3,
    eventId: "supplier-promise",
    outcomeId: "supplier-late",
    severity: 2,
    payload: { result: "The promised stock did not arrive." },
  });
  state = scheduleDelayedEvent(state, {
    dueDay: 3,
    eventId: "boss-favour",
    outcomeId: "boss-remembers",
    severity: 5,
    payload: { result: "Your boss remembers who helped." },
  });
  const first = resolveDueEvents(state, 3);
  assert.equal(first.primary.outcomeId, "boss-remembers");
  assert.deepEqual(Array.from(first.updates, (item) => item.outcomeId), ["supplier-late"]);
  assert.equal(first.state.delayedEvents.length, 0);
  const second = resolveDueEvents(first.state, 3);
  assert.equal(second.primary, null);
  assert.deepEqual(Array.from(second.updates), []);
});

let passed = 0;
for (const entry of tests) {
  await entry.run();
  passed += 1;
}
console.log("event deck: " + passed + " tests passed");
