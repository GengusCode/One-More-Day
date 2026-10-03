import assert from "node:assert/strict";
import { createNewLife } from "../js/core/state.js";
import {
  startCareer,
  resolveCareerChoice,
  settleCareerDay,
} from "../js/systems/career.js";
import {
  startBusiness,
  buyUpgrade,
  hireEmployee,
  settleBusinessDay,
  getBusinessTitle,
} from "../js/systems/business.js";
import {
  getTravelOptions,
  buyTransportAsset,
  assignCarForDay,
  resolveTravel,
  resetDailyTransport,
} from "../js/systems/travel.js";
import {
  applyRelationshipEffects,
  getRelationshipLabel,
} from "../js/systems/relationships.js";
import { EVENTS, WORK_DECISIONS } from "../js/data/events.js";
import {
  startDay,
  choosePath,
  chooseEvent,
  resolveWork,
  advanceDay,
  canAdvanceDay,
  resolveMinigame,
  getCurrentDecision,
} from "../js/systems/day.js";

const tests = [];
const test = (name, run) => tests.push({ name, run });
const newLife = () => {
  const state = createNewLife({ name: "Anele", gender: "non-binary" });
  state.life.stage = "adult";
  state.life.school.step = "complete";
  return state;
};

test("corporate work settles automatically and pays only once per day", () => {
  let state = startCareer(newLife(), "office");
  const first = settleCareerDay(state, { day: 1, attendance: "present" });
  const second = settleCareerDay(first.state, { day: 1, attendance: "present" });
  assert.equal(first.state.finances.cash, 530);
  assert.equal(second.state.finances.cash, 530);
  assert.equal(first.state.career.role, "Office Junior");
  assert.equal(first.state.dailyState.settledIds.includes("career-day-1"), true);
});

test("career choices can help one work relationship while hurting another", () => {
  const state = startCareer(newLife(), "office");
  const result = resolveCareerChoice(state, "career-boss", "flatter");
  assert.equal(result.state.career.boss, 56);
  assert.equal(result.state.career.coworkers, 47);
  const event = WORK_DECISIONS.find((item) => item.id === "career-boss");
  assert.equal("warning" in event.choices[0], false);
  assert.equal("promotion" in event.choices[0], false);
});

test("career promotion requires readiness and three warnings dismiss", () => {
  let promotable = startCareer(newLife(), "office");
  promotable.career.performance = 82;
  promotable.career.readiness = 80;
  promotable.stats.knowledge = 60;
  promotable.stats.reputation = 58;
  const promoted = settleCareerDay(promotable, { day: 1, attendance: "present" });
  assert.equal(promoted.state.career.role, "Administrator");
  assert.equal(promoted.status.promotion, true);

  let warned = startCareer(newLife(), "office");
  warned.career.warnings = [
    { id: "w1", day: 1, reason: "one" },
    { id: "w2", day: 2, reason: "two" },
    { id: "w3", day: 3, reason: "three" },
  ];
  const dismissed = settleCareerDay(warned, { day: 4, attendance: "present" });
  assert.equal(dismissed.state.career.dismissed, true);
  assert.equal(dismissed.state.career.active, false);
});

test("sustained acceptable career performance expires an old warning", () => {
  let state = startCareer(newLife(), "office");
  state.calendar.day = 10;
  state.career.performance = 70;
  state.career.attendanceStreak = 6;
  state.career.warnings = [{ id: "old", day: 1, reason: "old warning" }];
  const result = settleCareerDay(state, { day: 10, attendance: "present" });
  assert.equal(result.state.career.warnings.length, 0);
});

test("all startups begin owner-operated at trust 55", () => {
  for (const id of ["car-wash", "moving-service", "buy-resell"]) {
    const state = startBusiness(newLife(), id);
    assert.equal(state.business.title, "Solo Owner");
    assert.equal(state.business.trust, 55);
    assert.equal(state.business.active, true);
    assert.equal("manager" in state.business, false);
  }
});

