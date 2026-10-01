import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDefaultState, validateState, calculateNetWorth } from '../js/core/state.js';
import { startBusiness, settleBusinessDay } from '../js/systems/business.js';
import * as vehicles from '../js/systems/vehicles.js';
import { settleHouseholdDay } from '../js/systems/household.js';
import { buildPhoneModel, renderPhone } from '../js/ui/phone.js';
const owner = () => { const s=startBusiness(createDefaultState(),'moving-service'); s.finances.cash=30000;return s; };
test('illustrated purchases enforce cash, ownership and business eligibility',()=>{
 assert.equal(typeof vehicles.buyBusinessVehicle,'function');
 const s=owner();const bought=vehicles.buyBusinessVehicle(s,'fleet');
 assert.equal(bought.ok,true);assert.equal(bought.state.finances.cash,6000);
 assert.equal(vehicles.buyBusinessVehicle(bought.state,'fleet').ok,false);
 assert.equal(vehicles.buyBusinessVehicle({...s,finances:{...s.finances,cash:100}},'sports').ok,false);
 assert.equal(vehicles.buyBusinessVehicle(startBusiness(s,'car-wash'),'fleet').ok,false);
 assert.deepEqual(validateState(bought.state).garage,bought.state.garage);
});
test('fleet adds demand-dependent sales while running costs can exceed its benefit',()=>{
 const s=owner();const fleet=vehicles.buyBusinessVehicle(s,'fleet').state;
 const normal=settleBusinessDay(s,{random:()=>0.5});const expanded=settleBusinessDay(fleet,{random:()=>0.5});
 assert.ok(expanded.status.revenue>normal.status.revenue+80);
 fleet.business.trust=0;const quiet=settleBusinessDay(fleet,{random:()=>0});
 const bare=structuredClone(fleet);bare.garage.vehicles=[];
 assert.ok(quiet.status.revenue-settleBusinessDay(bare,{random:()=>0}).status.revenue<80);
});
test('finance survives saves, bills settle once and three missed payments repossess the car',()=>{
 let s=vehicles.buyBusinessVehicle(owner(),'sports').state;
 assert.equal(s.garage.vehicles[0].remaining,60000);
 assert.equal(calculateNetWorth(s),18000+500+54000-60000);
 s=validateState(s);s.finances.cash=0;
 for(const day of [31,61,91]) {s.calendar.day=day;s=settleHouseholdDay(s);}
 assert.equal(s.garage.vehicles[0].status,'repossessed');
 assert.equal(s.garage.vehicles[0].remaining,0);
 assert.match(s.garage.history.at(-1),/Because.*sports car.*repossessed/);
 assert.deepEqual(settleHouseholdDay(s),s);
});
test('affordable car payments preserve ownership and visual cards show benefits and costs',()=>{
 let s=vehicles.buyBusinessVehicle(owner(),'sports').state;s.calendar.day=31;
 s=settleHouseholdDay(s);assert.equal(s.garage.vehicles[0].remaining,58000);
 assert.equal(s.garage.vehicles[0].status,'owned');
 const html=renderPhone(buildPhoneModel(s),{open:true,activeApp:'business'});
 assert.match(html,/vehicle-art/);assert.match(html,/Your garage/);assert.match(html,/R2[,\s]000/);assert.match(html,/BUY_BUSINESS_VEHICLE/);
});
test('a time skip stops when the car is repossessed and preserves its explanation', async()=>{
 const {settleRoutineDay}=await import('../js/systems/day.js');
 let s=vehicles.buyBusinessVehicle(owner(),'sports').state;
 s.calendar.day=90;s.calendar.weekday=6;s.dailyState.phase='complete';s.dailyState.complete=true;
 s.finances.cash=-500;s.garage.vehicles[0].missed=2;s.garage.vehicles[0].nextPaymentDay=91;
 const result=settleRoutineDay(s,{random:()=>0.5});
 assert.equal(result.reason,'vehicle-repossessed');assert.equal(result.interrupted,true);
 assert.match(result.state.dailyState.result,/Because.*repossessed/);
});
