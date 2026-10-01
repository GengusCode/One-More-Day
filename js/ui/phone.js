import { canBuyBusinessVehicle } from "../systems/vehicles.js";
import { stokvelMonth } from "../systems/household.js";
import { formatRand } from "../data/economy.js";
import { BUSINESS_UPGRADES, getStaffLimit } from "../systems/business.js";
import { getAvailableJobs } from "../systems/jobs.js";
import { canFastForward } from "../systems/timeline.js";

const APP_ORDER = Object.freeze(["jobs", "transport", "business", "people", "life", "time", "betway"]);

const APP_META = Object.freeze({
  betway: { title: "Betway", icon: "🎰", colour: "green" },
  jobs: { title: "Jobs", icon: "💼", colour: "sun" },
  transport: { title: "Transport", icon: "🚕", colour: "blue" },
  business: { title: "Business", icon: "🏪", colour: "green" },
  people: { title: "People", icon: "🫶", colour: "pink" },
  life: { title: "Life", icon: "✨", colour: "purple" },
  time: { title: "Time", icon: "⏩", colour: "orange" },
});

const safe = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

function action(id, actionName, label, detail = "", disabled = false) {
  return { id, action: actionName, label, detail, disabled };
}

function jobsApp(state) {
  const opportunities = getAvailableJobs(state);
  const pending = state.jobs?.applications?.find((item) => item.status === "pending");
  const cards = opportunities.map((job) => ({
    id: job.id,
    title: job.title,
    icon: job.icon,
    text: job.detail + (job.startingSalary ? ` Starting pay: ${formatRand(job.startingSalary)} per working day.` : ""),
    badge: job.eligible ? "Open" : "Locked",
    actions: [action(job.id, "APPLY_JOB", "Apply", job.reason, !job.eligible)],
  }));
  if (!cards.length) {
    if (pending) cards.push({
      id: "pending-application", icon: "⏳", title: "Application sent",
      text: "You should hear back soon. Keep moving one day at a time.",
      badge: "Pending", actions: [],
    });
    else if (state.career.active || state.business.active) cards.push({
      id: "current-path", icon: "✅", title: "You are already building a path",
      text: state.career.active ? state.career.role : state.business.title,
      badge: "Active", actions: [],
    });
    else if (state.life.stage === "school-finale") cards.push({
      id: "finish-school", icon: "🎓", title: "Finish school first",
      text: "Adult opportunities unlock after your final exam and last school moment.",
      badge: "Locked", actions: [],
    });
    else cards.push({
      id: "no-opportunities", icon: "🔎", title: "Nothing open today",
      text: "New opportunities can appear as your story changes.",
      badge: "Check again", actions: [],
    });
  }
  return { summary: pending ? "Application pending" : `${opportunities.length} opportunities`, cards };
}

function transportApp(state) {
  const owned = state.transport.owned || [];
  return {
    summary: owned.length ? `${owned.length} owned` : "Taxi life for now",
    cards: [{
      id: "transport", icon: "🚘", title: owned.length ? "Your transport" : "Get your own wheels",
      text: owned.length ? owned.join(" · ") : "Owning transport unlocks cheaper and more flexible travel.",
      badge: state.transport.dailyAssignment?.mode === "driver" ? "Driver working" : "Available",
      actions: [
        ...(!owned.includes("bicycle") ? [action("bicycle", "BUY_ASSET", "Buy bicycle", formatRand(900), state.finances.cash < 900)] : []),
        ...(!owned.includes("car") ? [action("car", "BUY_ASSET", "Buy used car", formatRand(18_000), state.finances.cash < 18_000)] : []),
        ...(owned.includes("car") && state.transport.dailyAssignment?.mode !== "driver"
          ? [action("driver", "ASSIGN_DRIVER", "Let a driver use the car", "R220–R450 today")]
          : []),
      ],
    }],
  };
}

