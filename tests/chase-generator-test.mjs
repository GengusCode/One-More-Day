import assert from "node:assert/strict";
import {
  createObstacleSequence,
  getSafeLanes,
  isSequenceReachable,
} from "../js/minigames/chase-generator.js";
import {
  createChaseModel,
  requestLaneMove,
  advanceChase,
  getChaseSnapshot,
} from "../js/minigames/chase-model.js";
import {
  calculateCanvasSize,
  controlDirection,
  start as startRunner,
} from "../js/minigames/chase-runner.js";
import {
  startDay,
  choosePath,
  chooseEvent,
  resolveMinigame,
  resolveUnavailableMinigame,
} from "../js/systems/day.js";
import { createNewLife } from "../js/core/state.js";

const tests = [];
const test = (name, run) => tests.push({ name, run });

test("generated chase courses are deterministic, themed and reachable", () => {
  const first = createObstacleSequence({ seed: 44 });
  const second = createObstacleSequence({ seed: 44 });
  assert.deepEqual(first, second);
  assert.ok(first.length >= 6 && first.length <= 8);
  for (const obstacle of first) {
    assert.ok(["pothole", "crate", "trolley", "pedestrian", "parked-taxi", "roadworks"].includes(obstacle.type));
    assert.ok(obstacle.lane >= 0 && obstacle.lane <= 2);
    assert.ok(obstacle.clearMs > obstacle.startMs);
  }
  for (let seed = 1; seed <= 1000; seed += 1) {
    const sequence = createObstacleSequence({ seed });
    assert.equal(isSequenceReachable(sequence, { laneChangeMs: 230 }), true, "seed " + seed);
  }
});

test("safe lanes exclude an active obstacle lane", () => {
  const lanes = getSafeLanes([{ id: "one", lane: 1, startMs: 1_000, clearMs: 1_600 }], 1_200);
  assert.deepEqual(Array.from(lanes), [0, 2]);
  assert.deepEqual(Array.from(getSafeLanes([], 500)), [0, 1, 2]);
});

test("lane controls move once, queue once and respect road edges", () => {
  const model = createChaseModel({ sequence: [], durationMs: 25_000, laneChangeMs: 200 });
  requestLaneMove(model, -1);
  requestLaneMove(model, 1);
  requestLaneMove(model, 1);
  let snapshot = getChaseSnapshot(model);
  assert.equal(snapshot.lane, 1);
  assert.equal(snapshot.targetLane, 0);
  assert.equal(snapshot.queuedDirection, 1);
  advanceChase(model, 200);
  snapshot = getChaseSnapshot(model);
  assert.equal(snapshot.targetLane, 1);
  advanceChase(model, 200);
  requestLaneMove(model, -1);
  requestLaneMove(model, -1);
  advanceChase(model, 500);
  assert.equal(getChaseSnapshot(model).lane, 0);
});

test("collision loses immediately and timer survival catches the thief", () => {
  const collision = createChaseModel({
    sequence: [{ id: "hit", type: "crate", lane: 1, startMs: 10, clearMs: 600 }],
    durationMs: 1_000,
  });
  advanceChase(collision, 20);
  assert.equal(getChaseSnapshot(collision).result.outcome, "escaped");

  const survival = createChaseModel({ sequence: [], durationMs: 100 });
  advanceChase(survival, 100);
  assert.equal(getChaseSnapshot(survival).result.outcome, "caught");
  advanceChase(survival, 100);
  assert.equal(getChaseSnapshot(survival).result.outcome, "caught");
});

test("runner layout caps pixel density and maps every required control", () => {
  assert.deepEqual(calculateCanvasSize({ width: 320, height: 480, devicePixelRatio: 4 }), {
    cssWidth: 320, cssHeight: 480, pixelWidth: 640, pixelHeight: 960, dpr: 2,
  });
  assert.equal(controlDirection("ArrowLeft"), -1);
  assert.equal(controlDirection("a"), -1);
  assert.equal(controlDirection("ArrowRight"), 1);
  assert.equal(controlDirection("D"), 1);
  assert.equal(controlDirection("Enter"), 0);
});

