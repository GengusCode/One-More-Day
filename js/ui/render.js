import { formatRand } from "../data/economy.js";
import { validateName } from "../core/state.js";
import { BUSINESS_UPGRADES } from "../systems/business.js";
import { buildPhoneModel, renderPhone } from "./phone.js";
import {canStayHomeToday} from '../systems/day.js';
import {buildMoneyReport} from './money-ledger.js';
import {patchChildren} from './dom-patch.js';

const GENDER_IDS = new Set(["man", "woman", "non-binary"]);
const STAT_ICONS = {energy:'⚡',health:'❤️',happiness:'☀️',knowledge:'🧠',social:'💬',reputation:'⭐',luck:'🍀'};

export function showStatChanges(root, previous, current) {
  if (!previous || !root.ownerDocument?.createElement) return;
  for (const key of Object.keys(STAT_ICONS)) {
    const delta = Number(current[key])-Number(previous[key]);
    const target = root.querySelector(`[data-stat-feedback="${key}"]`);
    if (!target || !Number.isFinite(delta) || !delta) continue;
    const popup = root.ownerDocument.createElement('span');
    popup.className = `stat-change ${delta>0?'stat-change--gain':'stat-change--loss'}`;
    popup.textContent = `${delta>0?'+':''}${delta}`;
    target.appendChild(popup);
    const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const animation = popup.animate?.(reduced ? [{opacity:1},{opacity:0}] : [
      {opacity:0,transform:'translateY(-16px) scale(1.3)'},
      {opacity:1,transform:'translateY(-12px) scale(1.15)',offset:.25},
      {opacity:0,transform:'translateY(0) scale(.45)'}
    ],{duration:reduced?700:1400,easing:'ease-out'});
    if(animation) animation.onfinish=()=>popup.remove();
    else setTimeout(()=>popup.remove(),1400);
  }
}

export function groupSkipHistory(rows,kind) {
  const groups=new Map();
  for(const row of rows) {
    const key=JSON.stringify(kind==='choices'?[row.title,row.choice,row.result]:[row.reason,row.text]);
    const group=groups.get(key);
    if(group) {group.count++;group.firstDay=Math.min(group.firstDay,row.day);group.lastDay=Math.max(group.lastDay,row.day);}
    else groups.set(key,{...row,count:1,firstDay:row.day,lastDay:row.day});
  }
  return [...groups.values()].sort((a,b)=>b.lastDay-a.lastDay);
}

function groupedHistoryMarkup(rows,kind) {
  return groupSkipHistory(rows,kind).map(row=>`<details class="skip-history-group"><summary><strong>${escapeText(kind==='choices'?row.title:row.reason.replaceAll('-',' '))}</strong><b>×${row.count}</b><small>${row.firstDay===row.lastDay?'Day '+row.firstDay:'Days '+row.firstDay+'–'+row.lastDay}</small></summary>${kind==='choices'?`<p>Chose: ${escapeText(row.choice)}</p><p>${escapeText(row.result)}</p>`:`<p>${escapeText(row.text)}</p>`}</details>`).join('');
}

function skipSummaryMarkup(state) {
  const summary=state.timeline.lastSummary;
  if(!summary?.before || summary.endDay!==state.calendar.day) return '';
  const rows=[['Age',summary.before.age,summary.after.age],['Cash',formatRand(summary.before.cash),formatRand(summary.after.cash)],
    ...Object.keys(STAT_ICONS).filter(key=>summary.before.stats[key]!==summary.after.stats[key]).map(key=>[key.toUpperCase(),`${summary.before.stats[key]}%`,`${summary.after.stats[key]}%`])];
  const automatic=summary.automaticChoices || [];
  const milestones=summary.milestones || [];
  const label=summary.stoppedEarly ? `${summary.daysAdvanced} days passed` : summary.requestedDays===365 ? "One year later" : summary.requestedDays===30 ? "One month later" : "One week later";
  return `<section class="skip-summary" aria-label="Time passed"><h3>⏩ ${label}</h3><p>Decisions were handled automatically while work, bills and daily life continued.${summary.reason?' Paused for: '+escapeText(summary.reason.replaceAll('-',' '))+'. '+Number(summary.remainingDays || 0)+' days remain in the requested period.':''}</p>${rows.map(([label,before,after])=>`<div class="money-row"><span>${escapeText(label)}</span><strong>${escapeText(before)} → ${escapeText(after)}</strong></div>`).join('')}${milestones.length?`<details class="skip-choices"><summary>${milestones.length} milestones & follow-ups</summary>${groupedHistoryMarkup(milestones,'milestones')}</details>`:''}${automatic.length?`<details class="skip-choices"><summary>${automatic.length} routine choices handled automatically</summary>${groupedHistoryMarkup(automatic,'choices')}</details>`:''}</section>`;
}

