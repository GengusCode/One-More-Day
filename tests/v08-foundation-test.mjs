import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import {
  buildSetupModel,
  buildGameViewModel,
  createRenderer,
  escapeText,
} from "../js/ui/render.js";
import { buildPhoneModel } from "../js/ui/phone.js";
import { createDefaultState, createNewLife } from "../js/core/state.js";
import { createMoneyQueue } from "../js/ui/money-feedback.js";
import { APP_VERSION, isCompatiblePageVersion } from "../js/core/version.js";

const tests = [];
const test = (name, run) => tests.push({ name, run });

test("setup stays disabled until name and gender are valid", () => {
  assert.equal(buildSetupModel({ name: "N", gender: "" }).canStart, false);
  assert.match(buildSetupModel({ name: "N", gender: "" }).error, /2 characters/i);
  assert.equal(buildSetupModel({ name: "Naledi", gender: "" }).canStart, false);
  assert.match(buildSetupModel({ name: "Naledi", gender: "" }).error, /gender/i);
  assert.equal(buildSetupModel({ name: "Naledi", gender: "woman" }).canStart, true);
});

test("user supplied text is escaped before markup insertion", () => {
  assert.equal(
    escapeText("<img src=x onerror=alert(1)> & \"name\""),
    "&lt;img src=x onerror=alert(1)&gt; &amp; &quot;name&quot;",
  );
});

test("game view model exposes personal stats without relationship scores", () => {
  const state = createNewLife({ name: "Thando", gender: "man" });
  state.calendar.day = 8;
  state.finances.cash = 1_234;
  const view = buildGameViewModel(state);
  assert.deepEqual(view.hud, {
    day: 8,
    age: 18,
    cash: "R1\u00a0234",
    energy: 72,
    health: state.stats.health,
    knowledge: state.stats.knowledge,
    social: state.stats.social,
    happiness: state.stats.happiness,
    reputation: state.stats.reputation,
    luck: state.stats.luck,
  });
  assert.equal(view.playerName, "Thando");
  assert.equal("relationships" in view.hud, false);
  assert.equal("netWorth" in view.hud, false);
});

test("secondary systems stay in phone apps", () => {
  const state = createNewLife({ name: "Ayesha", gender: "woman" });
  const model = buildPhoneModel(state);
  assert.deepEqual(
    model.apps.map(({ id }) => id),
    ["jobs", "transport", "business", "people", "life", "time", "betway"],
  );
});

test("the production entry references existing local modules and styles", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /id="app"/);
  assert.match(html, /type="module"\s+src="js\/app\.js"/);
  assert.match(html, /href="v09-life-begins\.css"/);
  await access(new URL("../js/app.js", import.meta.url));
  await access(new URL("../v09-life-begins.css", import.meta.url));
  await assert.rejects(access(new URL("../v08-preview.html", import.meta.url)));
});

test("money feedback queues rapid changes and ignores duplicate transaction IDs", () => {
  const callbacks = [];
  const events = [];
  const queue = createMoneyQueue({
    present: (transaction) => events.push("show:" + transaction.id),
    settle: (transaction) => events.push("settle:" + transaction.id),
    announce: (transaction) => events.push((transaction.amount > 0 ? "+" : "−") + Math.abs(transaction.amount)),
    scheduler: (callback) => { callbacks.push(callback); return callbacks.length; },
    cancel: () => {},
    duration: 800,
  });
  queue.enqueue({ id: "tx-1", amount: 100, balance: 450 });
  queue.enqueue({ id: "tx-2", amount: -30, balance: 420 });
  queue.enqueue({ id: "tx-1", amount: 100, balance: 450 });
  assert.deepEqual(events, ["show:tx-1", "+100"]);
  callbacks.shift()();
  assert.deepEqual(events, ["show:tx-1", "+100", "settle:tx-1", "show:tx-2", "−30"]);
  callbacks.shift()();
  assert.deepEqual(events.slice(-1), ["settle:tx-2"]);
});

test("reduced motion money feedback settles immediately without dropping announcements", () => {
  const events = [];
  const queue = createMoneyQueue({
    reducedMotion: true,
    present: (transaction) => events.push("show:" + transaction.id),
    settle: (transaction) => events.push("settle:" + transaction.id),
    announce: (transaction) => events.push("announce:" + transaction.id),
  });
  queue.enqueue({ id: "tx-9", amount: 12, balance: 362 });
  assert.deepEqual(events, ["show:tx-9", "announce:tx-9", "settle:tx-9"]);
});

test("blocks saves from a page whose version marker does not match v0.9", () => {
  assert.equal(APP_VERSION, "0.9");
  assert.equal(isCompatiblePageVersion("0.9", 9), true);
  assert.equal(isCompatiblePageVersion("0.8", 9), false);
  assert.equal(isCompatiblePageVersion("0.9", 8), false);
  assert.equal(isCompatiblePageVersion("", 8), false);
});

test("shows setup-level errors instead of leaving the start screen silent", () => {
  const root = {
    html: "",
    addEventListener() {},
    removeEventListener() {},
    set innerHTML(value) { this.html = value; },
    get innerHTML() { return this.html; },
  };
  const renderer = createRenderer({ root, dispatch() {} });
  renderer.render(createDefaultState(), {
    screen: "setup",
    hasSave: false,
    error: "A game update is still loading. Refresh this page before making a choice.",
  });
  assert.match(root.html, /game update is still loading/i);
  assert.match(root.html, /role="alert"/);
  assert.match(root.html, /id="setupError"[^>]*tabindex="-1"/);
});

test("moves focus to the next decision after a life transition", () => {
  let focused = 0;
  const root = {
    html: "",
    addEventListener() {},
    removeEventListener() {},
    querySelector(selector) {
      return selector === "#today-title" ? { focus() { focused += 1; } } : null;
    },
    set innerHTML(value) { this.html = value; },
    get innerHTML() { return this.html; },
  };
  const renderer = createRenderer({ root, dispatch() {} });
  renderer.render(createNewLife({ name: "Zinhle", gender: "woman" }), {
    screen: "game",
    focusTarget: "#today-title",
  });
  assert.equal(focused, 1);
});

let passed = 0;
for (const entry of tests) {
  await entry.run();
  passed += 1;
}
console.log("v08 foundation: " + passed + " tests passed");