function garageCards(state) {
  const cards = [{ id: "garage", icon: "🚘", title: "Your garage & fleet", badge: `${state.garage.vehicles.filter(v => v.status === 'owned').length} purchases owned`,
    text: state.garage.vehicles.length ? "Your purchases stay visible as their story unfolds." : "What will success look like: your dream car or a bigger business? Keep saving or choose a purchase below.",
    vehicles: state.garage.vehicles, actions: [] }];
  if (state.business.active && !state.garage.vehicles.some(v => v.id === 'sports')) cards.push({
    id: 'sports-offer', icon: '✨', title: 'Enjoy your success', badge: 'Luxury sports car', art: 'sports',
    text: 'Benefit: +12 happiness and +4 reputation. Cost: R12,000 deposit, then R2,000 every 30 days for 30 payments, plus R60 daily upkeep. No business income. Three consecutive missed payments cause repossession; any loan shortfall stays as debt.',
    actions: [action('sports', 'BUY_BUSINESS_VEHICLE', 'Choose the sports car', 'R12,000 upfront · R72,000 total price', !canBuyBusinessVehicle(state, 'sports'))] });
  if (state.business.active && ['moving-service','buy-resell'].includes(state.business.id) && !state.garage.vehicles.some(v => v.id === 'fleet')) cards.push({
    id: 'fleet-offer', icon: '📦', title: 'Invest in your business', badge: 'Three delivery vans', art: 'fleet',
    text: 'Benefit: more delivery sales when customers trust your business. Cost: R24,000 upfront and R80 daily for fuel, upkeep and delivery labour, plus supplies. Quiet days and weekends can lose money. Review the results after 30 days.',
    actions: [action('fleet', 'BUY_BUSINESS_VEHICLE', 'Choose the delivery fleet', 'R24,000 upfront · R80 daily upkeep', !canBuyBusinessVehicle(state, 'fleet'))] });
  if (state.garage.history.length) cards.push({ id: 'garage-history', icon: '📩', title: 'Your purchase story', badge: 'Choices have consequences', text: state.garage.history.slice(-3).join(' '), actions: [] });
  return cards;
}
function renderVehicleArt(id, lost = false) {
  return `<div class="vehicle-art vehicle-art--${safe(id)} ${lost ? 'vehicle-art--lost' : ''}" role="img" aria-label="${id === 'sports' ? 'Red luxury sports car' : 'Three delivery vans'}${lost ? ' — repossessed' : ''}">${lost ? '<span>REPOSSESSED</span>' : ''}</div>`;
}
function renderGarage(vehicles) {
  if (!vehicles.length) return '<div class="garage-empty">A new chapter starts with an empty garage.</div>';
  return vehicles.map(v => `<div class="garage-vehicle">${renderVehicleArt(v.id, v.status === 'repossessed')}<strong>${safe(v.name)}</strong><small>${v.status === 'repossessed' ? 'Repossessed · no longer yours' : `${formatRand(v.upkeep)} daily upkeep${v.remaining ? ` · Finance ${formatRand(v.remaining)} · Next payment day ${v.nextPaymentDay}` : ' · Paid off'}`}</small></div>`).join('');
}

function businessApp(state) {
  if (!state.business.active) return {
    summary: "No active business",
    cards: [{ id: "business-none", icon: "🌱", title: "Build from the ground up", text: "Startup opportunities appear in Jobs.", badge: "Not started", actions: [] }, ...garageCards(state)],
  };
  const upgrades = Object.entries(BUSINESS_UPGRADES)
    .filter(([id, item]) => item.businessId === state.business.id && !state.assets.ownedUpgradeIds.includes(id));
  return {
    summary: `${state.business.title} · Trust ${state.business.trust}`,
    cards: [{
      id: "business-active", icon: "📈", title: state.business.title,
      text: `Capacity ${state.business.capacity} · ${state.business.staff.length}/${getStaffLimit(state)} staff · Value ${formatRand(state.business.value)}`,
      badge: "Sales minus supplies, overhead and wages",
      actions: [
        ...upgrades.map(([id, item]) => action(id, "BUY_UPGRADE", `Buy ${item.name}`, formatRand(item.cost), state.finances.cash < item.cost)),
        action("helper", "HIRE_EMPLOYEE", "Hire a helper", "R80 daily wage · Equipment expands staff slots", state.business.staff.length >= getStaffLimit(state)),
      ],
    }, ...garageCards(state)],
  };
}

function peopleApp(state) {
  const people = Object.values(state.relationships.people || {});
  return {
    summary: `${people.length} people in your circle`,
    cards: people.map((person) => ({
      id: person.id, icon: person.type === "guardian" ? "🏠" : person.type === "mentor" ? "🧭" : "🙂",
      title: person.name, text: `${person.type} · ${person.trait || "grounded"}`,
      badge: `${person.score}/100 · ${person.reaction || "neutral"}`, actions: [],
    })),
  };
}