test("business equipment is a one-time purchase that raises capacity", () => {
  let state = startBusiness(newLife(), "car-wash");
  state.finances.cash = 2_000;
  const first = buyUpgrade(state, "car-wash-pressure-washer");
  const second = buyUpgrade(first.state, "car-wash-pressure-washer");
  assert.equal(first.ok, true);
  assert.equal(first.state.business.capacity, 2);
  assert.equal(first.state.finances.cash, 800);
  assert.equal(second.ok, false);
  assert.equal(second.state.finances.cash, 800);
});

test("staff add capacity and wages without adding a manager", () => {
  let state = startBusiness(newLife(), "moving-service");
  state.finances.cash = 1_000;
  const hired = hireEmployee(state, "helper");
  assert.equal(hired.ok, true);
  assert.equal(hired.state.business.staff.length, 1);
  assert.equal(hired.state.business.capacity, 2);
  assert.equal("manager" in hired.state.business, false);
  const settled = settleBusinessDay(hired.state, { day: 1, operating: true, random: () => 0.5 });
  assert.ok(settled.state.finances.cash < 1_000 + hired.state.business.baselineRevenue * 2);
});

test("zero trust closes after two operating days and retains assets", () => {
  let state = startBusiness(newLife(), "buy-resell");
  state.business.trust = 0;
  state.assets.items.stockShelf = { id: "stockShelf", name: "Stock shelf", value: 300 };
  const dayOne = settleBusinessDay(state, { day: 1, operating: true, random: () => 0 });
  assert.equal(dayOne.state.business.closed, false);
  const dayTwo = settleBusinessDay(dayOne.state, { day: 2, operating: true, random: () => 0 });
  assert.equal(dayTwo.state.business.closed, true);
  assert.equal(dayTwo.state.business.active, false);
  assert.equal(dayTwo.state.assets.items.stockShelf.value, 300);
  assert.equal(dayTwo.status.reason, "closed");
  assert.notEqual(dayTwo.status.reason, "fired");
});

test("business title derives from owned growth rather than a promotion button", () => {
  const state = startBusiness(newLife(), "car-wash");
  state.business.value = 45_000;
  state.business.capacity = 5;
  state.business.staff = [{ id: "one" }, { id: "two" }, { id: "three" }];
  state.business.premises = [{ id: "site" }];
  assert.equal(getBusinessTitle(state.business), "Site Owner");
});

test("transport purchase and normal travel use exact economy values", () => {
  let state = newLife();
  state.finances.cash = 25_000;
  const bike = buyTransportAsset(state, "bicycle");
  assert.equal(bike.state.finances.cash, 24_100);
  const bikeAgain = buyTransportAsset(bike.state, "bicycle");
  assert.equal(bikeAgain.ok, false);
  const car = buyTransportAsset(bike.state, "car");
  assert.equal(car.state.finances.cash, 6_100);
  assert.equal(car.state.assets.items.car.value, 15_300);
  const taxi = resolveTravel(car.state, "taxi", {});
  assert.equal(taxi.state.finances.cash, 6_070);
  assert.equal(taxi.state.stats.energy, 69);
  const passage = resolveTravel(car.state, "taxi-passage", {});
  assert.equal(passage.state.stats.energy, 60);
  assert.equal(passage.state.stats.happiness, 63);
});

test("travel availability respects strike, rain, ownership and always offers stay home", () => {
  let state = newLife();
  state.finances.cash = 50;
  let options = getTravelOptions(state, { taxiStrike: true, heavyRain: true });
  assert.deepEqual(Array.from(options, (item) => item.id), ["stay-home"]);
  state.finances.cash = 30_000;
  state = buyTransportAsset(state, "bicycle").state;
  state = buyTransportAsset(state, "car").state;
  options = getTravelOptions(state, { taxiStrike: true, heavyRain: true });
  assert.equal(options.some((item) => item.id === "taxi"), false);
  assert.equal(options.some((item) => item.id === "bicycle"), false);
  assert.equal(options.some((item) => item.id === "car"), true);
  assert.equal(options.some((item) => item.id === "ehailing"), true);
  assert.equal(options.at(-1).id, "stay-home");
});

