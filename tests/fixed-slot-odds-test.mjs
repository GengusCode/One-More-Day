import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createDefaultState} from '../js/core/state.js';
import {beginBet,completeBet} from '../js/systems/betting.js';
test('fixed slot distribution returns 96 percent over all probability bins',()=>{
 const state=createDefaultState();state.finances.cash=100;
 let paid=0;const counts=new Map();
 for(let i=0;i<10000;i++) {const values=[(i+.5)/10000,.5];const result=beginBet(state,1,{random:()=>values.shift()??.5}).state.betting.pendingResult;paid+=result.payout;counts.set(result.multiplier,(counts.get(result.multiplier)||0)+1);}
 assert.deepEqual([...counts],[[118,10],[8,490],[3,1000],[1,1500],[0,7000]]);assert.equal(paid,9600);
});
test('luck does not change slot payouts and a saved result settles only once',()=>{
 const state=createDefaultState();state.finances.cash=100;
 for(const luck of [0,50,100]) {state.stats.luck=luck;const values=[.09,.5];const started=beginBet(state,10,{random:()=>values.shift()??.5});assert.equal(started.state.betting.pendingResult.payout,30);assert.equal(started.state.finances.cash,90);const finished=completeBet(started.state);assert.equal(finished.state.finances.cash,120);assert.equal(completeBet(finished.state).state.finances.cash,120);}
});
test('stake returns are labelled clearly and slot symbols have a payout guide',async()=>{
 const {buildPhoneModel,renderPhone}=await import('../js/ui/phone.js');
 const state=createDefaultState();state.finances.cash=100;
 const values=[.2,.5];const done=completeBet(beginBet(state,10,{random:()=>values.shift()??.5}).state).state;
 const html=renderPhone(buildPhoneModel(done),{open:true,activeApp:'betway'});
 assert.match(html,/Stake returned/);assert.match(html,/Symbol payouts/);assert.match(html,/118/);
});