function lifeApp(state) {
  const stat = (title, value, icon) => ({ id: title.toLowerCase(), title, text: `${value}/100`, icon, badge: "", actions: [] });
  return {
    summary: `${state.life.stage === "later-life" ? "Later life" : state.life.ended ? "Life complete" : `Age ${state.calendar.age}`} · Net worth ${formatRand(state.finances.netWorth)}`,
    cards: [
      ...(state.dailyState.updates || []).map((text,index) => ({ id: `update-${index}`, title: "Life update", icon: "📩", text, badge: "Consequences", actions: [] })),
      { id: "budget", title: "Living costs", icon: "🏠", text: "Food R25 each day · Electricity R70 every 7 days · Housing R450 every 30 days. Negative cash is debt.", badge: `Cash ${formatRand(state.finances.cash)}`, actions: [] },
      { id: "stokvel", title: "Stokvel savings", icon: "🤝", text: `${state.stokvel.lastPayout ? `Last payout ${formatRand(state.stokvel.lastPayout.amount)} on day ${state.stokvel.lastPayout.day}. ` : ""}Saved ${formatRand(state.stokvel.balance)} · Annual payout on day ${(Math.floor((state.calendar.day - 1) / 365) + 1) * 365}. You receive what you contributed; missed months reduce the payout.`, badge: `Month ${stokvelMonth(state.calendar.day) + 1}`, actions: [action("full", "PAY_STOKVEL", "Contribute / top up to R180", "Once each month"), action("partial", "PAY_STOKVEL", "Contribute R80", "Counts toward this month")] },
      stat("Health", state.stats.health, "❤️"), stat("Happiness", state.stats.happiness, "☀️"),
      stat("Knowledge", state.stats.knowledge, "🧠"), stat("Social", state.stats.social, "💬"),
      stat("Reputation", state.stats.reputation, "⭐"),
    ],
  };
}

function timeApp(state) {
  const week = canFastForward(state, 7);
  const month = canFastForward(state, 30);
  const year = canFastForward(state, 365);
  const blocked = !week.ok;
  const detail = blocked ? week.reason : "Stops for important moments";
  return {
    summary: "Move ahead without losing the story",
    cards: [{
      id: "time", icon: "🗓️", title: "How far ahead?", text: "Routine days settle automatically. Big moments interrupt the skip.", badge: blocked ? "Unavailable" : "Ready",
      actions: [action("week", "FAST_FORWARD", "One week", detail, !week.ok), action("month", "FAST_FORWARD", "One month", month.ok ? "Stops for important moments" : month.reason, !month.ok), action("year", "FAST_FORWARD", "Age one year", "Stops for important moments", !year.ok)],
    }],
  };
}

function betwayApp(state, { slotsSpinning = false } = {}) {
  const last = state.betting.lastResult;
  const unavailable = slotsSpinning || state.life.stage === "school-finale" || state.life.ended || state.finances.cash < 1;
  return { summary: `Cash ${formatRand(state.finances.cash)}`, cards: [{
    id: "betway", title: "Lucky reels", icon: "🎰", badge: "Game money only",
    text: slotsSpinning ? "Reels are turning…" : last ? (last.payout ? `${last.jackpot ? 'JACKPOT! ' : 'You matched three! '}${formatRand(last.payout)} returned on a ${formatRand(last.stake)} spin.` : `No match. Your ${formatRand(last.stake)} stake is lost.`) : "Choose your stake and spin. Three matching symbols pay; other spins lose the stake.",
    slots: { reels: last?.reels || ['🍒', '💎', '7️⃣'], spinning: slotsSpinning, won: !slotsSpinning && last?.payout > 0 },
    bet: { max: Math.max(0, Math.floor(state.finances.cash)), disabled: unavailable },
    actions: [action("all", "BET_ALL", "Spin with all available cash", formatRand(state.finances.cash), unavailable)],
  }, { id: "betting-record", title: "Your record", icon: "📊", badge: `${state.betting.rounds} bets`, text: slotsSpinning ? "Waiting for the reels…" : `Staked ${formatRand(state.betting.totalStaked)} · Returned ${formatRand(state.betting.totalPaid)} · Net ${formatRand(state.betting.totalPaid - state.betting.totalStaked)}`, actions: [] }] };
}