export function escapeText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function buildSetupModel({ name = "", gender = "", hasSave = false } = {}) {
  const validation = validateName(name);
  const hasGender = GENDER_IDS.has(gender);
  return {
    name, gender, hasSave,
    canStart: validation.ok && hasGender,
    error: !validation.ok ? validation.error : !hasGender ? "Choose a gender to shape your character." : "",
  };
}

export function buildGameViewModel(state) {
  return {
    playerName: state.profile.name,
    hud: {
      day: state.calendar.day,
      age: state.calendar.age,
      cash: formatRand(state.finances.cash),
      energy: state.stats.energy,
      health: state.stats.health,
      happiness: state.stats.happiness,
      knowledge: state.stats.knowledge,
      social: state.stats.social,
      reputation: state.stats.reputation,
      luck: state.stats.luck ?? 50,
    },
  };
}

function relationshipSummary(state) {
  const people = Object.values(state.relationships.people || {});
  if (!people.length) return "The people in your life will appear here.";
  return people.map((person) => person.name + " · " + person.score).join(" • ");
}

export function getSecondaryPanels(state) {
  const open = new Set(state.settings.openPanels || []);
  const workSummary = state.career.active
    ? (state.career.role || "Corporate career") + " · Performance " + state.career.performance
    : state.business.active
      ? (state.business.title || "Solo Owner") + " · Trust " + state.business.trust
      : "Choose a path to begin earning.";
  const transport = state.transport.owned.length ? state.transport.owned.join(" • ") : "Taxi available · No transport owned";
  return [
    { id: "wellbeing", label: "Wellbeing", summary: "Health, happiness and growth", expanded: open.has("wellbeing"), content: [
      ["Health", state.stats.health], ["Knowledge", state.stats.knowledge], ["Social", state.stats.social],
      ["Happiness", state.stats.happiness], ["Reputation", state.stats.reputation], ["Net worth", formatRand(state.finances.netWorth)],
    ] },
    {
      id: "career-business", label: "Work & business", summary: workSummary, expanded: open.has("career-business"),
      content: state.business.active ? [
        ["Status", state.business.title], ["Customer trust", state.business.trust],
        ["Capacity", state.business.capacity], ["Team", state.business.staff.length + " people"],
      ] : [["Status", workSummary], ["Warnings", state.career.warnings.length + " written · " + state.career.verbalWarnings.length + " verbal"]],
      actions: state.business.active ? [
        ...Object.entries(BUSINESS_UPGRADES)
          .filter(([id, upgrade]) => upgrade.businessId === state.business.id && !state.assets.ownedUpgradeIds.includes(id))
          .map(([id, upgrade]) => ({
            id, action: "BUY_UPGRADE", label: "Buy " + upgrade.name, detail: formatRand(upgrade.cost), disabled: state.finances.cash < upgrade.cost,
          })),
        { id: "helper", action: "HIRE_EMPLOYEE", label: "Hire a helper", detail: "Adds capacity; R80 daily wage" },
      ] : [],
    },
    { id: "relationships", label: "Relationships", summary: Object.keys(state.relationships.people || {}).length + " people", expanded: open.has("relationships"), content: [["Your circle", relationshipSummary(state)]] },
    {
      id: "transport-assets", label: "Transport & assets", summary: transport, expanded: open.has("transport-assets"), content: [
        ["Available", transport],
        ["Car assignment", state.transport.dailyAssignment?.mode === "driver" ? "E-hailing driver working today" : "Available for you"],
      ],
      actions: [
        ...(!state.transport.owned.includes("bicycle") ? [{
          id: "bicycle", action: "BUY_ASSET", label: "Buy a bicycle", detail: formatRand(900), disabled: state.finances.cash < 900,
        }] : []),
        ...(!state.transport.owned.includes("car") ? [{
          id: "car", action: "BUY_ASSET", label: "Buy a used car", detail: formatRand(18_000), disabled: state.finances.cash < 18_000,
        }] : []),
        ...(state.transport.owned.includes("car") && state.transport.dailyAssignment?.mode !== "driver" ? [{
          id: "driver", action: "ASSIGN_DRIVER", label: "Let a driver use your car today", detail: "Earn R220–R450; you cannot drive it today",
        }] : []),
      ],
    },
  ];
}

