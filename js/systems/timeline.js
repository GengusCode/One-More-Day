import { settleRoutineDay, getCurrentDecision, chooseEvent, chooseTravel, resolveWork, resolveUnavailableMinigame } from "./day.js";

const clone = (value) => (
  typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value))
);

export function canFastForward(state, days) {
  if (![7, 30, 365].includes(Number(days))) return { ok: false, reason: "Choose one week, one month or one year." };
  if (state.life?.stage === "school-finale") return { ok: false, reason: "Finish school first." };
  if (state.life?.ended || state.life?.stage === "ended") return { ok: false, reason: "This life has ended." };
  if (state.dailyState?.phase !== "complete" || !state.dailyState?.complete) return { ok: false, reason: "Finish today first." };
  if (state.dailyState?.chase?.status === "pending") return { ok: false, reason: "Finish the chase first." };
  return { ok: true, reason: "" };
}

function compactSummary({ requestedDays, daysAdvanced, cashChange, reason }) {
  const items = [`${daysAdvanced} day${daysAdvanced === 1 ? "" : "s"} passed`];
  if (cashChange) items.push(`${cashChange > 0 ? "+" : "−"}R${Math.abs(cashChange).toLocaleString("en-ZA")}`);
  if (reason) items.push(reason.replaceAll("-", " "));
  return {
    requestedDays,
    daysAdvanced,
    cashChange,
    stoppedEarly: daysAdvanced < requestedDays,
    reason: reason || "",
    items: items.slice(0, 3),
  };
}

export function fastForward(state, days, { random = Math.random } = {}) {
  const requestedDays = Number(days);
  const allowed = canFastForward(state, requestedDays);
  if (!allowed.ok) return { state, summary: compactSummary({ requestedDays, daysAdvanced: 0, cashChange: 0, reason: allowed.reason }), interrupted: true };

  let next = clone(state);
  const startingCash = next.finances.cash;
  const before = {age:state.calendar.age,cash:startingCash,stats:clone(state.stats)};
  const driverMode = next.transport.dailyAssignment?.mode === "driver";
  let daysAdvanced = 0;
  let interruptionReason = "";
  const automaticChoices=[];
  const milestones=[];

  for (let index = 0; index < requestedDays; index += 1) {
    const upcomingDayId = `routine-day-${next.calendar.day + 1}`;
    if (next.timeline.settledDayIds.includes(upcomingDayId)) {
      interruptionReason = "already-settled";
      break;
    }
    const result = settleRoutineDay(next, { random, driverMode });
    next = result.state;
    daysAdvanced += 1;
    if(result.automaticChoice) automaticChoices.push(result.automaticChoice);
    for(const text of new Set(next.dailyState.updates || [])) milestones.push({day:next.calendar.day,reason:'follow-up',text});
    next.timeline.settledDayIds = [...next.timeline.settledDayIds, upcomingDayId].slice(-400);
    if (result.interrupted) {
      const text=next.dailyState.result || result.reason.replaceAll('-',' ');
      const existing=milestones.find(row=>row.day===next.calendar.day && row.text===text);
      if(existing) existing.reason=result.reason;
      else milestones.push({day:next.calendar.day,reason:result.reason,text});
      if(next.life.ended) {interruptionReason='life-ending';break;}
      // Finish the interrupted day through the same choice handlers as normal play.
      for(let step=0;!next.dailyState.complete && step<16;step++) {
        const phase=next.dailyState.phase;
        const decision=getCurrentDecision(next);
        const choices=(decision?.choices || []).filter(choice=>!choice.disabled);
        const cost=choice=>Math.max(0,-Number(choice.effects?.cash || 0));
        const affordable=choices.filter(choice=>cost(choice)<=Math.max(0,next.finances.cash));
        const selected=(affordable.length?affordable:choices).slice().sort((a,b)=>Number(Boolean(a.risk))-Number(Boolean(b.risk)) || cost(a)-cost(b))[0];
        if(phase==='minigame') next=resolveUnavailableMinigame(next);
        else if(phase==='travel') next=chooseTravel(next,selected?.id || 'stay-home');
        else if(phase==='headline'||phase==='follow-up') {
          if(!selected) throw Error('No available choice in skipped event');
          automaticChoices.push({day:next.calendar.day,title:decision.title,choice:selected.label,result:selected.result || ''});
          next=chooseEvent(next,next.dailyState.activeEventId,selected.id,{random});
        } else {
          if(phase==='path') {next=clone(next);next.dailyState.phase='work';}
          if(selected && phase==='work')automaticChoices.push({day:next.calendar.day,title:decision.title,choice:selected.label,result:selected.result || ''});
          next=resolveWork(next,phase==='work'?selected?.id || '':'',{random});
        }
      }
      if(!next.dailyState.complete && !next.life.ended) throw Error('Skipped day did not finish');
    }
  }

  const summary = compactSummary({
    requestedDays,
    daysAdvanced,
    cashChange: next.finances.cash - startingCash,
    reason: interruptionReason,
  });
  next.timeline.lastSummary = summary;
  Object.assign(summary,{before,after:{age:next.calendar.age,cash:next.finances.cash,stats:clone(next.stats)},endDay:next.calendar.day,remainingDays:requestedDays-daysAdvanced,automaticChoices,milestones});
  return { state: next, summary, interrupted: Boolean(interruptionReason) };
}
