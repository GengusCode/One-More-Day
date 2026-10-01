import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createDefaultState,validateState} from '../js/core/state.js';
import {startBusiness} from '../js/systems/business.js';
import * as vehicles from '../js/systems/vehicles.js';
import {getTravelOptions,resolveTravel,buyTransportAsset} from '../js/systems/travel.js';
import {settleHouseholdDay} from '../js/systems/household.js';
import {buildPhoneModel,renderPhone} from '../js/ui/phone.js';
const owner=()=>{const s=startBusiness(createDefaultState(),'moving-service');s.finances.cash=100000;return s;};
test('each van has a name and moving one home reduces delivery capacity',()=>{
 assert.equal(typeof vehicles.getVehicleInventory,'function');
 let s=vehicles.buyBusinessVehicle(owner(),'fleet').state;
 assert.equal(vehicles.getVehicleInventory(s).length,3);
 assert.ok(vehicles.getVehicleInventory(s).every(v=>v.location==='work'));
 const sales=vehicles.fleetSales(s,.5);
 const moved=vehicles.setVehicleParking(s,'fleet-1','home');assert.equal(moved.ok,true);s=moved.state;
 assert.equal(vehicles.fleetSales(s,.5),Math.round(sales*2/3));
 assert.equal(vehicles.setVehicleParking(s,'fleet-2','home').ok,false);
 assert.ok(getTravelOptions(s).some(v=>v.id==='fleet-1' && /Delivery van 1/.test(v.label)));
 assert.equal(resolveTravel(s,'fleet-2').status.invalid,true);
 const driven=resolveTravel(s,'fleet-1');assert.equal(driven.status.arrived,true);assert.ok(driven.state.finances.cash<s.finances.cash);
 const saved=validateState(s);assert.deepEqual(vehicles.getVehicleInventory(saved),vehicles.getVehicleInventory(s));
 for(const app of ['transport','business']) {const html=renderPhone(buildPhoneModel(saved),{open:true,activeApp:app});assert.match(html,/🚐 Delivery van 1/);assert.match(html,/SET_VEHICLE_PARKING/);}
});
test('larger homes enforce capacities and charge their declared housing costs',()=>{
 assert.equal(typeof vehicles.changeHome,'function');
 let s=vehicles.buyBusinessVehicle(owner(),'fleet').state;
 s=vehicles.changeHome(s,'small').state;assert.equal(vehicles.getHome(s).spaces,2);
 s=vehicles.setVehicleParking(s,'fleet-1','home').state;s=vehicles.setVehicleParking(s,'fleet-2','home').state;
 assert.equal(vehicles.changeHome(s,'starter').ok,false);
 assert.equal(vehicles.setVehicleParking(s,'fleet-3','home').ok,false);
 s=vehicles.changeHome(s,'large').state;assert.equal(vehicles.getHome(s).spaces,4);
 s=vehicles.setVehicleParking(s,'fleet-3','home').state;
 s.calendar.day=30;const before=s.finances.cash;const next=settleHouseholdDay(s);
 assert.equal(before-next.finances.cash,25+1800+80);
 assert.equal(vehicles.changeHome(s,'invalid').ok,false);
 assert.equal(vehicles.setVehicleParking(s,'missing','home').ok,false);
});
test('used cars and sports cars share parking capacity without duplicating ownership',()=>{
 assert.equal(typeof vehicles.getVehicleInventory,'function');
 let s=buyTransportAsset(owner(),'car').state;s=vehicles.buyBusinessVehicle(s,'sports').state;
 const inventory=vehicles.getVehicleInventory(s);assert.equal(inventory.length,2);assert.equal(inventory.filter(v=>v.location==='home').length,1);
 assert.ok(inventory.some(v=>v.name==='🏎️ Luxury sports car'));
 const saved=validateState(s);assert.equal(vehicles.getVehicleInventory(saved).length,2);
 assert.ok(getTravelOptions(saved).some(v=>v.id==='car'));
 saved.garage.vehicles[0].status='repossessed';assert.ok(!vehicles.getVehicleInventory(saved).some(v=>v.id==='sports'));
});