function renderCover() {
  return `
    <section class="cover" aria-labelledby="cover-title">
      <div class="cover__photo" aria-hidden="true"></div>
      <div class="cover__flag" aria-hidden="true"></div>
      <div class="cover__shade" aria-hidden="true"></div>
      <div class="cover__copy">
        <p class="cover__kicker">LIFE · MONEY · MAYHEM</p>
        <h1 id="cover-title" class="cover__title"><span>ONE</span><span>MORE</span><span>DAY</span></h1>
        <p class="cover__edition">SA EDITION</p>
        <p class="cover__line">Your life. Your choices. Your next big move.</p>
        <div class="cover__play-hooks" aria-label="Life, money and choices"><span>💸 Make moves</span><span>⚡ Face the chaos</span><span>🎲 Change your future</span></div>
      </div>
    </section>`;
}

function setupMarkup(model, message) {
  const gender = model.gender;
  return `
    <div class="start-layout">
      ${renderCover()}
      <section class="setup-card" aria-labelledby="new-life-title">
        <p class="eyebrow">PLAYER ONE · THAT’S YOU</p>
        <h2 id="new-life-title">Start a new life</h2>
        <p class="setup-card__intro">Make money. Handle the unexpected. Live with your choices.</p>
        <form id="newLifeForm" novalidate>
          <label class="field-label" for="playerName">What should we call you?</label>
          <input id="playerName" name="playerName" type="text" value="${escapeText(model.name)}" maxlength="24"
            autocomplete="given-name" aria-describedby="nameHelp setupError" placeholder="e.g. Anele, Fatima, Liam or Priya">
          <p id="nameHelp" class="field-help">2–24 letters; spaces, apostrophes and hyphens are welcome.</p>
          <fieldset class="gender-field"><legend>Choose your character</legend><div class="gender-options">
            <label class="gender-chip"><input type="radio" name="gender" value="man" ${gender === "man" ? "checked" : ""}><span>Man</span></label>
            <label class="gender-chip"><input type="radio" name="gender" value="woman" ${gender === "woman" ? "checked" : ""}><span>Woman</span></label>
            <label class="gender-chip"><input type="radio" name="gender" value="non-binary" ${gender === "non-binary" ? "checked" : ""}><span>Non-binary</span></label>
          </div></fieldset>
          <p id="setupError" class="form-error" aria-live="polite" tabindex="-1"></p>
          <button class="button button--primary button--wide" type="submit" data-action="START_LIFE" ${model.canStart ? "" : "disabled"}>START LIFE <span aria-hidden="true">→</span></button>
          ${model.hasSave ? `<button class="button button--quiet button--wide" type="button" data-action="CONTINUE_LIFE">Continue saved life</button>` : ""}
        </form>
        <p class="save-note">Progress saves automatically on this device.</p>
        ${message ? `<p class="notice" role="alert">${escapeText(message)}</p>` : ""}
      </section>
    </div>`;
}

function statRows(items) {
  return items.map(([label, value]) => `<div class="detail-row"><span>${escapeText(label)}</span><strong>${escapeText(value)}</strong></div>`).join("");
}

