import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createNewLife,createDefaultState,validateState} from '../js/core/state.js';
import {ENTRANCE_QUESTIONS,createEntranceQuiz} from '../js/data/entrance-test.js';
import * as life from '../js/systems/life.js';
import {getAvailableJobs,applyForJob,resolveJobApplication,resolveInterview} from '../js/systems/jobs.js';
import {advanceDay} from '../js/systems/day.js';
import {scheduleChoiceConsequence,resolveDueEvents,describeConsequence} from '../js/systems/event-deck.js';
import {EVENTS,WORK_DECISIONS} from '../js/data/events.js';
test('new lives draw different eight-question sets from a bigger pool',()=>{
 assert.ok(ENTRANCE_QUESTIONS.length>=30);
 const first=createEntranceQuiz(()=>.2);const next=createEntranceQuiz(()=>.2,first.order);
 assert.equal(first.order.length,8);assert.equal(new Set(first.order).size,8);assert.equal(next.order.length,8);assert.equal(next.order.some(id=>first.order.includes(id)),false);
 const state=createNewLife({name:'Neo',gender:'man',previousQuizIds:first.order});assert.ok(state.life.school.quiz.order.every(id=>!first.order.includes(id)));
});
test('a saved timer expires and unanswered questions count as incorrect',()=>{
 let state=createNewLife({name:'Neo',gender:'man'});state.life.school.quiz.deadline=1000;
 state=validateState(state);state=life.expireEntranceQuestion(state,{now:1000});assert.equal(state.life.school.quiz.index,1);assert.equal(state.life.school.quiz.answers[0].correct,false);assert.equal(state.life.school.quiz.answers[0].answer,null);assert.equal(state.life.school.quiz.deadline,31000);
});
test('answers received after the deadline cannot earn marks',()=>{
 const state=createNewLife({name:'Neo',gender:'man'});state.life.school.quiz.deadline=1000;
 const question=ENTRANCE_QUESTIONS.find(q=>q.id===state.life.school.quiz.order[0]);
 const next=life.chooseSchoolDecision(state,question.correct,{now:1001});assert.equal(next.life.school.quiz.answers[0].correct,false);
});
test('low scores keep a practical path while stronger results improve career access',()=>{
 const low=createDefaultState();low.finances.cash=1000;low.life.examResult={score:0};low.stats.knowledge=20;
 const lowJobs=getAvailableJobs(low);assert.ok(lowJobs.length<=3);assert.ok(lowJobs.some(j=>j.type==='business'&&j.eligible));
 const high=structuredClone(low);high.life.examResult.score=100;high.stats.knowledge=85;
 const highJobs=getAvailableJobs(high,{limit:20});const highOpening=highJobs.find(j=>j.type==='career'&&j.eligible);assert.ok(highOpening);
 const highApplied=applyForJob(high,highOpening.id);const invitation=resolveJobApplication(highApplied.state,highApplied.applicationId);const highRole=resolveInterview(invitation.state,'show-examples',{random:()=>0});
 const lowOpening=lowJobs.find(j=>j.type==='business'&&j.eligible);const lowRole=applyForJob(low,lowOpening.id);
 assert.equal(highRole.status.accepted,true);assert.equal(lowRole.status,'accepted');assert.ok(highRole.state.career.salary>0);assert.equal(lowRole.state.business.active,true);
});
test('normal progression moves one day and consequence text explains the cause',()=>{
 const state=createDefaultState();state.dailyState.phase='complete';state.dailyState.complete=true;
 assert.equal(advanceDay(state).calendar.day,2);
 const choice=EVENTS.find(e=>e.id==='neighbour-school-run').choices.find(c=>c.id==='help-lift');
 const pending=scheduleChoiceConsequence(state,'neighbour-school-run',choice,()=>0);const due=resolveDueEvents(pending,6);const text=describeConsequence(due.primary);
 assert.match(text,/Because you chose/);assert.match(text,/Walk the children to school/);assert.match(text,/neighbour/);
});
test('most narrative choices have no immediate cash reward',()=>{
 const choices=[...EVENTS,...WORK_DECISIONS].flatMap(event=>event.choices.flatMap(choice=>[choice,...(choice.followUp?.choices||[])]));
 assert.ok(choices.filter(choice=>!(choice.effects?.cash>0)).length/choices.length>.75);
});