test("car assignment earns once and blocks personal use until next morning", () => {
  let state = newLife();
  state.finances.cash = 20_000;
  state = buyTransportAsset(state, "car").state;
  const assigned = assignCarForDay(state, "driver", () => 0);
  assert.equal(assigned.state.finances.cash, 2_220);
  assert.equal(assigned.state.transport.dailyAssignment.mode, "driver");
  assert.equal(getTravelOptions(assigned.state, {}).some((item) => item.id === "car"), false);
  const duplicate = assignCarForDay(assigned.state, "driver", () => 1);
  assert.equal(duplicate.state.finances.cash, 2_220);
  const next = resetDailyTransport(assigned.state, 2);
  assert.equal(next.transport.dailyAssignment, null);
  assert.equal(getTravelOptions(next, {}).some((item) => item.id === "car"), true);
});

test("stay home has distinct employee, solo-owner and staffed-owner consequences", () => {
  let employee = startCareer(newLife(), "office");
  const absent = resolveTravel(employee, "stay-home", { calledAhead: false });
  assert.equal(absent.state.stats.energy, 90);
  assert.equal(absent.state.stats.health, 81);
  assert.equal(absent.state.career.performance, 48);
  const called = resolveTravel(employee, "stay-home", { calledAhead: true });
  assert.equal(called.state.career.performance, 49);

  let solo = startBusiness(newLife(), "car-wash");
  const soloHome = resolveTravel(solo, "stay-home", {});
  assert.equal(soloHome.state.business.trust, 51);
  assert.equal(soloHome.state.finances.cash, 350);

  let staffed = startBusiness(newLife(), "car-wash");
  staffed.finances.cash = 1_000;
  staffed = hireEmployee(staffed, "helper").state;
  const staffedHome = resolveTravel(staffed, "stay-home", {});
  assert.equal(staffedHome.state.business.trust, 53);
  const receipt = staffedHome.state.finances.transactions.at(-1);
  assert.equal(receipt.source, 'business-income');
  assert.equal(staffedHome.state.finances.cash, 1000 + receipt.amount);
  assert.ok(receipt.breakdown.some(row => row.label === 'Staff wages' && row.amount === -80));
  assert.equal(receipt.breakdown.reduce((sum,row) => sum + row.amount,0),receipt.amount);
});

test("relationship effects clamp and derive useful labels", () => {
  let state = newLife();
  state.relationships.people.friend = { id: "friend", name: "Lerato", type: "Friend", score: 95 };
  state = applyRelationshipEffects(state, { friend: 20, neighbour: -80 });
  assert.equal(state.relationships.people.friend.score, 100);
  assert.equal(state.relationships.people.neighbour.score, 0);
  assert.equal(getRelationshipLabel(100), "Unbreakable");
  assert.equal(getRelationshipLabel(0), "Strained");
});

test("content meets the v0.8 variety floor", () => {
  assert.ok(EVENTS.length >= 18);
  assert.ok(WORK_DECISIONS.length >= 14);
  for (const id of ["taxi-full", "taxi-flat-tyre", "taxi-breakdown", "taxi-strike", "ehailing-surge"]) {
    assert.ok(EVENTS.some((event) => event.id === id), id);
  }
});