function panelMarkup(panel) {
  const regionId = "panel-" + panel.id;
  return `
    <section class="expandable">
      <button class="expandable__toggle" type="button" data-action="TOGGLE_PANEL" data-panel="${panel.id}"
        aria-expanded="${panel.expanded}" aria-controls="${regionId}">
        <span><strong>${escapeText(panel.label)}</strong><small>${escapeText(panel.summary)}</small></span>
        <span class="chevron" aria-hidden="true">⌄</span>
      </button>
      <div id="${regionId}" class="expandable__body" ${panel.expanded ? "" : "hidden"}>${statRows(panel.content)}
        ${(panel.actions || []).map((action) => `<button class="panel-action" type="button" data-action="${escapeText(action.action)}" data-choice="${escapeText(action.id)}" ${action.disabled ? "disabled" : ""}><span>${escapeText(action.label)}</span><small>${escapeText(action.detail || "")}</small></button>`).join("")}
      </div>
    </section>`;
}

function eventMarkup(event) {
  const safeEvent = event || {
    icon: "☀", kicker: "DAY ONE", title: "Your first move is waiting",
    text: "Choose a path and your ordinary days will begin settling automatically.", choices: [],
  };
  const choices = (safeEvent.choices || []).map((choice) => `
    <button class="decision" type="button"
      data-action="${escapeText(choice.action || "CHOOSE_EVENT")}" data-choice="${escapeText(choice.id)}" ${choice.disabled ? "disabled" : ""}>
      <span>${escapeText(choice.label)}</span>${choice.detail ? `<small>${escapeText(choice.detail)}</small>` : ""}
    </button>`).join("");
  return `
    <article class="event-card" aria-labelledby="today-title">
      <div class="event-card__top"><span class="event-card__icon" aria-hidden="true">${escapeText(safeEvent.icon || "◆")}</span><p>${escapeText(safeEvent.kicker || "TODAY")}</p></div>
      <h2 id="today-title">${escapeText(safeEvent.title)}</h2>
      <p class="event-card__text">${escapeText(safeEvent.text)}</p>
      ${safeEvent.timerSeconds !== undefined ? `<div class="exam-timer" role="timer" aria-label="Time left for this question"><span>TIME LEFT</span><strong data-exam-clock>${safeEvent.timerSeconds}s</strong></div>` : ""}
      ${safeEvent.result && safeEvent.result!==safeEvent.text ? `<div class="result" aria-live="polite"><strong class="section-label">PREVIOUS CHOICE & OUTCOME</strong>${escapeText(safeEvent.result)}</div>` : ""}
      <div class="decision-grid">${choices}</div>
    </article>`;
}

function endingMarkup(summary) {
  return `
    <article class="event-card ending-card" aria-labelledby="today-title">
      <div class="event-card__top"><span class="event-card__icon" aria-hidden="true">🌅</span><p>A LIFE REMEMBERED</p></div>
      <h2 id="today-title">${escapeText(summary.name)} · age ${escapeText(summary.age)}</h2>
      <p class="event-card__text">${escapeText(summary.closingLine)}</p>
      <div class="ending-grid">
        <div><span>Days lived</span><strong>${escapeText(summary.daysLived)}</strong></div>
        <div><span>Life's work</span><strong>${escapeText(summary.work)}</strong></div>
        <div><span>Closest person</span><strong>${escapeText(summary.closestPerson)}</strong></div>
        <div><span>Net worth</span><strong>${formatRand(summary.netWorth)}</strong></div>
      </div>
      <p class="ending-achievement">🏆 ${escapeText(summary.achievement)}</p>
      <button class="button button--primary button--wide" type="button" data-action="RESET_LIFE">BEGIN A NEW LIFE →</button>
    </article>`;
}

