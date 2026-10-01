import { applyEffects } from '../core/state.js';

export function placeBet(state, amount, { random = Math.random } = {}) {
  const stake = Number(amount);
  if (state.life.stage === 'school-finale' || state.life.ended || !Number.isSafeInteger(stake) || stake < 1 || stake > state.finances.cash || !Number.isSafeInteger(stake * 30 + state.finances.cash)) {
    return { state, ok: false, reason: 'Enter a whole-rand amount between R1 and your available cash.' };
  }
  let next = applyEffects(state, { cash: -stake }, { source: 'betway-stake' }).state;
  const setting = random();
  const jackpotChance = 0.006 + setting * 0.012;
  const bigChance = 0.02 + setting * 0.015;
  const smallChance = 0.05 + setting * 0.04;
  const roll = random();
  const multiplier = roll < jackpotChance ? 30 : roll < jackpotChance + bigChance ? 5 : roll < jackpotChance + bigChance + smallChance ? 2 : 0;
  const jackpot = multiplier === 30;
  const payout = stake * multiplier;
  const symbols = ['🍒', '🍋', '🔔', '💎', '7️⃣'];
  const index = Math.min(symbols.length - 1, Math.floor(random() * symbols.length));
  const symbol = multiplier === 30 ? '7️⃣' : multiplier === 5 ? '💎' : '🍒';
  const reels = multiplier ? [symbol, symbol, symbol] : [symbols[index], symbols[(index + 1) % symbols.length], symbols[(index + 3) % symbols.length]];
  if (payout) next = applyEffects(next, { cash: payout }, { source: jackpot ? 'betway-jackpot' : 'betway-win' }).state;
  next.betting.lastResult = { stake, jackpot, payout, multiplier, reels, day: next.calendar.day };
  next.betting.totalStaked += stake;
  next.betting.totalPaid += payout;
  next.betting.rounds += 1;
  return { state: next, ok: true };
}
