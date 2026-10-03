import { fleetSales } from "./vehicles.js";
import { applyEffects, calculateNetWorth } from "../core/state.js";
import { ECONOMY } from "../data/economy.js";
import { WORK_DECISIONS } from "../data/events.js";
import { scheduleChoiceConsequence } from "./event-deck.js";

const clone = (value) => (
  typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value))
);
const clamp = (value) => Math.max(0, Math.min(100, Number(value) || 0));

export const BUSINESS_TYPES = Object.freeze({
  "car-wash": { name: "Car-wash service", baselineRevenue: 140 },
  "moving-service": { name: "Moving & helping service", baselineRevenue: 165 },
  "buy-resell": { name: "Buy & resell", baselineRevenue: 135 },
});

export const BUSINESS_UPGRADES = Object.freeze({
  "car-wash-pressure-washer": { businessId: "car-wash", name: "Pressure washer", cost: 1_200, capacity: 1, value: 800 },
  "car-wash-canopy": { businessId: "car-wash", name: "Weather canopy", cost: 2_400, capacity: 1, value: 1_700 },
  "moving-trolley": { businessId: "moving-service", name: "Moving trolley and straps", cost: 1_050, capacity: 1, value: 700 },
  "moving-storage": { businessId: "moving-service", name: "Storage unit", cost: 3_800, capacity: 2, value: 2_700 },
  "resell-shelves": { businessId: "buy-resell", name: "Stock shelves", cost: 950, capacity: 1, value: 650 },
  "resell-delivery": { businessId: "buy-resell", name: "Delivery setup", cost: 3_000, capacity: 2, value: 2_100 },
});

export const BUSINESS_EXPANSIONS = Object.freeze([
  {id:'commercial-site',name:'Commercial premises',cost:30000,value:26000,capacity:2,requiredStaff:2},
  {id:'second-branch',name:'Second branch',cost:75000,value:65000,capacity:3,requiredStaff:4},
]);
export function getExpansionOffer(state) {
  const offer = BUSINESS_EXPANSIONS[state.business.premises.length];
  if (!offer || !state.business.active || state.business.closed || state.life.ended || state.life.stage === 'school-finale') return {offer:null,ok:false,reason:'Expansion unavailable.'};
  const reason = state.business.staff.length < offer.requiredStaff ? `Build a team of ${offer.requiredStaff} staff first.` : state.business.trust < 55 ? 'Customer trust must be at least 55.' : state.finances.cash < offer.cost ? 'Save enough for the upfront cost.' : '';
  return {offer,ok:!reason,reason};
}
export function expandBusiness(state) {
  const eligibility = getExpansionOffer(state);
  if (!eligibility.ok) return {state,ok:false,reason:eligibility.reason};
  const offer = eligibility.offer;
  const next = applyEffects(state,{cash:-offer.cost},{source:'business-expansion',label:`Open ${offer.name.toLowerCase()}`}).state;
  next.business.premises.push({id:offer.id,name:offer.name,value:offer.value,openedDay:next.calendar.day});
  next.business.capacity += offer.capacity;
  next.business.value += offer.value;
  next.business.title = getBusinessTitle(next.business);
  next.finances.netWorth = calculateNetWorth(next);
  return {state:next,ok:true};
}

const EMPLOYEE_ROLES = Object.freeze({
  helper: { name: "Helper", capacity: 1, wage: 80 },
  specialist: { name: "Skilled worker", capacity: 2, wage: 150 },
  manager: { name: "Manager", capacity: 0, wage: 180 },
});

export function startBusiness(state, businessId) {
  const type = BUSINESS_TYPES[businessId];
  if (!type) throw new TypeError("Unknown business.");
  const next = clone(state);
  next.career.active = false;
  next.business = {
    ...next.business,
    active: true,
    id: businessId,
    title: "Solo Owner",
    trust: ECONOMY.business.startingTrust,
    value: 500,
    capacity: 1,
    baselineRevenue: type.baselineRevenue,
    staff: [],
    premises: [],
    zeroTrustOperatingDays: 0,
    completedDecisionIds: [],
    closed: false,
  };
  return next;
}

export function getBusinessTitle(business) {
  if (business.premises.length >= 2 && business.staff.length >= 6 && business.value >= 100_000) return "Multi-Site Founder";
  if (business.premises.length >= 1 && business.staff.length >= 3 && business.capacity >= 4 && business.value >= 30_000) return "Site Owner";
  if (business.staff.length >= 1 && business.value >= 8_000) return "Employer";
  if (business.capacity >= 2) return "Equipped Operator";
  return "Solo Owner";
}

export function buyUpgrade(state, upgradeId) {
  const upgrade = BUSINESS_UPGRADES[upgradeId];
  if (!upgrade || upgrade.businessId !== state.business.id) return { state, ok: false, reason: "unavailable", transactions: [] };
  if (state.assets.ownedUpgradeIds.includes(upgradeId)) return { state, ok: false, reason: "owned", transactions: [] };
  if (state.finances.cash < upgrade.cost) return { state, ok: false, reason: "cash", transactions: [] };
  const paid = applyEffects(state, { cash: -upgrade.cost }, { source: "business-equipment" });
  const next = paid.state;
  next.assets.ownedUpgradeIds.push(upgradeId);
  next.assets.items[upgradeId] = { id: upgradeId, name: upgrade.name, value: upgrade.value };
  next.business.capacity += upgrade.capacity;
  next.business.value += upgrade.value;
  next.business.title = getBusinessTitle(next.business);
  next.finances.netWorth = calculateNetWorth(next);
  return { state: next, ok: true, reason: "", transactions: paid.transactions };
}

