import { beginBet, completeBet } from "./systems/betting.js";
import { contributeStokvel } from "./systems/household.js";
import {
  createDefaultState,
  createNewLife,
  loadGame,
  saveGame,
} from "./core/state.js";
import { isCompatiblePageVersion } from "./core/version.js";
import { createRenderer } from "./ui/render.js";
import { createMoneyFeedback } from "./ui/money-feedback.js";
import { buyBusinessVehicle, setVehicleParking, changeHome, selectPersonalVehicle } from "./systems/vehicles.js";
import { buyUpgrade, hireEmployee, expandBusiness } from "./systems/business.js";
import { buyTransportAsset, assignCarForDay } from "./systems/travel.js";
import { chooseSchoolDecision, expireEntranceQuestion } from "./systems/life.js";
import { applyForJob } from "./systems/jobs.js";
import { fastForward } from "./systems/timeline.js";
import {
  startDay,
  choosePath,
  chooseEvent,
  chooseTravel,
  resolveWork,
  advanceDay,
  canAdvanceDay,
  getCurrentDecision,
  stayHomeToday,
  resolveMinigame,
  resolveUnavailableMinigame,
} from "./systems/day.js";
import { start as startChase } from "./minigames/tap-thief.js";

const root = document.getElementById("app");
const loaded = loadGame(localStorage);
const pageVersion = document.documentElement.dataset.gameVersion;
const versionCompatible = isCompatiblePageVersion(pageVersion, loaded.state.schemaVersion);
let state = loaded.state;
let previousQuizIds = state.life.school.quiz?.order || state.settings.lastQuizIds || [];
let examTimer = 0;
let screen = "setup";
let committing = false;
let slotsSpinning = false;
let error = versionCompatible
  ? ""
  : "A game update is still loading. Refresh this page before making a choice.";
let moneyFeedback = null;
let moneyFeedbackHost = null;
let chaseLaunching = false;
const seenTransactions = new Set(state.finances.transactions.map((item) => item.id));

const renderer = createRenderer({ root, dispatch });

function render(extra = {}) {
  clearInterval(examTimer);
  renderer.render(state, {
    screen,
    slotsSpinning,
    hasSave: Boolean(state.profile.name),
    recoveryMessage: loaded.status === "corrupt" && screen === "setup" ? loaded.recoveryMessage : "",
    error,
    event: getCurrentDecision(state),
    canAdvance: canAdvanceDay(state),
    nextLabel: canAdvanceDay(state)
      ? "NEXT DAY →"
      : state.dailyState.phase === "path"
        ? "CHOOSE A PATH FIRST"
        : state.dailyState.phase === "minigame"
          ? "FINISH THE CHASE"
          : "FINISH TODAY FIRST",
    ...extra,
  });
  if (screen === "game") {
    const host = root.querySelector("#moneyFeedback");
    const balanceNode = root.querySelector("#cashBalance");
    if (host && balanceNode) {
      if(host!==moneyFeedbackHost) {
        moneyFeedback?.destroy();
        moneyFeedbackHost=host;
        moneyFeedback = createMoneyFeedback({
        host,
        balanceNode,
        reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
        });
      }
      state.finances.transactions.forEach((transaction) => {
        if (seenTransactions.has(transaction.id)) return;
        seenTransactions.add(transaction.id);
        if(transaction.amount) moneyFeedback.enqueue(transaction);
      });
    }
    maybeLaunchChase();
    if (state.life.stage === "school-finale" && state.life.school.step === "entrance-test") {
      examTimer = setInterval(() => {
        const left = Math.max(0, Math.ceil((state.life.school.quiz.deadline - Date.now()) / 1000));
        const clock = root.querySelector("[data-exam-clock]");
        if (clock) { clock.textContent = left + "s"; clock.classList.toggle("is-urgent", left <= 10); }
        if (left === 0) { clearInterval(examTimer); dispatch("EXAM_TIMEOUT"); }
      }, 250);
    }
  } else {moneyFeedback?.destroy();moneyFeedback=null;moneyFeedbackHost=null;}
}