test("runner removes its resize listener after a completed chase", async () => {
  class FakeTarget {
    constructor() { this.listeners = new Map(); }
    addEventListener(type, listener) {
      const list = this.listeners.get(type) || [];
      list.push(listener);
      this.listeners.set(type, list);
    }
    removeEventListener(type, listener) {
      this.listeners.set(type, (this.listeners.get(type) || []).filter((item) => item !== listener));
    }
    count(type) { return (this.listeners.get(type) || []).length; }
  }
  class FakeElement extends FakeTarget {
    constructor(tag) {
      super();
      this.tagName = tag;
      this.children = [];
      this.style = {};
      this.attributes = {};
      this.textContent = "";
    }
    setAttribute(name, value) { this.attributes[name] = value; }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    getBoundingClientRect() { return { width: 360, height: 560 }; }
    getContext() {
      const gradient = { addColorStop() {} };
      return {
        setTransform() {}, clearRect() {}, createLinearGradient() { return gradient; },
        fillRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {},
        fill() {}, stroke() {}, arc() {}, fillText() {},
      };
    }
  }
  const original = {
    document: globalThis.document,
    window: globalThis.window,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
  };
  const fakeDocument = new FakeTarget();
  fakeDocument.hidden = false;
  fakeDocument.createElement = (tag) => new FakeElement(tag);
  const fakeWindow = new FakeTarget();
  fakeWindow.devicePixelRatio = 1;
  fakeWindow.innerHeight = 700;
  const frames = [];
  globalThis.document = fakeDocument;
  globalThis.window = fakeWindow;
  globalThis.requestAnimationFrame = (callback) => { frames.push(callback); return frames.length; };
  globalThis.cancelAnimationFrame = () => {};
  try {
    const run = startRunner({ host: new FakeElement("main"), seed: 9, durationMs: 100, reducedMotion: true });
    assert.equal(fakeWindow.count("resize"), 1);
    let now = 0;
    while (frames.length) {
      const frame = frames.shift();
      frame(now);
      now += 50;
    }
    await run;
    assert.equal(fakeWindow.count("resize"), 0);
  } finally {
    globalThis.document = original.document;
    globalThis.window = original.window;
    globalThis.requestAnimationFrame = original.requestAnimationFrame;
    globalThis.cancelAnimationFrame = original.cancelAnimationFrame;
  }
});

test("theft chase persists one seed and resolves its life outcome only once", () => {
  let state = choosePath(
    startDay(createNewLife({ name: "Neo", gender: "non-binary" }), { random: () => 0.8 }),
    "office",
    { random: () => 0.8 },
  );
  state.dailyState.phase = "headline";
  state.dailyState.activeEventId = "phone-theft";
  state.dailyState.choiceOrder = ["chase-phone", "shout-help", "protect-yourself"];
  state = chooseEvent(state, "phone-theft", "chase-phone");
  state = chooseEvent(state, "phone-theft", "start-chase");
  assert.equal(state.dailyState.phase, "minigame");
  assert.equal(typeof state.dailyState.chase.seed, "number");
  const before = state.stats.happiness;
  const resolved = resolveMinigame(state, { outcome: "caught", reason: "survived" });
  assert.ok(resolved.stats.happiness > before);
  const duplicate = resolveMinigame(resolved, { outcome: "caught", reason: "survived" });
  assert.equal(duplicate.stats.happiness, resolved.stats.happiness);
  assert.equal(duplicate.dailyState.chase.status, "resolved");
});

test("an unavailable chase resolves safely through the same saved outcome path", () => {
  let state = choosePath(
    startDay(createNewLife({ name: "Naledi", gender: "woman" }), { random: () => 0.8 }),
    "office",
    { random: () => 0.8 },
  );
  state.dailyState.phase = "headline";
  state.dailyState.activeEventId = "phone-theft";
  state.dailyState.choiceOrder = ["chase-phone", "shout-help", "protect-yourself"];
  state = chooseEvent(state, "phone-theft", "chase-phone");
  state = chooseEvent(state, "phone-theft", "start-chase");
  const before = state.stats.happiness;

  const resolved = resolveUnavailableMinigame(state);
  assert.equal(resolved.dailyState.chase.status, "resolved");
  assert.equal(resolved.dailyState.chase.result, "escaped");
  assert.equal(resolved.dailyState.chase.reason, "runner-unavailable");
  assert.equal(resolved.stats.happiness, before - 10);
  assert.equal(
    resolveUnavailableMinigame(resolved).stats.happiness,
    resolved.stats.happiness,
  );
});

let passed = 0;
for (const entry of tests) {
  await entry.run();
  passed += 1;
}
console.log("chase systems: " + passed + " tests passed");
