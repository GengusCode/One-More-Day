import assert from "node:assert/strict";
import {
  SAVE_KEY_V9,
  SAVE_KEY_V8,
  createDefaultState,
  createNewLife,
  validateName,
  applyEffects,
  migrateLegacyState,
  validateState,
  loadGame,
  saveGame,
  CORRUPT_BACKUP_KEY,
} from "../js/core/state.js";
import { ECONOMY, formatRand } from "../js/data/economy.js";

const tests = [];
const test = (name, run) => tests.push({ name, run });

test("creates independent schema v9 state domains", () => {
  const first = createDefaultState();
  const second = createDefaultState();
  const domains = [
    "profile", "calendar", "stats", "finances", "career", "business",
    "relationships", "transport", "assets", "eventHistory", "eventDecks",
    "delayedEvents", "dailyState", "settings", "life",
  ];
  assert.equal(first.schemaVersion, 9);
  domains.forEach((domain) => assert.ok(domain in first, domain));
  first.assets.ownedUpgradeIds.push("washer");
  assert.deepEqual(second.assets.ownedUpgradeIds, []);
  assert.equal(SAVE_KEY_V9, "one-more-day-v09");
  assert.equal(SAVE_KEY_V8, "one-more-day-v08");
});

test("normalises valid South African names and rejects invalid input", () => {
  assert.deepEqual(validateName("  Nthabiseng-O’Neil  "), {
    ok: true,
    value: "Nthabiseng-O’Neil",
    error: "",
  });
  assert.equal(validateName("A").ok, false);
  assert.equal(validateName("A".repeat(25)).ok, false);
  assert.equal(validateName("<img src=x>").ok, false);
  assert.equal(validateName("Neo_2").ok, false);
});

test("gender changes pronouns but not starting statistics", () => {
  const man = createNewLife({ name: "Kabelo", gender: "man" });
  const woman = createNewLife({ name: "Ayesha", gender: "woman" });
  const nonBinary = createNewLife({ name: "Lethabo", gender: "non-binary" });
  const comparable = stats => Object.fromEntries(Object.entries(stats).filter(([key]) => key !== 'luck'));
  assert.deepEqual(comparable(man.stats), comparable(woman.stats));
  assert.deepEqual(comparable(woman.stats), comparable(nonBinary.stats));
  for (const life of [man,woman,nonBinary]) assert.ok(life.stats.luck >= 25 && life.stats.luck <= 75);
  assert.equal(man.profile.pronouns.subject, "he");
  assert.equal(woman.profile.pronouns.subject, "she");
  assert.equal(nonBinary.profile.pronouns.subject, "they");
});

test("applies bounded effects and records one cash transaction", () => {
  const original = createNewLife({ name: "Fatima", gender: "woman" });
  const { state, transactions } = applyEffects(
    original,
    { cash: 175, stats: { energy: -200, reputation: 90 } },
    { source: "test-income" },
  );
  assert.equal(original.finances.cash, 350);
  assert.equal(state.finances.cash, 525);
  assert.equal(state.stats.energy, 0);
  assert.equal(state.stats.reputation, 100);
  assert.equal(transactions.length, 1);
  assert.deepEqual(
    {
      id: transactions[0].id,
      amount: transactions[0].amount,
      balance: transactions[0].balance,
      source: transactions[0].source,
    },
    { id: "tx-1", amount: 175, balance: 525, source: "test-income" },
  );
  assert.equal(state.finances.netWorth, 525);
});

test("exposes exact starting economy values and rand formatting", () => {
  assert.equal(ECONOMY.travel.taxi.cost, 30);
  assert.equal(ECONOMY.travel.taxi.energy, -3);
  assert.equal(ECONOMY.travel.taxiPassage.energy, -12);
  assert.equal(ECONOMY.travel.ehailing.cost, 110);
  assert.equal(ECONOMY.assets.bicycle.purchaseCost, 900);
  assert.equal(ECONOMY.assets.car.purchaseCost, 18_000);
  assert.equal(ECONOMY.assets.car.netWorthRate, 0.85);
  assert.equal(ECONOMY.stayHome.energy, 18);
  assert.equal(formatRand(1234567), "R1\u00a0234\u00a0567");
  assert.equal(formatRand(-90), "−R90");
});

class MemoryStorage {
  constructor(entries = {}) {
    this.values = new Map(Object.entries(entries));
  }
  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }
  setItem(key, value) {
    this.values.set(key, String(value));
  }
  removeItem(key) {
    this.values.delete(key);
  }
}

