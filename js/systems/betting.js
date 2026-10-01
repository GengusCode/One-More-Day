import { applyEffects } from '../core/state.js';

export function beginBet(state, amount, { random = Math.random } = {}) {
  const stake = Number(amount);
  if (state.betting.pendingResult || state.life.stage === 'school-finale' || state.life.ended || !Number.isSafeInteger(stake) || stake < 1 || stake > state.finances.cash || !Number.isSafeInteger(stake * 118 + state.finances.cash)) {
    return { state, ok: false, reason: 'Enter a whole-rand amount between R1 and your available cash.' };
  }
  let next = applyEffects(state, { cash: -stake }, { source: 'betway-stake' }).state;
  // Fixed custom slot table: 70% loss, 15% refund, 10% 3x, 4.9% 8x, 0.1% 118x.
  // Weighted gross return = .15 + .30 + .392 + .118 = .96 per rand staked.
  const roll = random();
  const multiplier = roll < .001 ? 118 : roll < .05 ? 8 : roll < .15 ? 3 : roll < .30 ? 1 : 0;
  const jackpot = multiplier === 118;
  const payout = stake * multiplier;
  const symbols = ['🍒', '🍋', '🔔', '💎', '7️⃣'];
  const index = Math.min(symbols.length - 1, Math.floor(random() * symbols.length));
  const symbol = jackpot ? '7️⃣' : multiplier === 8 ? '💎' : multiplier === 3 ? '🔔' : '🍒';
  const reels = multiplier ? [symbol, symbol, symbol] : [symbols[index], symbols[(index + 1) % symbols.length], symbols[(index + 3) % symbols.length]];
  next.betting.pendingResult = { stake, jackpot, payout, multiplier, reels, day: next.calendar.day };
  next.betting.totalStaked += stake;
  next.betting.rounds += 1;
  return { state: next, ok: true };
}

export function completeBet(state) {
  const result=state.betting.pendingResult;
  if(!result) return {state,ok:false};
  let next=structuredClone(state);
  next.betting.pendingResult=null;
  if(result.payout) next=applyEffects(next,{cash:result.payout},{source:result.jackpot?'betway-jackpot':'betway-win'}).state;
  next.betting.lastResult=result;
  next.betting.totalPaid+=result.payout;
  return {state:next,ok:true};
}

export function placeBet(state,amount,options={}) {
  const started=beginBet(state,amount,options);
  return started.ok ? completeBet(started.state) : started;
}
