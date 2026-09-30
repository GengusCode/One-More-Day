import assert from "node:assert/strict";
import {
  createDefaultState,
  createNewLife,
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
  removeItem(key) {
    this.values.delete(key);
  }
}

const fresh = createNewLife({ name: "Amahle", gender: "woman" });
assert.equal(fresh.schemaVersion, 9);
assert.equal(fresh.calendar.age, 18);
assert.equal(fresh.life.stage, "school-finale");
assert.equal(fresh.life.school.step, "last-morning");
assert.equal(fresh.life.ageDays, 0);
assert.equal(fresh.life.ended, false);

const v8 = createDefaultState();
v8.schemaVersion = 8;
v8.profile.name = "Thabo";
v8.business.active = true;
v8.business.id = "car-wash";
v8.business.title = "Equipped Operator";
v8.finances.cash = 8_400;
v8.assets.ownedUpgradeIds = ["car-wash-pressure-washer"];
const oldValue = JSON.stringify(v8);
const storage = new MemoryStorage({ "one-more-day-v08": oldValue });

const migrated = loadGame(storage);
assert.equal(migrated.status, "migrated");
assert.equal(migrated.state.schemaVersion, 9);
assert.equal(migrated.state.life.stage, "adult");
assert.equal(migrated.state.finances.cash, 8_400);
assert.equal(migrated.state.business.active, true);
assert.deepEqual(migrated.state.assets.ownedUpgradeIds, ["car-wash-pressure-washer"]);
assert.equal(storage.getItem("one-more-day-v08"), oldValue);
assert.equal(JSON.parse(storage.getItem("one-more-day-v09")).schemaVersion, 9);

console.log("v09 life state: fresh school and v08 adult migration passed");
