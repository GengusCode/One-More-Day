import assert from "node:assert/strict";
import { createNewLife, validateState } from "../js/core/state.js";
import { createStarterPeople, ensureStarterPeople } from "../js/systems/people.js";

const life = createNewLife({ name: "Amahle", gender: "woman" });
const starterPeople = Object.values(life.relationships.people);

assert.equal(starterPeople.length, 4, "a new life should begin with four meaningful people");
assert.deepEqual(
  starterPeople.map((person) => person.type).sort(),
  ["classmate", "friend", "guardian", "mentor"],
);

const stableA = createStarterPeople({ seed: "cape-wind", profile: life.profile });
const stableB = createStarterPeople({ seed: "cape-wind", profile: life.profile });
const different = createStarterPeople({ seed: "jozi-rain", profile: life.profile });
assert.deepEqual(stableA, stableB, "the same seed should produce the same cast");
assert.ok(
  stableA.some((person, index) => (
    person.name !== different[index].name || person.reaction !== different[index].reaction
  )),
  "a different seed should change at least one presentation field",
);

const existingLife = structuredClone(life);
existingLife.relationships.people = {
  oldFriend: { id: "oldFriend", name: "Thabo", type: "friend", score: 88 },
};
assert.deepEqual(
  ensureStarterPeople(existingLife).relationships.people,
  existingLife.relationships.people,
  "existing relationships should never be replaced",
);

const normalised = validateState({
  schemaVersion: 9,
  profile: { name: "Neo", gender: "man" },
  relationships: {
    people: {
      unsafe: { name: "", type: "", score: 900, trait: 42, reaction: null },
    },
  },
});
assert.equal(normalised.relationships.people.unsafe.score, 100);
assert.equal(normalised.relationships.people.unsafe.type, "contact");
assert.equal(normalised.relationships.people.unsafe.trait, "grounded");
assert.equal(normalised.relationships.people.unsafe.reaction, "neutral");

console.log("v09 people: starter cast and safe normalisation passed");