export function getStaffLimit(state) {
  const base = { "buy-resell": 1, "car-wash": 2, "moving-service": 3 }[state.business.id] || 0;
  const equipment = state.assets.ownedUpgradeIds.filter(id => BUSINESS_UPGRADES[id]?.businessId === state.business.id).length;
  return base + equipment + Math.min(2, state.business.premises.length) * 3;
}

export function canHireManager(state) {
  return state.business.active && !state.business.closed && !state.life.ended && state.life.stage !== 'school-finale'
    && state.business.premises.length >= 1 && state.business.staff.length >= 3
    && !state.business.staff.some(employee => employee.roleId === 'manager') && state.business.staff.length < getStaffLimit(state);
}

export function hireEmployee(state, roleId) {
  const role = EMPLOYEE_ROLES[roleId];
  if (!role || !state.business.active || state.business.closed || state.life.ended || state.life.stage === "school-finale") return { state, ok: false, reason: "unavailable" };
  if (roleId === 'manager' && !canHireManager(state)) return {state,ok:false,reason:'manager-unavailable'};
  if (state.business.staff.length >= getStaffLimit(state)) return { state, ok: false, reason: "staff-limit" };
  const next = clone(state);
  next.business.staff.push({
    id: "employee-" + (next.business.staff.length + 1),
    roleId,
    name: role.name,
    wage: role.wage,
  });
  next.business.capacity += role.capacity;
  next.business.value += 1_500;
  next.business.title = getBusinessTitle(next.business);
  return { state: next, ok: true, reason: "" };
}

export function resolveOwnerChoice(state, eventId, choiceId, { random = Math.random } = {}) {
  const event = WORK_DECISIONS.find((item) => item.id === eventId && item.path === "business");
  const choice = event?.choices.find((item) => item.id === choiceId);
  if (!choice) return { state, status: { valid: false }, transactions: [] };
  let next = clone(state);
  const business = choice.effects?.business || {};
  if (business.trust) next.business.trust = clamp(next.business.trust + business.trust);
  const applied = applyEffects(next, choice.effects || {}, { source: eventId, label: choice.label });
  next = applied.state;
  next.business.completedDecisionIds.push(eventId);
  next = scheduleChoiceConsequence(next, eventId, choice, random);
  return { state: next, status: { valid: true, result: choice.result }, transactions: applied.transactions };
}

export function settleBusinessDay(state, { day = state.calendar.day, operating = true, ownerAway = false, random = Math.random } = {}) {
  const settlementId = "business-day-" + day;
  if (state.dailyState.settledIds.includes(settlementId)) return { state, transactions: [], status: { duplicate: true } };
  let next = clone(state);
  const status = { duplicate: false, reason: "", revenue: 0 };
  if (!next.business.active || next.business.closed) return { state: next, transactions: [], status };
  let transactions = [];
  if (operating) {
    const demand = 0.65 + next.business.trust / 100 * 0.7;
    const roll = random();
    const variation = 0.9 + roll * 0.2;
    const coverage = ownerAway ? (next.business.staff.some(employee => employee.roleId === 'manager') ? .8 : .45) : 1;
    const fleetGross = Math.round(fleetSales(next, roll) * coverage);
    const gross = Math.round(next.business.baselineRevenue * Math.min(3.5 + next.business.premises.length * 2, Math.pow(next.business.capacity, 0.65)) * (1 + next.business.premises.length * 0.5) * demand * variation * coverage) + fleetGross;
    const wages = next.business.staff.reduce((sum, employee) => sum + Number(employee.wage || 0), 0);
    const supplies = Math.round(gross * (next.business.id === "buy-resell" ? 0.55 : 0.25));
    const overhead = 10 + next.business.premises.length * 25;
    const fleet = next.garage.vehicles.find(v => v.id === "fleet" && v.status === "owned" && v.businessId === next.business.id);
    if (fleet) fleet.salesTotal += fleetGross - Math.round(fleetGross * (next.business.id === "buy-resell" ? 0.55 : 0.25));
    const net = gross - supplies - overhead - wages;
    Object.assign(status, { gross, supplies, overhead, wages });
    const settled = applyEffects(next, { cash: net, stats: { energy: ownerAway ? 0 : -9 } }, { source: "business-income", label:ownerAway ? 'Business sales while you were away' : 'Business sales after costs', breakdown:[{label:'Customer sales',amount:gross},{label:'Supplies',amount:-supplies},{label:'Staff wages',amount:-wages},{label:'Business overhead',amount:-overhead}] });
    next = settled.state;
    transactions = settled.transactions;
    status.revenue = net;
  }
  if (next.business.trust === 0 && operating) next.business.zeroTrustOperatingDays += 1;
  else if (operating) next.business.zeroTrustOperatingDays = 0;
  if (next.business.zeroTrustOperatingDays >= ECONOMY.business.closureDaysAtZeroTrust) {
    next.business.closed = true;
    next.business.active = false;
    status.reason = "closed";
  }
  next.business.title = getBusinessTitle(next.business);
  next.dailyState.settledIds.push(settlementId);
  return { state: next, transactions, status };
}
