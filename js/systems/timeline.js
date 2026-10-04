import { settleRoutineDay } from "./day.js";

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

  for (let index = 0; index < requestedDays; index += 1) {
    const upcomingDayId = `routine-day-${next.calendar.day + 1}`;
    if (next.timeline.settledDayIds.includes(upcomingDayId)) {
      interruptionReason = "already-settled";
      break;
    }
    const result = settleRoutineDay(next, { random, driverMode });
    next = result.state;
    daysAdvanced += 1;
    next.timeline.settledDayIds = [...next.timeline.settledDayIds, upcomingDayId].slice(-400);
    if (result.interrupted) {
      interruptionReason = result.reason;
      break;
    }
  }

  const summary = compactSummary({
    requestedDays,
    daysAdvanced,
    cashChange: next.finances.cash - startingCash,
    reason: interruptionReason,
  });
  next.timeline.lastSummary = summary;
  Object.assign(summary,{before,after:{age:next.calendar.age,cash:next.finances.cash,stats:clone(next.stats)},endDay:next.calendar.day});
  return { state: next, summary, interrupted: Boolean(interruptionReason) };
}
