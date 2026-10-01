import { applyEffects, calculateNetWorth } from '../core/state.js';
import { formatRand } from '../data/economy.js';

export const VEHICLE_OFFERS = Object.freeze({
  sports: { name: 'Luxury sports car', deposit: 12000, value: 54000, remaining: 60000, upkeep: 60 },
  fleet: { name: 'Three delivery vans', deposit: 24000, value: 18000, remaining: 0, upkeep: 80 },
});
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
  next.finances.netWorth = calculateNetWorth(next);
  return { state: next, ok: true };
}
export function fleetSales(state, randomValue) {
  const fleet = state.garage.vehicles.find(v => v.id === 'fleet' && v.status === 'owned' && v.businessId === state.business.id);
  return fleet ? Math.round(250 * state.business.trust / 100 * (0.6 + randomValue * 0.8)) : 0;
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
