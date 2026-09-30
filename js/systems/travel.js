import { applyEffects, calculateNetWorth } from "../core/state.js";
import { ECONOMY } from "../data/economy.js";

const clone = (value) => (
  typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value))
);
const clamp = (value) => Math.max(0, Math.min(100, Number(value) || 0));

export function getTravelOptions(state, context = {}) {
  const options = [];
  if (!context.taxiStrike) {
    if (state.finances.cash >= ECONOMY.travel.taxi.cost) options.push({ id: "taxi", label: "Take a taxi", cost: 30 });
    if (context.taxiFull && state.finances.cash >= ECONOMY.travel.taxiPassage.cost) {
      options.push({ id: "taxi-passage", label: "Stand in the passage", cost: 30 });
    }
  }
  const ehailingCost = Math.round(ECONOMY.travel.ehailing.cost * (context.surge ? ECONOMY.travel.ehailing.surgeMultiplier : 1));
  if (state.finances.cash >= ehailingCost) options.push({ id: "ehailing", label: "Book e-hailing", cost: ehailingCost });
  if (state.transport.owned.includes("bicycle") && !context.heavyRain) options.push({ id: "bicycle", label: "Ride your bicycle", cost: 0 });
  if (
    state.transport.owned.includes("car")
    && state.transport.car?.roadworthy !== false
    && state.transport.dailyAssignment?.mode !== "driver"
    && state.finances.cash >= ECONOMY.travel.car.fuelCost
  ) options.push({ id: "car", label: "Drive your car", cost: ECONOMY.travel.car.fuelCost });
  options.push({ id: "stay-home", label: "Stay home", cost: 0 });
  return options;
}

export function buyTransportAsset(state, assetId) {
  if (state.transport.owned.includes(assetId)) return { state, ok: false, reason: "owned", transactions: [] };
  const definition = ECONOMY.assets[assetId];
  if (!definition || state.finances.cash < definition.purchaseCost) return { state, ok: false, reason: "cash", transactions: [] };
  const paid = applyEffects(state, { cash: -definition.purchaseCost }, { source: "transport-asset" });
  const next = paid.state;
  next.transport.owned.push(assetId);
  const valueRate = assetId === "car" ? definition.netWorthRate : 0.7;
  next.assets.items[assetId] = {
    id: assetId,
    name: assetId === "car" ? "Used car" : "Bicycle",
    value: Math.round(definition.purchaseCost * valueRate),
  };
  if (assetId === "car") next.transport.car = { roadworthy: true, damage: 0 };
  next.finances.netWorth = calculateNetWorth(next);
  return { state: next, ok: true, reason: "", transactions: paid.transactions };
}

export function assignCarForDay(state, assignment, random = Math.random) {
  if (!state.transport.owned.includes("car") || state.transport.car?.roadworthy === false) {
    return { state, ok: false, transactions: [], followUp: null };
  }
  const day = state.calendar.day;
  if (state.transport.dailyAssignment?.day === day) {
    return { state, ok: false, transactions: [], followUp: null };
  }
  const next = clone(state);
  next.transport.dailyAssignment = { day, mode: assignment };
  if (assignment !== "driver") return { state: next, ok: true, transactions: [], followUp: null };
  const range = ECONOMY.assets.car.driverIncomeMax - ECONOMY.assets.car.driverIncomeMin;
  const income = ECONOMY.assets.car.driverIncomeMin + Math.floor(random() * (range + 1));
  const paid = applyEffects(next, { cash: income }, { source: "e-hailing-driver" });
  paid.state.dailyState.settledIds.push("driver-day-" + day);
  const followUp = random() < 0.08
    ? { dueDay: day + 1, eventId: "driver-follow-up", outcomeId: "driver-maintenance-" + day, severity: 3, payload: { repair: true } }
    : null;
  return { state: paid.state, ok: true, transactions: paid.transactions, followUp };
}

export function resetDailyTransport(state, newDay) {
  const next = clone(state);
  if (Number(newDay) > Number(next.transport.dailyAssignment?.day || 0)) next.transport.dailyAssignment = null;
  return next;
}

function markTravel(next, optionId) {
  next.transport.lastTravelDay = next.calendar.day;
  const id = "travel-day-" + next.calendar.day + "-" + optionId;
  if (!next.dailyState.settledIds.includes(id)) next.dailyState.settledIds.push(id);
  return next;
}

export function resolveTravel(state, optionId, context = {}) {
  if (optionId === "stay-home") {
    let next = applyEffects(state, {
      stats: { energy: ECONOMY.stayHome.energy, health: ECONOMY.stayHome.health },
    }, { source: "stay-home" }).state;
    if (next.career.active) {
      next.career.performance = clamp(next.career.performance + (
        context.calledAhead ? ECONOMY.stayHome.corporateCalledPerformance : ECONOMY.stayHome.corporatePerformance
      ));
      next.career.attendanceStreak = 0;
    }
    if (next.business.active) {
      const staffed = next.business.staff.length > 0;
      next.business.trust = clamp(next.business.trust + (staffed ? ECONOMY.stayHome.staffedTrust : ECONOMY.stayHome.soloTrust));
      if (staffed) {
        next = applyEffects(next, {
          cash: Math.round(next.business.baselineRevenue * ECONOMY.stayHome.staffedIncomeRate),
        }, { source: "staffed-business-absence" }).state;
      }
    }
    return { state: markTravel(next, optionId), status: { arrived: false, stayedHome: true } };
  }

  const definitions = {
    taxi: ECONOMY.travel.taxi,
    "taxi-passage": ECONOMY.travel.taxiPassage,
    ehailing: {
      ...ECONOMY.travel.ehailing,
      cost: Math.round(ECONOMY.travel.ehailing.cost * (context.surge ? ECONOMY.travel.ehailing.surgeMultiplier : 1)),
    },
    bicycle: {
      ...ECONOMY.travel.bicycle,
      energy: ECONOMY.travel.bicycle.energy * (context.rain ? ECONOMY.travel.bicycle.rainEnergyMultiplier : 1),
    },
    car: { cost: ECONOMY.travel.car.fuelCost, energy: ECONOMY.travel.car.energy },
  };
  const method = definitions[optionId];
  if (!method) return { state, status: { arrived: false, invalid: true } };
  const applied = applyEffects(state, {
    cash: -(method.cost || 0),
    stats: {
      energy: method.energy || 0,
      health: method.health || 0,
      happiness: method.happiness || 0,
    },
  }, { source: "travel-" + optionId });
  return { state: markTravel(applied.state, optionId), status: { arrived: true, stayedHome: false }, transactions: applied.transactions };
}
