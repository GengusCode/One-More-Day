import assert from "node:assert/strict";
import {
  SAVE_KEY_V10,
  SAVE_KEY_V9,
  createDefaultState,
  migrateState,
  loadGame,
} from "../js/core/state.js";

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
}

const defaults = createDefaultState();

assert.equal(SAVE_KEY_V10, "one-more-day-v10");
assert.equal(defaults.schemaVersion, 10);
assert.deepEqual(defaults.education, {
  applications: [],
  active: null,
  completed: [],
  incomplete: [],
  accessModifiers: { bridgeBonus: 0, experienceByField: {} },
  checkpointHistory: [],
  settledDayIds: [],
  lastOutcome: null,
});
assert.deepEqual(defaults.finances.liabilities, []);
assert.deepEqual(
  {
    familyId: defaults.career.familyId,
    employerId: defaults.career.employerId,
    experience: defaults.career.experience,
    interviewHistory: defaults.career.interviewHistory,
    openingCooldowns: defaults.career.openingCooldowns,
    pendingPromotion: defaults.career.pendingPromotion,
  },
  {
    familyId: null,
    employerId: null,
    experience: 0,
    interviewHistory: [],
    openingCooldowns: {},
    pendingPromotion: null,
  },
);
assert.equal(defaults.jobs.pendingInterview, null);
assert.equal(defaults.timeline.educationMilestone, null);

const schemaNine = {
  ...createDefaultState(),
  schemaVersion: 9,
  profile: { name: "Naledi", gender: "woman" },
  finances: { cash: 12_400, netWorth: 12_400, transactions: [], lastTransactionId: 0 },
  career: {
    ...createDefaultState().career,
    active: true,
    pathId: "office",
    roleIndex: 3,
    role: "Department Manager",
    salary: 2_600,
  },
  assets: {
    ownedUpgradeIds: ["laptop"],
    items: { bicycle: { id: "bicycle", name: "Bicycle", value: 700 } },
  },
  relationships: {
    people: {
      mentor: { id: "mentor", name: "Kagiso", type: "mentor", score: 82 },
    },
  },
  timeline: {
    lastSummary: { title: "Week 3" },
    settledDayIds: ["day-20", "day-21"],
  },
  dailyState: {
    ...createDefaultState().dailyState,
    day: 22,
    phase: "choice",
    activeEventId: "loadshedding-client",
    complete: false,
  },
};

const migrated = migrateState(schemaNine);
assert.equal(migrated.schemaVersion, 10);
assert.equal(migrated.profile.name, "Naledi");
assert.equal(migrated.finances.cash, 12_400);
assert.equal(migrated.career.familyId, "business");
assert.equal(migrated.career.roleIndex, 3);
assert.equal(migrated.career.role, "Department Manager");
assert.deepEqual(migrated.assets.ownedUpgradeIds, ["laptop"]);
assert.equal(migrated.assets.items.bicycle.value, 700);
assert.equal(migrated.relationships.people.mentor.name, "Kagiso");
assert.deepEqual(migrated.timeline.settledDayIds, ["day-20", "day-21"]);
assert.equal(migrated.dailyState.activeEventId, "loadshedding-client");
assert.equal(migrated.dailyState.complete, false);
assert.deepEqual(migrated.education.completed, []);
assert.deepEqual(migrated.finances.liabilities, []);

const originalNine = JSON.stringify(schemaNine);
const preferredTen = {
  ...migrated,
  profile: { ...migrated.profile, name: "Amahle" },
};
const preferredStorage = new MemoryStorage({
  [SAVE_KEY_V9]: originalNine,
  [SAVE_KEY_V10]: JSON.stringify(preferredTen),
});
const preferredResult = loadGame(preferredStorage);
assert.equal(preferredResult.status, "loaded");
assert.equal(preferredResult.state.profile.name, "Amahle");

const migrationStorage = new MemoryStorage({ [SAVE_KEY_V9]: originalNine });
const migrationResult = loadGame(migrationStorage);
assert.equal(migrationResult.status, "migrated");
assert.equal(migrationResult.state.schemaVersion, 10);
assert.equal(migrationResult.state.profile.name, "Naledi");
assert.equal(migrationStorage.getItem(SAVE_KEY_V9), originalNine);
assert.equal(JSON.parse(migrationStorage.getItem(SAVE_KEY_V10)).schemaVersion, 10);

console.log("v0.10 state migration: 1 test passed");
