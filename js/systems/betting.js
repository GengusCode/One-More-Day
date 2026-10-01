import { applyEffects } from '../core/state.js';

export function placeBet(state, amount, { random = Math.random } = {}) {
  const stake = Number(amount);
  if (state.life.stage === 'school-finale' || state.life.ended || !Number.isSafeInteger(stake) || stake < 1 || stake > state.finances.cash || !Number.isSafeInteger(stake * 30 + state.finances.cash)) {
    return { state, ok: false, reason: 'Enter a whole-rand amount between R1 and your available cash.' };
  }
  let next = applyEffects(state, { cash: -stake }, { source: 'betway-stake' }).state;
  const jackpot = random() < 0.02;
  const payout = jackpot ? stake * 30 : 0;
  if (payout) next = applyEffects(next, { cash: payout }, { source: 'betway-jackpot' }).state;
  next.betting.lastResult = { stake, jackpot, payout, day: next.calendar.day };
  next.betting.totalStaked += stake;
  next.betting.totalPaid += payout;
  next.betting.rounds += 1;
  return { state: next, ok: true };
}
