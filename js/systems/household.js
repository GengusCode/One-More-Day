import { settleVehicleDay, getHome } from './vehicles.js';
import { applyEffects, calculateNetWorth } from '../core/state.js';

export function stokvelMonth(day) { return Math.floor(((day - 1) % 365) * 12 / 365); }
export function contributeStokvel(state, amount = 180) {
  if (state.life.stage === 'school-finale' || state.life.ended) return { state, ok: false };
  const cycle = Math.floor((state.calendar.day - 1) / 365);
  if (state.stokvel.lastPaidCycle >= cycle) return { state, ok: false };
  const month = stokvelMonth(state.calendar.day);
  const already = state.stokvel.contributions.filter(item => item.cycle === cycle && item.month === month).reduce((sum,item)=>sum+item.amount,0);
  const payment = Math.min(Math.max(0, Number(amount) || 0), 180 - already);
  if (!payment || state.finances.cash < payment) return { state, ok: false };
  const next = structuredClone(state);
  next.stokvel.balance += payment;
  next.stokvel.contributions.push({ cycle, month, amount: payment, day: next.calendar.day });
  const paid = applyEffects(next, { cash: -payment }, { source: 'stokvel-contribution' }).state;
  return { state: paid, ok: true };
}
export function settleStokvelPayout(state) {
  const cycle = Math.floor((state.calendar.day - 1) / 365);
  if (state.calendar.day % 365 !== 0 || state.stokvel.lastPaidCycle >= cycle) return state;
  const next = structuredClone(state);
  const amount = next.stokvel.balance;
  next.stokvel.balance = 0;
  next.stokvel.lastPaidCycle = cycle;
  next.stokvel.lastPayout = { day: next.calendar.day, amount };
  const paid = applyEffects(next, { cash: amount }, { source: 'stokvel-payout' }).state;
  if (amount) paid.dailyState.updates.push(`Your annual stokvel payout is R${amount}, based on what you contributed.`);
  return paid;
}
export function settleHouseholdDay(state) {
  if (state.life.stage === 'school-finale' || state.household.lastSettledDay >= state.calendar.day) return state;
  let next = settleStokvelPayout(state);
  const day = next.calendar.day;
  const cost = 25 + (day % 7 === 0 ? 70 : 0) + (day % 30 === 0 ? getHome(next).rent : 0);
  next = applyEffects(next, { cash: -cost }, { source: 'living-costs',breakdown:[{label:'Food',amount:-25},...(day%7===0?[{label:'Electricity',amount:-70}]:[]),...(day%30===0?[{label:'Housing',amount:-getHome(next).rent}]:[])] }).state;
  next = settleVehicleDay(next);
  next.household.lastSettledDay = day;
  next.household.lastCost = cost;
  if (!next.dailyState.result) next.dailyState.result = 'You finish the day. Today’s money movements are listed below.';
  next.finances.netWorth = calculateNetWorth(next);
  return next;
}
