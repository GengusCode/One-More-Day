import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../js/game-systems.js", import.meta.url), "utf8");
const context = { console };
context.globalThis = context;
vm.runInNewContext(source, context, { filename: "js/game-systems.js" });

const { shuffleChoices, orderChoices, branchForChoice, nextChaseTarget } = context.GameSystems;

{
  const original = [
    { id: "taxi", outcome: "social" },
    { id: "walk", outcome: "health" },
    { id: "lift", outcome: "relationship" },
  ];
  const randomValues = [0.1, 0.8];
  const shuffled = shuffleChoices(original, () => randomValues.shift());

  assert.deepEqual(original.map((choice) => choice.id), ["taxi", "walk", "lift"]);
  assert.deepEqual(Array.from(shuffled, (choice) => choice.id), ["lift", "walk", "taxi"]);
  assert.equal(shuffled.find((choice) => choice.id === "taxi").outcome, "social");
}

{
  const choices = [{ id: "one" }, { id: "two" }, { id: "three" }];
  const restored = orderChoices(choices, ["three", "one", "two"]);
  assert.deepEqual(Array.from(restored.items, (choice) => choice.id), ["three", "one", "two"]);
  assert.deepEqual(Array.from(restored.ids), ["three", "one", "two"]);
}

{
  const choices = [
    { id: "help", followUp: { title: "What kind of help?", choices: ["cover", "coach"] } },
    { id: "leave" },
  ];

  assert.equal(branchForChoice(choices, "help").title, "What kind of help?");
  assert.equal(branchForChoice(choices, "leave"), null);
  assert.equal(branchForChoice(choices, "missing"), null);
}

{
  const target = nextChaseTarget(() => 0.5, 1);
  assert.notEqual(target.lane, 1);
  assert.ok(target.x >= 8 && target.x <= 82);
  assert.ok(target.y >= 10 && target.y <= 74);
  assert.ok(target.duration >= 360 && target.duration <= 760);
}

console.log("v07 systems: 12 assertions passed");
