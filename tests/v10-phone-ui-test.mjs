import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createNewLife, validateState } from "../js/core/state.js";
import { buildPhoneModel, renderPhone } from "../js/ui/phone.js";
import { createRenderer } from "../js/ui/render.js";

function adultLife() {
  const state = createNewLife({ name: "Thandi", gender: "woman" });
  state.life.stage = "adult-life";
  state.life.examResult = { score: 40, band: "developing" };
  state.dailyState.complete = true;
  state.dailyState.phase = "complete";
  state.stats.knowledge = 40;
  state.finances.cash = 2_000;
  return state;
}

const state = adultLife();
const phone = buildPhoneModel(state);
assert.deepEqual(
  phone.apps.map((app) => app.id),
  ["jobs", "study", "transport", "business", "people", "life", "time"],
  "the uncluttered launcher keeps the seven main apps in the approved order",
);
assert.ok(phone.utilities.some((app) => app.id === "bank"), "Bank remains reachable without crowding the launcher");
assert.ok(phone.utilities.some((app) => app.id === "betway"), "Betway remains reachable without crowding the launcher");

const study = phone.apps.find((app) => app.id === "study");
const recommendedProgrammes = study.cards.filter((card) => card.programmeId);
assert.ok(recommendedProgrammes.length > 0 && recommendedProgrammes.length <= 3);
assert.ok(study.cards.some((card) => card.actions.some((item) => item.action === "SET_STUDY_FILTER" && item.id === "all")));
const bridge = recommendedProgrammes.find((card) => card.programmeId === "foundation-bridge");
assert.ok(bridge, "the accessible bridge route is recommended after weak results");
assert.ok(bridge.actions.some((item) => item.action === "ENROL_STUDY" && item.programmeId === "foundation-bridge" && item.fundingId));

const allState = structuredClone(state);
allState.settings.phone.studyFilter = "all";
const allStudy = buildPhoneModel(allState).apps.find((app) => app.id === "study");
assert.equal(allStudy.cards.filter((card) => card.programmeId).length, 10);
const computing = allStudy.cards.find((card) => card.programmeId === "computing-degree");
assert.equal(computing.actions.some((item) => item.action === "ENROL_STUDY" && !item.disabled), false);
assert.ok(computing.text.length > 20 && /bridge|knowledge|result|experience/i.test(computing.text), "locked routes explain a recoverable next step");

const active = structuredClone(state);
active.education.active = {
  id: "study-foundation-bridge-1",
  programmeId: "foundation-bridge",
  fundingId: "part-time",
  status: "active",
  startDay: 1,
  endDay: 15,
  checkpointDays: { strategy: 1, pressure: 8, assessment: 15 },
  focus: 50,
  attendance: 50,
  integrity: 70,
  experience: 0,
  resolvedCheckpointIds: ["strategy"],
  rewriteCount: 0,
};
const activePhone = buildPhoneModel(active);
const activeStudy = activePhone.apps.find((app) => app.id === "study");
assert.match(activeStudy.summary, /active|progress/i);
assert.ok(activeStudy.cards.some((card) => card.actions.some((item) => item.action === "FAST_FORWARD_STUDY")));
assert.ok(activeStudy.cards.some((card) => card.actions.some((item) => item.action === "WITHDRAW_STUDY")));
assert.ok(activePhone.apps.find((app) => app.id === "time").cards.some((card) => card.actions.some((item) => item.action === "FAST_FORWARD_STUDY")));

const qualified = structuredClone(state);
qualified.education.completed.push({ programmeId: "foundation-bridge", outcome: "pass", day: 15, score: 68 });
qualified.finances.liabilities.push({ id: "loan-1", programmeId: "computing-degree", outstandingBalance: 8_400, status: "active" });
const lifeCards = buildPhoneModel(qualified).apps.find((app) => app.id === "life").cards;
assert.ok(lifeCards.some((card) => /résumé|qualification/i.test(card.title) && /Foundation Bridge/.test(card.text)));
assert.ok(lifeCards.some((card) => /debt|loan/i.test(`${card.title} ${card.text}`) && /8.400|8,400|R8/.test(`${card.badge} ${card.text}`)));

const school = createNewLife({ name: "Lwazi", gender: "man" });
school.settings.phone.studyFilter = "all";
const schoolStudy = buildPhoneModel(school).apps.find((app) => app.id === "study");
assert.equal(schoolStudy.cards.some((card) => card.actions.some((item) => item.action === "ENROL_STUDY" && !item.disabled)), false);

const unsafe = structuredClone(state);
unsafe.profile.name = '<img src=x onerror="alert(1)">';
const safeHtml = renderPhone(buildPhoneModel(unsafe), { open: true, activeApp: "life" });
assert.doesNotMatch(safeHtml, /<img src=x/);
assert.match(safeHtml, /&lt;img/);
assert.match(renderPhone(phone, { open: true, activeApp: "study" }), /role="dialog"/);

let clickHandler;
let dispatched;
const fakeRoot = {
  addEventListener(type, handler) { if (type === "click") clickHandler = handler; },
  removeEventListener() {},
  contains() { return true; },
  querySelector() { return null; },
};
createRenderer({ root: fakeRoot, dispatch(action, payload) { dispatched = { action, payload }; } });
const button = {
  dataset: {
    action: "ENROL_STUDY",
    choice: "foundation-bridge:part-time",
    panel: "study",
    app: "study",
    programmeId: "foundation-bridge",
    fundingId: "part-time",
  },
  matches() { return false; },
};
clickHandler({ target: { closest() { return button; } }, preventDefault() {} });
assert.deepEqual(dispatched, {
  action: "ENROL_STUDY",
  payload: {
    id: "foundation-bridge:part-time",
    panel: "study",
    app: "study",
    programmeId: "foundation-bridge",
    fundingId: "part-time",
  },
});

const safeSettings = validateState({ schemaVersion: 10, settings: { phone: { open: 1, app: "study", studyFilter: "unsafe" } } });
assert.deepEqual(safeSettings.settings.phone, { open: true, app: "study", studyFilter: "recommended" });

const indexHtml = await readFile(new URL("../index.html", import.meta.url), "utf8");
assert.match(indexHtml, /data-game-version="0\.10"/);
assert.match(indexHtml, /v10-level-up\.css/);

console.log("v10 phone UI: Study app, résumé, payloads and clean launcher passed");
