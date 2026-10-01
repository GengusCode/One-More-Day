import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDefaultState, validateState } from '../js/core/state.js';
import * as deck from '../js/systems/event-deck.js';
import { EVENTS, WORK_DECISIONS } from '../js/data/events.js';
import { chooseEvent } from '../js/systems/day.js';
import { placeBet } from '../js/systems/betting.js';
import { buildPhoneModel, renderPhone } from '../js/ui/phone.js';
test('a favour returns after a randomly chosen delay which survives saving',()=>{
 const state=createDefaultState();state.calendar.day=10;state.dailyState.phase='headline';state.dailyState.activeEventId='neighbour-school-run';
 const event=EVENTS.find(item=>item.id==='neighbour-school-run');assert.ok(event,'new community situation exists');
 const early=chooseEvent(state,event.id,'help-lift',{random:()=>0});
 const late=chooseEvent(state,event.id,'help-lift',{random:()=>0.999});
 assert.equal(early.delayedEvents[0].dueDay,15);assert.equal(late.delayedEvents[0].dueDay,28);
 const saved=validateState(early);const before=saved.stats.energy;
 assert.equal(deck.resolveDueEvents(saved,14).state.stats.energy,before);
 const due=deck.resolveDueEvents(saved,15);assert.equal(due.state.stats.energy,before+10);
 assert.match(due.primary.payload.result,/neighbour/i);
 assert.equal(deck.resolveDueEvents(due.state,16).state.stats.energy,before+10);
});
test('bad shortcuts lead to a later loss, rather than a free reward',()=>{
 const state=createDefaultState();state.dailyState.phase='headline';state.dailyState.activeEventId='borrowed-speaker';
 const chosen=chooseEvent(state,'borrowed-speaker','hide-damage',{random:()=>0});
 assert.equal(chosen.delayedEvents.length,1);
 const before=chosen.finances.cash;
 const due=deck.resolveDueEvents(chosen,chosen.delayedEvents[0].dueDay);
 assert.equal(due.state.finances.cash,before-160);
 assert.match(due.primary.payload.result,/speaker/);
});
test('new work situations offer different approaches with later consequences',()=>{
 for(const id of ['career-credit','career-training','owner-warranty','owner-referral']) {
  const event=WORK_DECISIONS.find(item=>item.id===id);assert.ok(event);assert.ok(event.choices.length>=3);
  assert.ok(event.choices.some(item=>item.delayed));
 }
});
test('slots have losing, small-win, big-win and jackpot reels',()=>{
 const state=createDefaultState();state.finances.cash=100;
 for(const [roll,payout,multiplier] of [[0,1180,118],[.03,80,8],[.09,30,3],[.2,10,1],[.9,0,0]]) {
  const values=[roll,.5];const result=placeBet(state,10,{random:()=>values.shift()??.5});
  assert.equal(result.state.betting.lastResult.payout,payout);assert.equal(result.state.betting.lastResult.multiplier,multiplier);
  assert.equal(result.state.finances.cash,90+payout);
  const reels=result.state.betting.lastResult.reels;assert.equal(reels.length,3);
  if(payout)assert.ok(reels.every(symbol=>symbol===reels[0]));else assert.ok(new Set(reels).size>1);
  assert.deepEqual(validateState(result.state).betting,result.state.betting);
 }
});
test('slots show reels and stake without displaying win probabilities',()=>{
 const html=renderPhone(buildPhoneModel(createDefaultState()),{open:true,activeApp:'betway'});
 assert.match(html,/slot-reel/);assert.match(html,/name="betAmount"/);assert.match(html,/Spin/);assert.doesNotMatch(html,/2%|98%|jackpot chance/);
});
test('uncertain loan repayment is chosen once, saved and not rerolled when due',()=>{
 const state=createDefaultState();state.dailyState.phase='headline';state.dailyState.activeEventId='friend-small-loan';
 const values=[0,.99];const chosen=chooseEvent(state,'friend-small-loan','lend-with-agreement',{random:()=>values.shift()??0});
 assert.equal(chosen.delayedEvents[0].payload.effects.cash,40);
 const saved=validateState(chosen);const before=saved.finances.cash;
 const due=deck.resolveDueEvents(saved,saved.delayedEvents[0].dueDay);
 assert.equal(due.state.finances.cash,before+40);assert.match(due.primary.payload.result,/only R40/);
});
test('spinning reels disable new wagers and keep the result hidden until they stop',()=>{
 const state=placeBet(createDefaultState(),10,{random:()=>0}).state;
 const phone=buildPhoneModel(state,{slotsSpinning:true});const card=phone.apps.find(app=>app.id==='betway').cards[0];
 assert.equal(card.bet.disabled,true);assert.ok(card.actions.every(action=>action.disabled));
 const html=renderPhone(phone,{open:true,activeApp:'betway'});assert.match(html,/slot-machine--spinning/);assert.doesNotMatch(html,/JACKPOT!/);
});