test("migrates a partial legacy life without losing recognised progress", () => {
  const migrated = migrateLegacyState({
    name: "Lerato",
    day: 9,
    age: 19,
    cash: 4_250,
    health: 67,
    energy: 44,
    knowledge: 73,
    social: 62,
    happiness: 58,
    reputation: 71,
    relationships: { gogo: 81, sizwe: 36 },
    job: "office",
    level: 2,
    xp: 77,
    performance: 66,
    bossFavor: 45,
    warnings: 1,
    equipment: true,
    workers: 2,
    expansions: 1,
  });
  assert.equal(migrated.schemaVersion, 9);
  assert.equal(migrated.profile.name, "Lerato");
  assert.equal(migrated.calendar.day, 9);
  assert.equal(migrated.finances.cash, 4_250);
  assert.equal(migrated.stats.knowledge, 73);
  assert.equal(migrated.career.pathId, "office");
  assert.equal(migrated.career.roleIndex, 2);
  assert.equal(migrated.career.warnings.length, 1);
  assert.equal(migrated.relationships.people.gogo.score, 81);
  assert.ok(migrated.assets.ownedUpgradeIds.length >= 1);
});

test("normalises partial v8 data into v9 and removes duplicate owned IDs", () => {
  const normalised = validateState({
    schemaVersion: 8,
    profile: { name: "Neo", gender: "man" },
    stats: { energy: 999 },
    finances: { cash: 900 },
    assets: { ownedUpgradeIds: ["bike", "bike", "washer"] },
    unknown: "ignored",
  });
  assert.equal(normalised.stats.energy, 100);
  assert.deepEqual(normalised.assets.ownedUpgradeIds, ["bike", "washer"]);
  assert.equal("unknown" in normalised, false);
  assert.equal(normalised.profile.pronouns.subject, "he");
  assert.ok(Array.isArray(normalised.delayedEvents));
});

test("loads v9 first, migrates legacy second, and preserves the legacy key", () => {
  const legacy = JSON.stringify({ name: "Anele", cash: 810, day: 4, job: "wash" });
  const storage = new MemoryStorage({ "one-more-day-v06": legacy });
  const result = loadGame(storage);
  assert.equal(result.status, "migrated");
  assert.equal(result.state.profile.name, "Anele");
  assert.equal(result.state.finances.cash, 810);
  assert.equal(storage.getItem("one-more-day-v06"), legacy);
  assert.equal(JSON.parse(storage.getItem(SAVE_KEY_V9)).schemaVersion, 9);

  const loadedAgain = loadGame(storage);
  assert.equal(loadedAgain.status, "loaded");
  assert.equal(loadedAgain.state.profile.name, "Anele");
});

test("backs up corrupt data and returns a friendly recovery state", () => {
  const storage = new MemoryStorage({ [SAVE_KEY_V9]: "{broken json" });
  const result = loadGame(storage);
  assert.equal(result.status, "corrupt");
  assert.equal(result.state.schemaVersion, 9);
  assert.match(result.recoveryMessage, /saved life/i);
  assert.equal(storage.getItem(CORRUPT_BACKUP_KEY), "{broken json");
});

test("saving and reloading a settled transaction is idempotent", () => {
  const storage = new MemoryStorage();
  const start = createNewLife({ name: "Imraan", gender: "man" });
  const paid = applyEffects(start, { cash: 220 }, { source: "driver-income" }).state;
  paid.dailyState.settledIds.push("driver-day-1");
  saveGame(paid, storage);
  const first = loadGame(storage).state;
  const second = loadGame(storage).state;
  assert.equal(first.finances.cash, 570);
  assert.equal(second.finances.cash, 570);
  assert.deepEqual(second.dailyState.settledIds, ["driver-day-1"]);
  assert.equal(second.finances.transactions.length, 1);
});

test("preserves an unfinished transport decision across save and reload", () => {
  const storage = new MemoryStorage();
  const state = createNewLife({ name: "Ayanda", gender: "woman" });
  state.dailyState = {
    ...state.dailyState,
    phase: "travel",
    needsTravel: true,
    travelContext: { id: "taxi-flat", disruption: true },
    afterTravel: "work",
    travelResolved: false,
  };
  saveGame(state, storage);

  const restored = loadGame(storage).state;
  assert.equal(restored.dailyState.phase, "travel");
  assert.equal(restored.dailyState.afterTravel, "work");
  assert.equal(restored.dailyState.travelResolved, false);
  assert.equal(restored.dailyState.travelContext.id, "taxi-flat");
  assert.equal(restored.dailyState.travelContext.disruption, true);
});

let passed = 0;
for (const entry of tests) {
  await entry.run();
  passed += 1;
}
console.log("state foundation: " + passed + " tests passed");