function renderBetForm(bet) {
  return `<form class="bet-form" data-form="betway"><label for="betAmount">Your stake (whole rand)</label><input id="betAmount" name="betAmount" type="number" inputmode="numeric" min="1" max="${bet.max}" step="1" placeholder="Enter amount" required ${bet.disabled ? "disabled" : ""}><button class="phone-action" type="submit" ${bet.disabled ? "disabled" : ""}>Spin</button></form>`;
}

function renderSlots(slots) {
  return `<div class="slot-machine ${slots.spinning ? 'slot-machine--spinning' : ''} ${slots.won ? 'slot-machine--won' : ''}" role="img" aria-label="${slots.spinning ? 'Reels spinning' : safe(slots.reels.join(' · '))}" aria-busy="${slots.spinning}">${slots.reels.map((symbol,index)=>`<div class="slot-reel slot-reel--${index}">${slots.spinning ? '<div class="slot-strip"><span>🍒</span><span>💎</span><span>7️⃣</span><span>🔔</span><span>🍋</span><span>🍒</span></div>' : `<span>${safe(symbol)}</span>`}</div>`).join('')}</div>`;
}

export function buildPhoneModel(state, options = {}) {
  const builders = { jobs: jobsApp, transport: transportApp, business: businessApp, people: peopleApp, life: lifeApp, time: timeApp, betway: betwayApp };
  const apps = APP_ORDER.map((id) => ({ id, ...APP_META[id], ...builders[id](state, options) }));
  const notifications = (state.dailyState.updates || []).map(text => ({ app: "life", text }));
  if (state.stokvel.lastPayout) notifications.push({ app: "life", text: `Last stokvel payout: ${formatRand(state.stokvel.lastPayout.amount)} on day ${state.stokvel.lastPayout.day}` });
  if (state.jobs?.activeApplicationId) notifications.push({ app: "jobs", text: "Application pending" });
  if (state.jobs?.lastResult) notifications.push({ app: "jobs", text: state.jobs.lastResult.message });
  return { apps, notifications };
}

function renderAction(item) {
  return `<button class="phone-action" type="button" data-action="${safe(item.action)}" data-choice="${safe(item.id)}" ${item.disabled ? "disabled" : ""}><span>${safe(item.label)}</span>${item.detail ? `<small>${safe(item.detail)}</small>` : ""}</button>`;
}

export function renderPhone(model, { open = false, activeApp = "home" } = {}) {
  if (!open) return "";
  const selected = model.apps.find((app) => app.id === activeApp);
  const content = selected
    ? `<header class="phone-screen__header"><button type="button" data-action="OPEN_PHONE_APP" data-app="home" aria-label="Back to apps">‹</button><span>${safe(selected.icon)}</span><div><strong>${safe(selected.title)}</strong><small>${safe(selected.summary)}</small></div></header><div class="phone-cards">${selected.cards.map((card) => `<article class="phone-card"><div class="phone-card__top"><span>${safe(card.icon)}</span><small>${safe(card.badge)}</small></div><h3>${safe(card.title)}</h3><p>${safe(card.text)}</p>${card.art ? renderVehicleArt(card.art) : ""}${card.vehicles ? renderGarage(card.vehicles) : ""}${card.slots ? renderSlots(card.slots) : ""}${card.bet ? renderBetForm(card.bet) : ""}<div class="phone-card__actions">${card.actions.map(renderAction).join("")}</div></article>`).join("")}</div>`
    : `<header class="phone-screen__header phone-screen__header--home"><div><strong>${safe(model.greeting || "Your phone")}</strong><small>${model.notifications.length ? safe(model.notifications[0].text) : "Everything you need, tucked away."}</small></div></header><div class="phone-app-grid">${model.apps.map((app) => `<button class="phone-app phone-app--${safe(app.colour)}" type="button" data-action="OPEN_PHONE_APP" data-app="${safe(app.id)}"><span class="phone-app__icon">${safe(app.icon)}</span><strong>${safe(app.title)}</strong><small>${safe(app.summary)}</small></button>`).join("")}</div>`;
  return `<div class="phone-overlay" role="dialog" aria-modal="true" aria-label="Phone"><button class="phone-overlay__backdrop" type="button" data-action="CLOSE_PHONE" aria-label="Close phone"></button><section class="phone-device"><div class="phone-device__speaker"></div><button class="phone-close" type="button" data-action="CLOSE_PHONE" aria-label="Close phone">×</button><div class="phone-screen">${content}</div><div class="phone-device__home" aria-hidden="true"></div></section></div>`;
}
