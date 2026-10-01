import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createDefaultState,validateState} from '../js/core/state.js';
import {startCareer} from '../js/systems/career.js';
import {startBusiness,settleBusinessDay} from '../js/systems/business.js';
import {settleHouseholdDay} from '../js/systems/household.js';
import * as day from '../js/systems/day.js';
import * as betting from '../js/systems/betting.js';
const ledger=await import('../js/ui/money-ledger.js').catch(error=>{if(error.code==='ERR_MODULE_NOT_FOUND')return {};throw error;});
import {EVENTS} from '../js/data/events.js';

test('staying home replaces the work decision and avoids salary and commute charges',()=>{
  let s=day.startDay(startCareer(createDefaultState(),'office'),{random:()=>.5});
  const before=s.finances.cash,performance=s.career.performance;
  assert.equal(typeof day.stayHomeToday,'function');
  s=day.stayHomeToday(s,{random:()=>.5});
  assert.equal(s.dailyState.stayedHome,true);
  assert.equal(s.finances.cash,before);
  assert.ok(s.career.performance<performance);
  const event=EVENTS.find(e=>e.id===s.dailyState.activeEventId);
  assert.ok(['community','relationships','money'].includes(event.deck));
  const choice=day.getCurrentDecision(s).choices.find(c=>!(c.effects?.cash)) || day.getCurrentDecision(s).choices[0];
  s=day.chooseEvent(s,event.id,choice.id,{random:()=>.5});
  assert.equal(s.dailyState.phase,'complete');
  assert.ok(!s.finances.transactions.some(tx=>tx.source==='salary'||tx.source.startsWith('travel-')));
  assert.equal(day.stayHomeToday(s).finances.cash,s.finances.cash);
});

test('business income and household costs reconcile with the detailed ledger',()=>{
  assert.equal(typeof ledger.buildMoneyReport,'function');
  let s=startBusiness(createDefaultState(),'car-wash');s.finances.cash=1000;s.calendar.day=210;
  s.business.staff=[{id:'helper',wage:80}];
  s=settleBusinessDay(s,{random:()=>.5}).state;
  s=settleHouseholdDay(s);
  const report=ledger.buildMoneyReport(validateState(s));
  assert.equal(report.net,s.finances.cash-1000);
  assert.equal(report.moneyIn-report.moneyOut,report.net);
  for(const label of ['Customer sales','Supplies','Staff wages','Business overhead','Food','Electricity','Housing']) assert.ok(report.rows.some(row=>row.label===label),label);
});

test('spin debits the stake first and credits the saved outcome exactly once on completion',()=>{
  assert.equal(typeof betting.beginBet,'function');assert.equal(typeof betting.completeBet,'function');
  let s=createDefaultState();s.finances.cash=100;
  s=betting.beginBet(s,10,{random:()=>0}).state;
  assert.equal(s.finances.cash,90);assert.equal(s.betting.lastResult,null);
  assert.equal(betting.beginBet(s,10).ok,false);
  s=validateState(s);
  const finished=betting.completeBet(s);
  assert.equal(finished.state.finances.cash,1270);
  assert.equal(finished.state.betting.lastResult.payout,1180);
  assert.equal(betting.completeBet(finished.state).state.finances.cash,1270);
  assert.equal(finished.state.finances.transactions.filter(tx=>tx.source==='betway-jackpot').length,1);
});

test('zero-net business activity still shows sales and costs',()=>{
 let s=startBusiness(createDefaultState(),'car-wash');s.business.staff=[{id:'helper',wage:99}];
 const settled=settleBusinessDay(s,{random:()=>.5});assert.equal(settled.status.revenue,0);
 const report=ledger.buildMoneyReport(settled.state);
 assert.equal(report.moneyIn,145);assert.equal(report.moneyOut,145);
});

test('daily totals remain complete after the recent transaction history fills up',()=>{
 let s=createDefaultState();s.finances.cash=5000;
 for(let i=0;i<100;i++)s=betting.placeBet(s,1,{random:()=>.999}).state;
 s=validateState(s);
 assert.equal(ledger.buildMoneyReport(s).moneyOut,100);
 assert.equal(ledger.buildMoneyReport(s).net,-100);
});
