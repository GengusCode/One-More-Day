import assert from "node:assert/strict";
import { test } from "node:test";
import { createNewLife, validateState, saveGame, loadGame } from "../js/core/state.js";
import { drawEvent } from "../js/systems/event-deck.js";
import { EVENTS, WORK_DECISIONS, isEventEligible } from "../js/data/events.js";
import { choosePath, resolveWork, startDay } from "../js/systems/day.js";
import { startBusiness, resolveOwnerChoice } from "../js/systems/business.js";

const adult = () => {
  const state = createNewLife({ name: "Naledi", gender: "woman" });
  state.life.stage = "adult";
  state.life.school.step = "complete";
  return state;
};

test("saving and reloading preserves the remaining shuffled deck and chronological history", () => {
  const state = adult();
  state.eventDecks.headline = { order: ["derby-conversation", "sneaker-drop"], seen: ["stokvel-pressure"] };
  state.eventHistory.headlineIds = ["stokvel-pressure", "braai-invite", "stokvel-pressure"];
  const memory = new Map();
  const storage = { setItem: (key, value) => memory.set(key, value), getItem: (key) => memory.get(key) ?? null };
  saveGame(state, storage);
  const loaded = loadGame(storage).state;
  assert.deepEqual(loaded.eventDecks.headline, state.eventDecks.headline);
  assert.deepEqual(loaded.eventHistory.headlineIds, state.eventHistory.headlineIds);
});

test("a recent pending card cannot override a fresh eligible alternative", () => {
  const result = drawEvent({
    deckState: { order: ["a"], seen: ["b", "c", "d", "e"] },
    eligibleIds: ["a", "b", "c", "d", "e"],
    recentIds: ["a", "b", "c", "d"], random: () => 0,
  });
  assert.equal(result.eventId, "e");
});

test("small pools still return a card instead of getting stuck on cooldown", () => {
  const result = drawEvent({ eligibleIds: ["only"], recentIds: ["only"], random: () => 0 });
  assert.equal(result.eventId, "only");
});

test("a newly eligible card enters an existing deck before it is exhausted", () => {
  const result = drawEvent({ deckState: { order: ["a"], seen: ["b"] }, eligibleIds: ["a", "b", "new"], recentIds: ["a", "b"], random: () => 0 });
  assert.equal(result.eventId, "new");
});

test("age and staffing eligibility match the player's current life", () => {
  const state = adult();
  assert.equal(isEventEligible({ eligibility: { minAge: 60 } }, state), false);
  state.calendar.age = 65;
  assert.equal(isEventEligible({ eligibility: { maxAge: 29 } }, state), false);
  assert.equal(isEventEligible({ eligibility: { minAge: 60 } }, state), true);
  const helper = WORK_DECISIONS.find((item) => item.id === "owner-helper");
  const owner = startBusiness(state, "car-wash");
  assert.equal(isEventEligible(helper, owner), false);
  owner.business.staff.push({ id: "one", wage: 80 });
  assert.equal(isEventEligible(helper, owner), true);
});

test("business work situations rotate across saves instead of repeating with the same random draw", () => {
  let state = adult();
  const seen = [];
  for (let day = 1; day <= 4; day++) {
    state.calendar.day = day;
    state.calendar.weekday = day;
    state.dailyState.phase = "morning";
    state = day === 1 ? choosePath(state, "car-wash", { random: () => 0 }) : startDay(state, { random: () => 0 });
    seen.push(state.dailyState.workDecisionId);
    state = validateState(state);
  }
  assert.equal(new Set(seen).size, 4);
  assert.ok(!seen.includes("owner-helper"), "a solo owner cannot have a helper problem");
});

test("buying bulk stock spends money rather than magically paying the buyer", () => {
  const state = startBusiness(adult(), "buy-resell");
  state.finances.cash = 500;
  const result = resolveOwnerChoice(state, "owner-stock", "bulk");
  assert.equal(result.state.finances.cash, 340);
  assert.equal(result.transactions[0].amount, -160);
});

test("completed work explains the salary source and cannot pay twice", () => {
  let state = choosePath(adult(), "office", { random: () => 0 });
  state.dailyState.phase = "work";
  state.dailyState.workDecisionId = "career-quality";
  const finished = resolveWork(state, "check", { random: () => 0 });
  assert.match(finished.dailyState.result, /shift.*R180|R180.*shift/i);
  assert.equal(finished.finances.transactions.filter((item) => item.source === "salary").length, 1);
  assert.equal(resolveWork(finished, "check").finances.cash, finished.finances.cash);
});

test("paid trials are weekend work, rather than a reward for an unrelated weekday choice", () => {
  const event = EVENTS.find((item) => item.id === "street-opportunity");
  const state = adult();
  state.calendar.weekday = 2;
  assert.equal(isEventEligible(event, state), false);
  state.calendar.weekday = 6;
  assert.equal(isEventEligible(event, state), true);
});
