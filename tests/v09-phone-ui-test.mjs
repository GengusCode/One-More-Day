import assert from "node:assert/strict";
import { createNewLife, validateState } from "../js/core/state.js";
import { createRenderer } from "../js/ui/render.js";
import { buildPhoneModel, renderPhone } from "../js/ui/phone.js";
import { startCareer } from "../js/systems/career.js";

const root = {
  html: "",
  addEventListener() {},
  removeEventListener() {},
  querySelector() { return null; },
  set innerHTML(value) { this.html = value; },
  get innerHTML() { return this.html; },
};

const renderer = createRenderer({ root, dispatch() {} });
const life = createNewLife({ name: "Naledi", gender: "woman" });
renderer.render(life, {
  screen: "game",
  event: { title: "Your move", choices: [{ id: "one", label: "Rest" }, { id: "two", label: "Learn" }] },
  canAdvance: false,
});

assert.equal((root.html.match(/data-action="OPEN_PHONE"/g) || []).length, 1);
assert.doesNotMatch(root.html, /secondary-stack/);
assert.match(root.html, /class="phone-launch"/);
const beforeDecision = root.html.split('<main class="play-column">')[0];
for (const label of ["HEALTH", "HAPPINESS", "KNOWLEDGE", "SOCIAL", "REPUTATION"]) {
  assert.ok(beforeDecision.includes(label), `${label} is visible above the decision`);
}
assert.ok(!beforeDecision.includes("guardian"), "relationship scores stay on the phone");
assert.doesNotMatch(root.html, /decision--feature/);

const phone = buildPhoneModel(life);
assert.deepEqual(phone.apps.map((app) => app.id), ["jobs", "bank", "transport", "business", "people", "life", "time", "betway"]);
const schoolJobs = phone.apps.find((app) => app.id === "jobs").cards;
assert.deepEqual(schoolJobs.map((card) => card.id), ["finish-school"]);
assert.deepEqual(schoolJobs[0].actions, [], "school players cannot apply before receiving an exam result");
const timeActions = phone.apps.find((app) => app.id === "time").cards[0].actions;
assert.ok(timeActions.every((item) => item.disabled));

const employedPhone = buildPhoneModel(startCareer(life, "office"));
assert.equal(employedPhone.apps.find((app) => app.id === "jobs").cards[0].id, "current-path");
assert.match(renderPhone(phone, { open: true, activeApp: "people" }), /role="dialog"/);

const safeSettings = validateState({ schemaVersion: 9, settings: { phone: { open: 1, app: "unsafe" } } });
assert.deepEqual(safeSettings.settings.phone, { open: true, app: "home" });

console.log("v09 phone UI: app model and uncluttered game screen passed");
