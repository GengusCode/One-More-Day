import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDefaultState, validateState, saveGame, loadGame } from '../js/core/state.js';
import { startBusiness } from '../js/systems/business.js';
import { startCareer } from '../js/systems/career.js';
import { startDay, chooseEvent, getCurrentDecision, settleRoutineDay, advanceDay, resolveWork, resolveUnavailableMinigame } from '../js/systems/day.js';
import { EVENTS } from '../js/data/events.js';
import { createRenderer } from '../js/ui/render.js';

const adult = (day = 10, weekday = 2) => {
  const s = startBusiness(createDefaultState(), 'car-wash');
  s.calendar.day = day; s.calendar.weekday = weekday; s.profile.name = 'Neo';
  return s;
};

test('ordinary workdays centre on the active occupation', () => {
  const s = startDay(adult(), { random: () => .5 });
  assert.equal(s.dailyState.phase, 'work');
  assert.match(s.dailyState.dayPlan.morning, /customers/i);
  assert.equal(s.dailyState.dayPlan.kind, 'routine');
});

test('days off do not draw office or business problems', () => {
  const s = startDay(adult(12, 6), { random: () => .5 });
  const event = EVENTS.find(e => e.id === s.dailyState.activeEventId);
  assert.ok(event);
  assert.ok(!['owner', 'corporate', 'transport', 'chaos'].includes(event.deck));
  assert.equal(s.dailyState.dayPlan.kind, 'routine');
});

test('the same surprise roll favours good outcomes at high luck', () => {
  const low = adult(); low.stats.luck = 0;
  const high = adult(); high.stats.luck = 100;
  const roll = () => { let first = true; return () => { if (first) {first=false;return .03;} return .5; }; };
  const a = startDay(low, { random: roll() });
  const b = startDay(high, { random: roll() });
  assert.equal(a.dailyState.dayPlan.kind, 'surprise');
  assert.equal(b.dailyState.dayPlan.kind, 'surprise');
  assert.equal(a.dailyState.dayPlan.fortune, 'bad');
  assert.equal(b.dailyState.dayPlan.fortune, 'good');
});

test('surprises have a cooldown even if every random roll requests one', () => {
  let s = startDay(adult(), { random: () => .03 });
  s.calendar.day++; s.dailyState.phase = 'morning';
  s = startDay(s, { random: () => .03 });
  assert.equal(s.dailyState.dayPlan.kind, 'routine');
});

test('accepted customer work becomes a saved follow-up rather than an unrelated draw', () => {
  let s = adult(); s.dailyState.phase = 'headline';
  s.dailyState.activeEventId = 'customer-enquiry';
  s = chooseEvent(s, 'customer-enquiry', 'book-job', { random: () => .5 });
  assert.equal(s.dailyState.phase, 'complete');
  const memory = new Map();
  const storage = {setItem:(k,v)=>memory.set(k,v),getItem:k=>memory.get(k)??null};
  saveGame(s, storage); s = loadGame(storage).state;
  s.calendar.day = 13; s.calendar.weekday = 5; s.dailyState.phase = 'morning';
  s = startDay(s, { random: () => .99 });
  assert.equal(s.dailyState.activeEventId, 'customer-booked-job');
  assert.equal(s.dailyState.dayPlan.kind, 'follow-up');
  assert.match(getCurrentDecision(s).text, /Because.*booking/i);
});

test('declining a booking does not schedule a job that was never accepted', () => {
  let s = adult(); s.dailyState.phase = 'headline'; s.dailyState.activeEventId = 'customer-enquiry';
  s = chooseEvent(s, 'customer-enquiry', 'decline-job', { random: () => .5 });
  assert.equal(s.routine.pending.length, 0);
});

test('a time skip stops for a booked commitment before settling that day', () => {
  const s = adult(); s.dailyState.phase='complete';s.dailyState.complete=true;
  s.routine.pending=[{eventId:'customer-booked-job',dueDay:11,cause:'You accepted the booking.'}];
  const result = settleRoutineDay(s,{random:()=>.99});
  assert.equal(result.interrupted,true);
  assert.equal(result.reason,'planned-commitment');
  assert.equal(result.state.dailyState.activeEventId,'customer-booked-job');
  assert.ok(!result.state.dailyState.settledIds.includes('business-day-11'));
});

test('old saves get neutral luck and invalid follow-ups cannot break the day', () => {
  const raw = adult(); delete raw.stats.luck;
  raw.routine = { lastSurpriseDay: -100, pending: [{eventId:'missing',dueDay:1}] };
  const s = validateState(raw);
  assert.equal(s.stats.luck, 50);
  assert.doesNotThrow(() => startDay(s, { random: () => .5 }));
});

test('the screen shows a morning plan and an evening summary without extra decisions', () => {
  const root = { html:'', addEventListener(){}, removeEventListener(){}, querySelector(){return null;}, set innerHTML(v){this.html=v;} };
  const renderer = createRenderer({root,dispatch(){}});
  const s = startDay(startCareer(createDefaultState(), 'office'), {random:()=>.5});
  renderer.render(s,{screen:'game',event:getCurrentDecision(s),canAdvance:false});
  assert.match(root.html, /MORNING/);
  assert.match(root.html, /LUCK/);
  const count = getCurrentDecision(s).choices.length;
  assert.equal((root.html.match(/class="decision"/g)||[]).length,count);
});

test('four months stay playable, keep surprises rare, and retain the selected day on reload', () => {
  let seed=717;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  let s=adult(1,1);s.finances.cash=50000;s=startDay(s,{random});
  let surprises=0,followUps=0,oneChoiceDays=0;
  for(let day=0;day<120;day++) {
    if(s.dailyState.dayPlan.kind==='surprise') surprises++;
    if(s.dailyState.dayPlan.kind==='follow-up') followUps++;
    const restored=validateState(JSON.parse(JSON.stringify(s)));
    assert.deepEqual(getCurrentDecision(restored),getCurrentDecision(s));
    assert.equal(restored.stats.luck,s.stats.luck);
    s=restored;let choices=0;
    while(s.dailyState.phase!=='complete') {
      if(s.dailyState.phase==='minigame'){s=resolveUnavailableMinigame(s);continue;}
      const decision=getCurrentDecision(s);assert.ok(decision?.choices.length,'the day must not get stuck');
      const choice=decision.choices[0];
      s=s.dailyState.phase==='work'?resolveWork(s,choice.id,{random}):chooseEvent(s,s.dailyState.activeEventId,choice.id,{random});
      assert.ok(++choices<=2,'days remain short');
    }
    if(choices===1) oneChoiceDays++;
    s=advanceDay(s,{random});
  }
  assert.ok(surprises>0 && surprises<12);
  assert.ok(followUps>0);
  assert.ok(oneChoiceDays>100);
});