test("day flow blocks advance during a follow-up and settles income once", () => {
  let state = startDay(newLife(), { random: () => 0 });
  assert.equal(state.dailyState.phase, "path");
  state = choosePath(state, "office", { random: () => 0.1 });
  assert.ok(["headline", "work"].includes(state.dailyState.phase));
  state.dailyState.activeEventId = "taxi-full";
  state.dailyState.phase = "headline";
  state.dailyState.choiceOrder = ["stand-passage", "wait", "other-ride"];
  state = chooseEvent(state, "taxi-full", "stand-passage");
  assert.equal(state.dailyState.phase, "follow-up");
  assert.equal(canAdvanceDay(state), false);
  state = chooseEvent(state, "taxi-full", "bag-lap");
  if (state.dailyState.phase === "work") state = resolveWork(state, "");
  assert.equal(state.dailyState.phase, "complete");
  assert.equal(canAdvanceDay(state), true);
  const paidOnce = state.finances.cash;
  state = resolveWork(state, "");
  assert.equal(state.finances.cash, paidOnce);
});

test("v0.8 advances days without adding the later aging system", () => {
  let state = newLife();
  state.calendar.day = 365;
  state.calendar.age = 18;
  state.dailyState.phase = "complete";
  state.dailyState.complete = true;
  const next = advanceDay(state, { random: () => 0 });
  assert.equal(next.calendar.day, 366);
  assert.equal(next.calendar.age, 18);
});

test("an unresolved event reloads with the same event and choice order", () => {
  let state = choosePath(startDay(newLife(), { random: () => 0 }), "car-wash", { random: () => 0.42 });
  const before = {
    eventId: state.dailyState.activeEventId,
    order: Array.from(state.dailyState.choiceOrder),
    phase: state.dailyState.phase,
  };
  const copy = JSON.parse(JSON.stringify(state));
  assert.deepEqual({
    eventId: copy.dailyState.activeEventId,
    order: Array.from(copy.dailyState.choiceOrder),
    phase: copy.dailyState.phase,
  }, before);
});

test("fourteen simulated days keep headlines varied and automatic work playable", () => {
  let randomIndex = 0;
  const sequence = [0.13, 0.71, 0.29, 0.88, 0.46, 0.04, 0.62, 0.35, 0.94, 0.52];
  const random = () => sequence[(randomIndex += 1) % sequence.length];
  let state = choosePath(startDay(newLife(), { random }), "office", { random });
  const headlines = [];
  for (let count = 0; count < 14; count += 1) {
    for (let step = 0; step < 8 && state.dailyState.phase !== "complete"; step += 1) {
      const decision = getCurrentDecision(state);
      if (state.dailyState.phase === "travel" || state.dailyState.phase === "headline" || state.dailyState.phase === "follow-up") {
        if (state.dailyState.phase === "headline") headlines.push(state.dailyState.activeEventId);
        const selected = decision.choices.find((item) => !item.disabled);
        state = chooseEvent(state, state.dailyState.activeEventId, selected.id);
      } else if (state.dailyState.phase === "work") {
        state = resolveWork(state, decision?.choices?.[0]?.id || "");
      } else if (state.dailyState.phase === "minigame") {
        state = resolveMinigame(state, { outcome: "caught" });
      } else break;
    }
    assert.equal(state.dailyState.phase, "complete", "day " + state.calendar.day);
    if (count < 13) state = advanceDay(state, { random });
  }
  assert.equal(state.calendar.day, 14);
  for (let index = 3; index < headlines.length; index += 1) {
    assert.equal(headlines.slice(index - 3, index).includes(headlines[index]), false);
  }
});

test("current decisions expose the correct browser action for each phase", () => {
  let state = choosePath(startDay(newLife(), { random: () => 0.6 }), "office", { random: () => 0.6 });
  if (state.dailyState.phase === "headline") {
    assert.equal(getCurrentDecision(state).choices[0].action, "CHOOSE_EVENT");
  }
  state.dailyState.phase = "work";
  state.dailyState.workDecisionId = "career-quality";
  assert.equal(getCurrentDecision(state).choices[0].action, "RESOLVE_WORK");
  state.dailyState.phase = "travel";
  assert.equal(getCurrentDecision(state).choices.at(-1).action, "CHOOSE_TRAVEL");
});

let passed = 0;
for (const entry of tests) {
  await entry.run();
  passed += 1;
}
console.log("travel and business: " + passed + " tests passed");