function maybeLaunchChase() {
  const chase = state.dailyState.chase;
  if (
    chaseLaunching
    || state.dailyState.phase !== "minigame"
    || !chase
    || chase.status !== "pending"
  ) return;
  chaseLaunching = true;
  startChase({
    host: root,
    seed: chase.seed,
    profile: state.profile,
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
  }).then(async (result) => {
    chaseLaunching = false;
    await commit(resolveMinigame(state, result));
    render();
  }).catch((cause) => {
    console.error("Could not start the chase", cause);
    chaseLaunching = false;
    error = "The chase could not start, so the thief got away. Your day can continue.";
    commit(resolveUnavailableMinigame(state)).then(render);
  });
}

async function commit(nextState) {
  if (!versionCompatible) {
    error = "A game update is still loading. Refresh this page before making a choice.";
    return false;
  }
  committing = true;
  error = "";
  try {
    state = saveGame(nextState, localStorage);
    return true;
  } catch (cause) {
    console.error("Could not save ONE MORE DAY", cause);
    error = "Your choice could not be saved. Please try again.";
  } finally {
    committing = false;
  }
}

async function dispatch(action, payload = {}) {
  if (committing || slotsSpinning) return;
  if (!versionCompatible) {
    error = "A game update is still loading. Refresh this page before making a choice.";
    render();
    return;
  }
  if (action === "START_LIFE") {
    try {
      const next = createNewLife({ ...payload, previousQuizIds });
      previousQuizIds = next.life.school.quiz.order;
      await commit(startDay(next));
      if (!error) {
        seenTransactions.clear();
        screen = "game";
      }
    } catch (cause) {
      error = cause instanceof Error ? cause.message : "Check your name and character.";
    }
    render({ focusTarget: screen === "game" ? "#today-title" : "#setupError" });
    return;
  }
  if (action === "CONTINUE_LIFE") {
    if(state.betting.pendingResult) await commit(completeBet(state).state);
    if (state.dailyState.phase === "morning") await commit(startDay(state));
    screen = "game";
    render({ focusTarget: "#today-title" });
    return;
  }
  if (action === "RESET_LIFE") {
    if (!state.life.ended && !window.confirm("Start a new life? Your v0.9 progress on this device will be cleared.")) return;
    try {
      const fresh = createDefaultState();
      fresh.settings.lastQuizIds = previousQuizIds;
      state = saveGame(fresh, localStorage);
      seenTransactions.clear();
      screen = "setup";
      error = "";
      render({ focusTarget: "#playerName" });
    } catch (cause) {
      console.error("Could not clear ONE MORE DAY", cause);
      error = "Your saved life could not be cleared. Please try again.";
      render();
    }
    return;
  }
  if (["OPEN_PHONE", "CLOSE_PHONE", "OPEN_PHONE_APP"].includes(action)) {
    const next = structuredClone(state);
    if (action === "OPEN_PHONE") next.settings.phone = { open: true, app: "home" };
    if (action === "CLOSE_PHONE") next.settings.phone = { open: false, app: "home" };
    if (action === "OPEN_PHONE_APP") next.settings.phone = { open: true, app: payload.app || payload.id || "home" };
    await commit(next);
    render();
    return;
  }
  if (action === "EXAM_TIMEOUT") {
    await commit(expireEntranceQuestion(state));
    render({ focusTarget: "#today-title" });
    return;
  }
  if (action === "CHOOSE_SCHOOL") {
    await commit(chooseSchoolDecision(state, payload.id));
    render({ focusTarget: "#today-title" });
    return;
  }
  if (action === "APPLY_JOB") {
    const result = applyForJob(state, payload.id);
    if (!result.ok) error = result.reason || "That opportunity is not available.";
    else {
      const next = structuredClone(result.state);
      next.settings.phone = { open: false, app: "home" };
      await commit(next);
    }
    render({ focusTarget: "#today-title" });
    return;
  }
  if (action === "FAST_FORWARD") {
    const days = payload.id === "year" ? 365 : payload.id === "month" ? 30 : 7;
    const result = fastForward(state, days);
    if (result.summary.daysAdvanced === 0) error = result.summary.reason;
    else {
      const next = structuredClone(result.state);
      next.settings.phone = { open: false, app: "home" };
      await commit(next);
    }
    render({ focusTarget: "#today-title" });
    return;
  }
  if (action === "TOGGLE_PANEL" || action === "OPEN_PANEL") {
    const panels = new Set(state.settings.openPanels || []);
    if (action === "OPEN_PANEL") panels.add(payload.panel);
    else if (panels.has(payload.panel)) panels.delete(payload.panel);
    else panels.add(payload.panel);
    const next = structuredClone(state);
    next.settings.openPanels = [...panels];
    await commit(next);
    render();
    return;
  }
  if (action === "CHOOSE_PATH") {
    await commit(choosePath(state, payload.id));
    render({ focusTarget: "#today-title" });
    return;
  }
  if (action === "CHOOSE_EVENT") {
    await commit(chooseEvent(state, state.dailyState.activeEventId, payload.id));
    render({ focusTarget: "#today-title" });
    return;
  }
  if (action === "CHOOSE_TRAVEL") {
    await commit(chooseTravel(state, payload.id));
    render({ focusTarget: "#today-title" });
    return;
  }
  if(action==='STAY_HOME_TODAY') {
    await commit(stayHomeToday(state));
    render({focusTarget:'#today-title'});return;
  }
  if (action === "RESOLVE_WORK") {
    await commit(resolveWork(state, payload.id));
    render({ focusTarget: "#today-title" });
    return;
  }
  if (action === "PLACE_BET" || action === "BET_ALL") {
    const result = beginBet(state, action === "BET_ALL" ? state.finances.cash : payload.amount);
    if (!result.ok) { error = result.reason; render(); return; }
    slotsSpinning = true;
    const saved = await commit(result.state);
    if (!saved) { slotsSpinning=false;render(); return; }
    render();
    const outcome=state.betting.pendingResult;
    const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
    for(let index=0;index<3;index++) {
      await new Promise(resolve=>setTimeout(resolve,reduced?50:index===0?800:200));
      renderer.stopSlotReel(index,outcome.reels[index]);
    }
    await commit(completeBet(state).state);
    slotsSpinning = false;
    render();
    return;
  }
  if (action === "PAY_STOKVEL") {
    const result = contributeStokvel(state, payload.id === "partial" ? 80 : 180);
    if (!result.ok) error = "You cannot afford this contribution, or this month is already paid.";
    else await commit(result.state);
    render();
    return;
  }
  if (action === 'SET_VEHICLE_PARKING' || action === 'CHANGE_HOME' || action === 'SELECT_PERSONAL_VEHICLE') {
    const [vehicleId, location] = (payload.id || '').split(':');
    const result = action === 'CHANGE_HOME' ? changeHome(state, payload.id) : action === 'SELECT_PERSONAL_VEHICLE' ? selectPersonalVehicle(state, payload.id) : setVehicleParking(state, vehicleId, location);
    if (result.ok) await commit(result.state);
    else error = result.reason;
    render();
    return;
  }
  if (action === "BUY_BUSINESS_VEHICLE") {
    const result = buyBusinessVehicle(state, payload.id);
    if (!result.ok) error = "This purchase is unavailable or you cannot afford the upfront cost.";
    else await commit(result.state);
    render();
    return;
  }
  if (action === 'EXPAND_BUSINESS') {
    const result = expandBusiness(state);
    if (result.ok) await commit(result.state);
    else error = result.reason;
    render({announcement: result.ok ? 'Business expanded. Three more staff slots are available; operating overhead increases by R25.' : ''});
    return;
  }
  if (action === "BUY_UPGRADE") {
    const result = buyUpgrade(state, payload.id);
    if (!result.ok) error = "That upgrade is not available right now.";
    else await commit(result.state);
    render();
    return;
  }
  if (action === "HIRE_EMPLOYEE") {
    const result = hireEmployee(state, payload.id);
    if (!result.ok) error = result.reason === "staff-limit" ? "Your business has reached its staff limit. Buy equipment or open premises to expand." : result.reason === "manager-unavailable" ? "A manager needs commercial premises, at least three staff and a free staff slot. Only one manager is allowed." : "You cannot hire that person right now.";
    else await commit(result.state);
    render({announcement:result.ok?'Staff member hired. Their wages are charged on operating days.':''});
    return;
  }
  if (action === "BUY_ASSET") {
    const result = buyTransportAsset(state, payload.id);
    if (!result.ok) error = "You cannot buy that asset right now.";
    else await commit(result.state);
    render();
    return;
  }
  if (action === "ASSIGN_DRIVER") {
    const result = assignCarForDay(state, "driver");
    if (!result.ok) error = "Your car is not available for a driver today.";
    else await commit(result.state);
    render();
    return;
  }
  if (action === "NEXT_DAY" && canAdvanceDay(state)) {
    await commit(advanceDay(state));
    render({ focusTarget: "#today-title" });
  }
}

render();