function gameMarkup(state, context) {
  const view = buildGameViewModel(state);
  const phoneModel = buildPhoneModel(state, { slotsSpinning: context.slotsSpinning });
  const phoneOpen = context.phoneOpen ?? state.settings.phone?.open ?? false;
  const phoneApp = context.phoneApp ?? state.settings.phone?.app ?? "home";
  const phoneNotice=phoneModel.notifications.find(item=>item.text!==context.event?.text && item.text!==context.event?.result);
  const visibleUpdates=(state.dailyState.updates || []).filter(text=>text!==context.event?.text && text!==context.event?.result);
  return `
    <div class="game-shell">
      <header class="game-header"><div><p class="eyebrow">ONE MORE DAY · SA EDITION</p><p class="welcome">Sharp, ${escapeText(view.playerName)}.</p></div>
        <button class="icon-button" type="button" data-action="RESET_LIFE" aria-label="Start a new life">↻</button></header>
      <section class="hud" aria-label="Current life">
        <div><span>DAY</span><strong>${view.hud.day}</strong></div><div><span>AGE</span><strong>${view.hud.age}</strong></div>
        <div class="hud__money"><span>CASH</span><strong id="cashBalance">${view.hud.cash}</strong><div id="moneyFeedback" class="money-feedback" aria-live="polite"></div></div>
      </section>
      <section class="personal-stats" aria-label="Personal stats">
        ${Object.keys(STAT_ICONS).map((key) => `<div class="stat-tile stat-tile--${key}" data-stat="${key}"><span class="stat-icon" aria-hidden="true">${STAT_ICONS[key]}</span><span class="stat-name">${key.toUpperCase()}</span><div class="stat-meter" aria-hidden="true"><i style="width:${Math.max(0, Math.min(100, Number(view.hud[key]) || 0))}%"></i></div><strong class="stat-value">${view.hud[key]}%<span class="stat-feedback" id="statFeedback-${key}" data-stat-feedback="${key}"></span></strong></div>`).join("")}
      </section>
      <main class="play-column">${!state.life.ended && state.dailyState.dayPlan ? `<section class="day-plan" aria-label="Morning plan"><span>☀ MORNING</span><p>${escapeText(state.dailyState.dayPlan.morning)}</p>${canStayHomeToday(state) ? `<button class="stay-home-action" type="button" data-action="STAY_HOME_TODAY">Stay home today <small>${state.career.active ? "No shift pay · Attendance matters" : "Less business capacity today"}</small></button>` : ''}</section>` : ''}${visibleUpdates.length ? `<section class="life-news" aria-label="Today’s news">${visibleUpdates.slice(0,3).map(text=>`<p>${escapeText(text)}</p>`).join("")}</section>` : ""}${state.life.ended ? endingMarkup(state.life.endingSummary) : eventMarkup(context.event)}
        ${skipSummaryMarkup(state)}
        ${state.life.stage==='school-finale' || state.life.ended ? '' : moneyReportMarkup(state)}
        ${state.life.ended ? "" : `<button class="button button--primary button--wide next-day" type="button" data-action="NEXT_DAY" ${context.canAdvance ? "" : "disabled"}>${escapeText(context.nextLabel || "FINISH TODAY FIRST")}</button>
        <button class="phone-launch" type="button" data-action="OPEN_PHONE" aria-haspopup="dialog"><span aria-hidden="true">📱</span><strong>PHONE</strong><small>${phoneNotice ? escapeText(phoneNotice.text) : "Apps, people & plans"}</small></button>`}
      </main>
      ${state.life.ended ? "" : renderPhone({ ...phoneModel, greeting: `Sharp, ${view.playerName}` }, { open: phoneOpen, activeApp: phoneApp })}
      <p class="app-error" role="alert">${escapeText(context.error || "")}</p>
      <p class="sr-only" id="appStatus" aria-live="polite">${escapeText(context.announcement || "")}</p>
    </div>`;
}

