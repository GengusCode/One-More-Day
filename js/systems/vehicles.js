import { applyEffects, calculateNetWorth } from '../core/state.js';
import { formatRand } from '../data/economy.js';

export const VEHICLE_OFFERS = Object.freeze({
  sports: { name: 'Luxury sports car', deposit: 12000, value: 54000, remaining: 60000, upkeep: 60 },
  fleet: { name: 'Three delivery vans', deposit: 24000, value: 18000, remaining: 0, upkeep: 80 },
});
export const HOME_OPTIONS = Object.freeze({
  starter: { name: 'Shared home', spaces: 1, rent: 450, moveCost: 0 },
  small: { name: 'Small house', spaces: 2, rent: 900, moveCost: 3000 },
  large: { name: 'Larger house', spaces: 4, rent: 1800, moveCost: 6000 },
});
export function getHome(state) { return HOME_OPTIONS[state.household.homeSize] || HOME_OPTIONS.starter; }
export function getVehicleInventory(state) {
  const units = [];
  if (state.transport.owned.includes('car')) units.push({ id: 'car', name: '🚗 Used car', kind: 'car' });
  for (const purchase of state.garage.vehicles.filter(v => v.status === 'owned')) {
    if (purchase.id === 'sports') units.push({ id: 'sports', name: '🏎️ Luxury sports car', kind: 'sports' });
    if (purchase.id === 'fleet') for (let i = 1; i <= 3; i++) units.push({ id: `fleet-${i}`, name: `🚐 Delivery van ${i}`, kind: 'fleet' });
  }
  let parkedHome = 0;
  return units.map(unit => {
    const saved = state.garage.parking?.find(item => item.id === unit.id);
    let location = saved?.location || (unit.kind === 'fleet' ? 'work' : 'home');
    // Older saves may own more cars than their starter home fits. Keep all ownership.
    if (location === 'home' && parkedHome >= getHome(state).spaces) location = 'work';
    if (location === 'home') parkedHome++;
    return { ...unit, location, use: unit.kind === 'fleet' && location === 'work' ? 'business' : 'personal' };
  });
}
function rememberParking(next, inventory) {
  next.garage.parking = inventory.map(({id, location}) => ({id, location}));
}
export function setVehicleParking(state, id, location) {
  const inventory = getVehicleInventory(state);
  const vehicle = inventory.find(v => v.id === id);
  if (!vehicle || !['home', 'work'].includes(location) || state.life.ended || state.life.stage === 'school-finale') return { state, ok: false, reason: 'Vehicle unavailable.' };
  if (vehicle.id === 'car' && state.transport.dailyAssignment?.mode === 'driver') return {state, ok: false, reason: 'Your driver has this car today.'};
  if (location === 'work' && !state.business.active && !state.career.active) return { state, ok: false, reason: 'You need a workplace to park there.' };
  if (location === 'home' && vehicle.location !== 'home' && inventory.filter(v => v.location === 'home').length >= getHome(state).spaces) return { state, ok: false, reason: 'Home parking is full. Move a vehicle or choose a larger home in Life.' };
  const next = structuredClone(state);
  vehicle.location = location;
  rememberParking(next, inventory);
  return { state: next, ok: true };
}
export function changeHome(state, id) {
  const home = HOME_OPTIONS[id];
  if (!home || state.life.ended || state.life.stage === 'school-finale' || (state.household.homeSize || 'starter') === id) return { state, ok: false, reason: 'Home unavailable.' };
  if (getVehicleInventory(state).filter(v => v.location === 'home').length > home.spaces) return { state, ok: false, reason: 'Move vehicles to work before choosing a smaller home.' };
  if (state.finances.cash < home.moveCost) return { state, ok: false, reason: 'You cannot afford the moving cost.' };
  const next = applyEffects(state, {cash: -home.moveCost}, {source: 'house-move', label: `Move to ${home.name}`}).state;
  rememberParking(next, getVehicleInventory(state));
  next.household.homeSize = id;
  return {state: next, ok: true};
}
export function selectPersonalVehicle(state, id) {
  const vehicle = getVehicleInventory(state).find(v => v.id === id && v.location === 'home');
  if (!vehicle || (id === 'car' && (state.transport.car?.roadworthy === false || state.transport.dailyAssignment?.mode === 'driver'))) return {state, ok: false, reason: 'Park an available vehicle at home first.'};
  const next = structuredClone(state);
  next.transport.preferredVehicleId = id;
  return {state: next, ok: true};
}
export function canBuyBusinessVehicle(state, id) {
  const offer = VEHICLE_OFFERS[id];
  return Boolean(offer && state.business.active && !state.life.ended && state.life.stage !== 'school-finale'
    && (id !== 'fleet' || ['moving-service', 'buy-resell'].includes(state.business.id))
    && !state.garage.vehicles.some(v => v.id === id) && state.finances.cash >= offer.deposit);
}
export function buyBusinessVehicle(state, id) {
  if (!canBuyBusinessVehicle(state, id)) return { state, ok: false };
  const offer = VEHICLE_OFFERS[id];
  const next = applyEffects(state, { cash: -offer.deposit, stats: id === 'sports' ? { happiness: 12, reputation: 4 } : {} }, { source: 'vehicle-purchase' }).state;
  next.garage.vehicles.push({ id, ...offer, status: 'owned', purchasedDay: next.calendar.day,
    businessId: next.business.id, nextPaymentDay: next.calendar.day + 30, missed: 0, runningTotal: 0, salesTotal: 0, reviewed: false });
  next.garage.history.push(id === 'sports' ? 'You chose the sports car: a beautiful garage addition, with finance and running costs.' : 'You chose three delivery vans: your fleet is bigger, but demand must cover its costs.');
  rememberParking(next, getVehicleInventory(next));
  next.finances.netWorth = calculateNetWorth(next);
  return { state: next, ok: true };
}
export function fleetSales(state, randomValue) {
  const fleet = state.garage.vehicles.find(v => v.id === 'fleet' && v.status === 'owned' && v.businessId === state.business.id);
  const available = getVehicleInventory(state).filter(v => v.kind === 'fleet' && v.location === 'work').length;
  return fleet ? Math.round(250 * state.business.trust / 100 * (0.6 + randomValue * 0.8) * available / 3) : 0;
}
// Called once per calendar day by household settlement, including rest and skipped days.
export function settleVehicleDay(state) {
  let next = structuredClone(state);
  const report = text => {
    next.garage.history.push(text);
    next.dailyState.updates.push(text);
    next.dailyState.result = [next.dailyState.result, text].filter(Boolean).join(' ');
  };
  for (const vehicle of next.garage.vehicles) {
    if (vehicle.status !== 'owned') continue;
    next = applyEffects(next, { cash: -vehicle.upkeep }, { source: 'vehicle-running-costs' }).state;
    // applyEffects clones state; reacquire the ledger entry after each payment.
    let current = next.garage.vehicles.find(v => v.id === vehicle.id);
    current.runningTotal += current.upkeep;
    if (current.remaining > 0 && next.calendar.day >= current.nextPaymentDay) {
      const payment = Math.min(2000, current.remaining);
      current.nextPaymentDay += 30;
      if (next.finances.cash >= payment) {
        next = applyEffects(next, { cash: -payment }, { source: 'sports-car-finance' }).state;
        current = next.garage.vehicles.find(v => v.id === vehicle.id);
        current.remaining -= payment;
        current.missed = 0;
        report(`Because you chose the sports car, your ${formatRand(payment)} finance payment was due and paid. ${formatRand(current.remaining)} remains.`);
      } else {
        current.missed += 1;
        report(`Because you chose the sports car, you now owe an unpaid ${formatRand(payment)} instalment. ${current.missed}/3 consecutive payments missed.`);
        if (current.missed >= 3) {
          const shortfall = Math.max(0, current.remaining - current.value);
          current.status = 'repossessed'; current.remaining = 0; current.value = 0;
          next = applyEffects(next, { cash: -shortfall, stats: { happiness: -12, reputation: -4 } }, { source: 'vehicle-repossession' }).state;
          report(`Because you chose the sports car and missed three payments, it was repossessed. The sale covered part of the loan; ${formatRand(shortfall)} was added to your cash debt.`);
        }
      }
    }
    current = next.garage.vehicles.find(v => v.id === vehicle.id);
    if (current.id === 'fleet' && !current.reviewed && next.calendar.day >= current.purchasedDay + 30) {
      current.reviewed = true;
      const net = current.salesTotal - current.runningTotal;
      report(`Because you invested in delivery vans, extra sales after supplies brought ${formatRand(current.salesTotal)}, while running costs were ${formatRand(current.runningTotal)}. Your fleet has ${net >= 0 ? 'earned' : 'lost'} ${formatRand(Math.abs(net))} before its purchase cost.`);
    }
  }
  next.garage.history = next.garage.history.slice(-12);
  next.finances.netWorth = calculateNetWorth(next);
  return next;
}
