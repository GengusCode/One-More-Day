import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createNewLife,createDefaultState,validateState} from '../js/core/state.js';
import {getSchoolDecision,chooseSchoolDecision} from '../js/systems/life.js';
import {choosePath,chooseEvent,resolveWork,startDay} from '../js/systems/day.js';
import {fastForward} from '../js/systems/timeline.js';
import {getAvailableJobs} from '../js/systems/jobs.js';
import * as exam from '../js/data/entrance-test.js';
import * as thief from '../js/minigames/tap-thief.js';
test('an eight-question test saves progress and scores real answers',()=>{
 let state=createNewLife({name:'Naledi',gender:'woman'});
 assert.equal(state.life.school.step,'entrance-test');
 for(let i=0;i<8;i++) {const question=getSchoolDecision(state);assert.equal(question.choices.length,4);const source=exam.ENTRANCE_QUESTIONS.find(q=>q.id===state.life.school.quiz.order[i]);state=chooseSchoolDecision(state,source.correct);if(i===3)state=validateState(state);}
 assert.equal(state.life.stage,'adult');assert.equal(state.life.examResult.score,100);assert.equal(state.stats.knowledge,85);assert.equal(state.finances.cash,1000);
 assert.equal(getAvailableJobs(state).find(j=>j.id==='office-trainee').eligible,true);
 assert.equal(chooseSchoolDecision(state,'a').finances.cash,1000);
});
test('failing the entrance test still offers practical opportunities',()=>{
 let state=createNewLife({name:'Thabo',gender:'man'});
 for(let i=0;i<8;i++){const question=exam.ENTRANCE_QUESTIONS.find(q=>q.id===state.life.school.quiz.order[i]);state=chooseSchoolDecision(state,question.choices.find(c=>c.id!==question.correct).id);}
 assert.equal(state.life.examResult.score,0);assert.equal(state.stats.knowledge,20);assert.equal(getAvailableJobs(state).some(j=>j.id==='office-trainee'),false);assert.ok(getAvailableJobs(state).some(j=>j.type==='business'&&j.eligible));
});
test('a headline decision finishes work rather than adding a second work choice',()=>{
 let state=choosePath(createDefaultState(),'office',{random:()=>0});state.dailyState.phase='headline';state.dailyState.activeEventId='friend-hard-day';
 state=chooseEvent(state,'friend-hard-day','listen-friend');assert.equal(state.dailyState.phase,'complete');assert.equal(state.finances.transactions.filter(tx=>tx.source==='salary').length,1);
});
test('a year can settle quickly while bills and income remain accounted for',()=>{
 let state=createDefaultState();state.finances.cash=50000;state.dailyState.phase='complete';state.dailyState.complete=true;
 const result=fastForward(state,365,{random:()=>.99});assert.ok(result.summary.daysAdvanced>300);assert.equal(result.state.calendar.age,19);assert.ok(result.state.finances.cash<50000);
});
test('the thief can be caught through eight distinct taps, with no farming one target',()=>{
 const model=thief.createTapThiefModel({seed:7});const first=model.target;
 thief.tapTarget(model,first);assert.equal(model.hits,1);assert.notEqual(model.target,first);thief.tapTarget(model,first);assert.equal(model.hits,1);
 while(!model.result)thief.tapTarget(model,model.target);
 assert.equal(model.result.outcome,'caught');assert.equal(model.hits,8);
});
test('the tap round ends when its timer expires',()=>{const model=thief.createTapThiefModel();thief.advanceTapThief(model,12000);assert.equal(model.result.outcome,'escaped');});
test('routine time skips include rest rather than draining a full year of happiness',()=>{let state=createDefaultState();state.finances.cash=50000;state.dailyState.phase='complete';state.dailyState.complete=true;const result=fastForward(state,365,{random:()=>.99});assert.ok(result.state.stats.happiness>=50);});