export function moneyReportMarkup(state,{recent=false}={}) {
  const report=buildMoneyReport(state,{recent});
  const groups=[{label:'Money in',positive:true},{label:'Money out',positive:false}];
  return `<section class="money-report" aria-label="${recent?'Recent money movements':'Today’s money'}" data-card-id="money-report-${state.calendar.day}"><h3>${recent?'Recent money movements':'Today’s money'}</h3><div class="money-totals"><span>IN <strong>+${formatRand(report.moneyIn)}</strong></span><span>OUT <strong>−${formatRand(report.moneyOut)}</strong></span><span>NET <strong>${formatRand(report.net)}</strong></span></div><details><summary>See where it came from and went</summary>${groups.map(group=>`<div class="money-group"><h4>${group.label}</h4>${report.rows.filter(row=>(row.amount>0)===group.positive).map(row=>`<div class="money-row"><span>${recent?'Day '+row.day+' · ':''}${escapeText(row.label)}</span><strong class="${row.amount>0?'money-in':'money-out'}">${row.amount>0?'+':'−'}${formatRand(Math.abs(row.amount))}</strong></div>`).join('') || '<p>No movements recorded.</p>'}</div>`).join('')}</details>${state.finances.cash<0?'<p class="money-debt">Your negative balance is money you owe.</p>':''}</section>`;
}

export function createRenderer({ root, dispatch }) {
  let draft = { name: "", gender: "" };
  let currentContext = {};
  let destroyed = false;
  let previousStats = null;
  const updateSetupValidity = (showErrors = false) => {
    const form = root.querySelector("#newLifeForm");
    if (!form) return;
    draft = { name: form.elements.playerName.value, gender: form.elements.gender.value };
    const model = buildSetupModel({ ...draft, hasSave: currentContext.hasSave });
    form.querySelector('[data-action="START_LIFE"]').disabled = !model.canStart;
    form.querySelector("#setupError").textContent = showErrors ? model.error : "";
  };
  const onInput = (event) => { if (event.target.closest("#newLifeForm")) updateSetupValidity(); };
  const onClick = (event) => {
    const button = event.target.closest("[data-action]");
    if (!button || !root.contains(button) || button.disabled) return;
    const action = button.dataset.action;
    if (action === "START_LIFE") return;
    dispatch(action, {
      id: button.dataset.choice || "",
      panel: button.dataset.panel || "",
      app: button.dataset.app || "",
      programmeId: button.dataset.programmeId || "",
      fundingId: button.dataset.fundingId || "",
    });
  };
  const onSubmit = (event) => {
    if (event.target.dataset.form === "betway") {
      event.preventDefault();
      dispatch("PLACE_BET", { amount: event.target.elements.betAmount.value });
      return;
    }
    if (event.target.id !== "newLifeForm") return;
    event.preventDefault();
    updateSetupValidity(true);
    const model = buildSetupModel({ ...draft, hasSave: currentContext.hasSave });
    if (model.canStart) dispatch("START_LIFE", { ...draft });
  };
  root.addEventListener("input", onInput);
  root.addEventListener("change", onInput);
  root.addEventListener("click", onClick);
  root.addEventListener("submit", onSubmit);
  return {
    render(state, context = {}) {
      if (destroyed) return;
      currentContext = context;
      if (context.screen === "setup") {
        previousStats = null;
        draft = { name: context.draftName || "", gender: context.draftGender || "" };
        root.innerHTML = setupMarkup(
          buildSetupModel({ ...draft, hasSave: context.hasSave }),
          context.recoveryMessage || context.error || "",
        );
      } else {
        const markup=gameMarkup(state,context);
        if(root.querySelector('.game-shell') && root.ownerDocument?.createElement) {
          const template=root.ownerDocument.createElement('div');template.innerHTML=markup;
          patchChildren(root,template);
        } else root.innerHTML=markup;
        showStatChanges(root,previousStats,state.stats);
        previousStats={...state.stats};
      }
      if (context.focusTarget) root.querySelector?.(context.focusTarget)?.focus?.({ preventScroll: true });
    },
    announce(message) { const node = root.querySelector("#appStatus"); if (node) node.textContent = message; },
    stopSlotReel(index,symbol) {const reel=root.querySelector('.slot-reel--'+index);if(reel) {reel.innerHTML='<span>'+escapeText(symbol)+'</span>';reel.classList.add('slot-reel--stopped');}},
    openPanel(id) { dispatch("OPEN_PANEL", { panel: id }); },
    destroy() {
      destroyed = true;
      root.removeEventListener("input", onInput); root.removeEventListener("change", onInput);
      root.removeEventListener("click", onClick); root.removeEventListener("submit", onSubmit);
    },
  };
}
