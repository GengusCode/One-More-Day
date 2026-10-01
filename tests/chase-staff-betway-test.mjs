import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDefaultState, validateState } from '../js/core/state.js';
import * as betting from '../js/systems/betting.js';
import { startBusiness, hireEmployee, buyUpgrade } from '../js/systems/business.js';
import { createChaseModel, advanceChase, requestLaneMove, getChaseSnapshot } from '../js/minigames/chase-model.js';
import { buildPhoneModel, renderPhone } from '../js/ui/phone.js';
const adult = () => createDefaultState();
test('bets accept a custom affordable amount and cannot spend unavailable money', () => {
 const state=adult(); state.finances.cash=137;
 for (const amount of [0,-1,138,Infinity,NaN,'',1.5]) assert.equal(betting.placeBet(state,amount,{random:()=>0.5}).ok,false);
 const lost=betting.placeBet(state,'137',{random:()=>0.9});
 assert.equal(lost.state.finances.cash,0);
 assert.equal(lost.state.betting.lastResult.jackpot,false);
 assert.equal(state.finances.cash,137);
 assert.equal(betting.placeBet(lost.state,1).ok,false);
});
test('jackpots return 118 times the stake and survive saving',()=>{
 const state=adult(); state.finances.cash=100;
 const won=betting.placeBet(state,7,{random:()=>0.0005});
 assert.equal(won.state.finances.cash,919);
 assert.equal(won.state.betting.lastResult.payout,826);
 assert.equal(won.state.finances.transactions.length,2);
 const saved=validateState(won.state);
 assert.deepEqual(saved.betting,won.state.betting);
 assert.equal(saved.finances.cash,919);

});
test('staff limits depend on the business and equipment expands capacity',()=>{
 for (const [id,limit] of [['buy-resell',1],['car-wash',2],['moving-service',3]]) {
  let state=startBusiness(adult(),id);
  for(let i=0;i<limit;i++) {const hired=hireEmployee(state,'helper');assert.equal(hired.ok,true);state=hired.state;}
  const blocked=hireEmployee(state,'helper');assert.equal(blocked.ok,false);assert.equal(blocked.reason,'staff-limit');assert.equal(blocked.state.business.staff.length,limit);
 }
 let state=startBusiness(adult(),'buy-resell');state.finances.cash=2000;
 state=hireEmployee(state,'helper').state;
 state=buyUpgrade(state,'resell-shelves').state;
 assert.equal(hireEmployee(state,'helper').ok,true);
});
test('obstacles are visible well before collision and align with the runner when dangerous',()=>{
 const model=createChaseModel({sequence:[{id:'crate',type:'crate',lane:1,startMs:2100,clearMs:2800}]});
 advanceChase(model,600);
 assert.equal(getChaseSnapshot(model).visibleObstacles.length,1);
 assert.equal(getChaseSnapshot(model).activeObstacles.length,0);
 assert.equal(model.result,null);
 requestLaneMove(model,-1);advanceChase(model,230);advanceChase(model,1270);
 assert.equal(model.result,null);
 const snapshot=getChaseSnapshot(model);
 assert.equal(snapshot.activeObstacles.length,1);
 assert.equal(snapshot.visibleObstacles[0].depth,0.83);
 advanceChase(model,700);assert.equal(getChaseSnapshot(model).visibleObstacles.length,0);
});
test('Betway phone screen exposes a custom amount, all-in action and visible reels',()=>{
 const model=buildPhoneModel(adult());
 const screen=renderPhone(model,{open:true,activeApp:'betway'});
 assert.match(screen,/name="betAmount"/);
 assert.match(screen,/data-action="BET_ALL"/);
 assert.match(screen,/slot-reel/);
 const owner=startBusiness(adult(),'buy-resell');owner.business.staff=[{id:'one',wage:80}];
 assert.equal(buildPhoneModel(owner).apps.find(app=>app.id==='business').cards[0].actions.find(action=>action.action==='HIRE_EMPLOYEE').disabled,true);
});
test('collision checks use the same smooth lane position as the picture',()=>{
 const model=createChaseModel({sequence:[{id:'obstacle',lane:1,startMs:90,clearMs:200}]});
 requestLaneMove(model,-1);advanceChase(model,90);
 assert.equal(model.result?.reason,'collision');
});
