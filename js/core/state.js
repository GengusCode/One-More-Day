import { ECONOMY } from "../data/economy.js";

export const SAVE_KEY_V8 = "one-more-day-v08";
export const LEGACY_SAVE_KEYS = Object.freeze(["one-more-day-v06"]);
export const CORRUPT_BACKUP_KEY = "one-more-day-v08-corrupt-backup";

const GENDERS = Object.freeze({
  man: Object.freeze({ subject: "he", object: "him", possessive: "his" }),
  woman: Object.freeze({ subject: "she", object: "her", possessive: "her" }),
  "non-binary": Object.freeze({ subject: "they", object: "them", possessive: "their" }),
});

const STAT_KEYS = Object.freeze([
  "health", "energy", "knowledge", "social", "happiness", "reputation",
]);

const clone = (value) => (
  typeof globalThis.structuredClone === "function"
    ? globalThis.structuredClone(value)
    : JSON.parse(JSON.stringify(value))
);

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));

export function createDefaultState() {
  return {
    schemaVersion: 8,
    profile: {
      name: "",
      gender: "non-binary",
      pronouns: { ...GENDERS["non-binary"] },
    },
    calendar: { day: 1, age: 18, weekday: 1 },
    stats: {
      health: 78,
      energy: 72,
      knowledge: 35,
      social: 40,
      happiness: 68,
      reputation: 35,
    },
    finances: {
      cash: 350,
      netWorth: 350,
      transactions: [],
      lastTransactionId: 0,
    },
    career: {
      active: false,
      pathId: null,
      roleIndex: 0,
      role: "",
      salary: 0,
      performance: 50,
      boss: 50,
      coworkers: 50,
      warnings: [],
      verbalWarnings: [],
      conductHistory: [],
      readiness: 0,
      recentDecisionIds: [],
      attendanceStreak: 0,
      dismissed: false,
    },
    business: {
      active: false,
      id: null,
      title: "",
      trust: ECONOMY.business.startingTrust,
      value: 0,
      capacity: 0,
      baselineRevenue: 0,
      staff: [],
      premises: [],
      zeroTrustOperatingDays: 0,
      completedDecisionIds: [],
      closed: false,
    },
    relationships: { people: {} },
    transport: {
      owned: [],
      car: null,
      dailyAssignment: null,
      lastTravelDay: 0,
    },
    assets: { ownedUpgradeIds: [], items: {} },
    eventHistory: {
      headlineIds: [],
      choiceOrders: {},
      resolvedOutcomeIds: [],
    },
    eventDecks: {},
    delayedEvents: [],
    dailyState: {
      day: 1,
      phase: "morning",
      activeEventId: null,
      activeChoiceId: null,
      choiceOrder: [],
      followUpOrder: [],
      followUp: null,
      workDecisionId: null,
      needsTravel: false,
      travelContext: {},
      stayedHome: false,
      afterTravel: "headline",
      travelResolved: false,
      updates: [],
      settledIds: [],
      result: null,
      chase: null,
      complete: false,
    },
    settings: {
      reducedMotion: false,
      sound: false,
      openPanels: [],
    },
  };
}

export function validateName(input) {
  const value = String(input ?? "").trim().replace(/\s+/gu, " ");
  const length = Array.from(value).length;
  if (length < 2) return { ok: false, value, error: "Enter at least 2 characters." };
  if (length > 24) return { ok: false, value, error: "Keep your name to 24 characters." };
  if (!/^[\p{L}\p{M}][\p{L}\p{M} '\u2019-]*[\p{L}\p{M}]$/u.test(value)) {
    return { ok: false, value, error: "Use letters, spaces, apostrophes or hyphens." };
  }
  return { ok: true, value, error: "" };
}

export function createNewLife({ name, gender }) {
  const checkedName = validateName(name);
  if (!checkedName.ok) throw new TypeError(checkedName.error);
  if (!Object.hasOwn(GENDERS, gender)) throw new TypeError("Choose a gender.");
  const state = createDefaultState();
  state.profile = {
    name: checkedName.value,
    gender,
    pronouns: { ...GENDERS[gender] },
  };
  return state;
}

export function calculateNetWorth(state) {
  const assetValue = Object.values(state.assets?.items || {}).reduce(
    (total, item) => total + Math.max(0, Number(item?.value) || 0),
    0,
  );
  const businessValue = Math.max(0, Number(state.business?.value) || 0);
  return Math.round((Number(state.finances?.cash) || 0) + assetValue + businessValue);
}

function addRelationshipEffects(next, effects) {
  if (!effects || typeof effects !== "object") return;
  for (const [id, amount] of Object.entries(effects)) {
    const current = next.relationships.people[id] || {
      id,
      name: id,
      type: "Contact",
      score: 50,
    };
    next.relationships.people[id] = {
      ...current,
      score: clamp(current.score + Number(amount || 0)),
    };
  }
}

export function applyEffects(state, effects = {}, meta = {}) {
  const next = clone(state);
  const transactions = [];

  for (const key of STAT_KEYS) {
    const amount = Number(effects.stats?.[key] ?? effects[key] ?? 0);
    if (amount) next.stats[key] = clamp(next.stats[key] + amount);
  }

  if (effects.relationships) addRelationshipEffects(next, effects.relationships);

  const cashAmount = Number(effects.cash || 0);
  if (cashAmount) {
    const transactionNumber = (Number(next.finances.lastTransactionId) || 0) + 1;
    next.finances.lastTransactionId = transactionNumber;
    next.finances.cash = Math.round((Number(next.finances.cash) || 0) + cashAmount);
    const transaction = {
      id: "tx-" + transactionNumber,
      amount: Math.round(cashAmount),
      balance: next.finances.cash,
      source: String(meta.source || "life"),
      day: Number(next.calendar.day) || 1,
    };
    next.finances.transactions.push(transaction);
    next.finances.transactions = next.finances.transactions.slice(-60);
    transactions.push(transaction);
  }

  next.finances.netWorth = calculateNetWorth(next);
  return { state: next, transactions };
}

function copyKnown(defaultValue, candidateValue) {
  if (defaultValue === null) {
    return candidateValue === undefined ? null : clone(candidateValue);
  }
  if (Array.isArray(defaultValue)) {
    return Array.isArray(candidateValue) ? clone(candidateValue) : clone(defaultValue);
  }
  if (defaultValue && typeof defaultValue === "object") {
    const source = candidateValue && typeof candidateValue === "object" ? candidateValue : {};
    const output = {};
    for (const key of Object.keys(defaultValue)) {
      output[key] = copyKnown(defaultValue[key], source[key]);
    }
    return output;
  }
  if (candidateValue === undefined || candidateValue === null) return defaultValue;
  if (typeof defaultValue === "number") {
    return Number.isFinite(Number(candidateValue)) ? Number(candidateValue) : defaultValue;
  }
  if (typeof defaultValue === "boolean") return Boolean(candidateValue);
  if (typeof defaultValue === "string") return String(candidateValue);
  return defaultValue;
}

function uniqueStrings(value) {
  return [...new Set((Array.isArray(value) ? value : []).filter((item) => typeof item === "string"))];
}

function normaliseTransactions(value) {
  const seen = new Set();
  return (Array.isArray(value) ? value : []).filter((item) => {
    if (!item || typeof item.id !== "string" || seen.has(item.id)) return false;
    seen.add(item.id);
    return Number.isFinite(Number(item.amount)) && Number.isFinite(Number(item.balance));
  }).slice(-60).map((item) => ({
    id: item.id,
    amount: Math.round(Number(item.amount)),
    balance: Math.round(Number(item.balance)),
    source: String(item.source || "life"),
    day: Math.max(1, Math.round(Number(item.day) || 1)),
  }));
}

export function validateState(candidate) {
  const defaults = createDefaultState();
  const source = candidate && typeof candidate === "object" ? candidate : {};
  const state = copyKnown(defaults, source);
  state.schemaVersion = 8;

  const checkedName = validateName(source.profile?.name ?? state.profile.name);
  state.profile.name = checkedName.ok ? checkedName.value : "";
  state.profile.gender = Object.hasOwn(GENDERS, source.profile?.gender)
    ? source.profile.gender
    : "non-binary";
  state.profile.pronouns = { ...GENDERS[state.profile.gender] };

  state.calendar.day = Math.max(1, Math.round(Number(state.calendar.day) || 1));
  state.calendar.age = Math.max(18, Math.round(Number(state.calendar.age) || 18));
  state.calendar.weekday = Math.max(1, Math.min(7, Math.round(Number(state.calendar.weekday) || 1)));
  STAT_KEYS.forEach((key) => { state.stats[key] = clamp(state.stats[key]); });

  state.finances.cash = Math.round(Number(state.finances.cash) || 0);
  state.finances.transactions = normaliseTransactions(source.finances?.transactions);
  state.finances.lastTransactionId = Math.max(
    Number(source.finances?.lastTransactionId) || 0,
    ...state.finances.transactions.map((item) => Number(item.id.replace(/^tx-/, "")) || 0),
  );

  state.career.performance = clamp(state.career.performance);
  state.career.boss = clamp(state.career.boss);
  state.career.coworkers = clamp(state.career.coworkers);
  state.career.readiness = clamp(state.career.readiness);
  state.career.warnings = Array.isArray(source.career?.warnings)
    ? source.career.warnings.slice(0, 3).map((warning, index) => ({
      id: String(warning?.id || "warning-" + (index + 1)),
      day: Math.max(1, Math.round(Number(warning?.day) || state.calendar.day)),
      reason: String(warning?.reason || "Work conduct"),
    }))
    : [];
  state.career.recentDecisionIds = uniqueStrings(source.career?.recentDecisionIds).slice(-6);

  state.business.trust = clamp(state.business.trust);
  state.business.staff = Array.isArray(source.business?.staff) ? clone(source.business.staff) : [];
  state.business.premises = Array.isArray(source.business?.premises) ? clone(source.business.premises) : [];
  state.business.completedDecisionIds = uniqueStrings(source.business?.completedDecisionIds);

  const people = {};
  const sourcePeople = source.relationships?.people;
  if (sourcePeople && typeof sourcePeople === "object") {
    for (const [id, person] of Object.entries(sourcePeople)) {
      if (!person || typeof person !== "object") continue;
      people[id] = {
        id,
        name: String(person.name || id),
        type: String(person.type || "Contact"),
        score: clamp(person.score ?? 50),
      };
    }
  }
  state.relationships.people = people;

  state.transport.owned = uniqueStrings(source.transport?.owned);
  state.assets.ownedUpgradeIds = uniqueStrings(source.assets?.ownedUpgradeIds);
  state.eventHistory.headlineIds = uniqueStrings(source.eventHistory?.headlineIds).slice(-40);
  state.eventHistory.resolvedOutcomeIds = uniqueStrings(source.eventHistory?.resolvedOutcomeIds).slice(-100);
  state.dailyState.settledIds = uniqueStrings(source.dailyState?.settledIds);
  state.dailyState.travelContext = source.dailyState?.travelContext
    && typeof source.dailyState.travelContext === "object"
    ? clone(source.dailyState.travelContext)
    : {};
  state.delayedEvents = (Array.isArray(source.delayedEvents) ? source.delayedEvents : [])
    .filter((item) => item && Number.isFinite(Number(item.dueDay)) && item.eventId && item.outcomeId)
    .map((item) => ({
      dueDay: Math.max(1, Math.round(Number(item.dueDay))),
      eventId: String(item.eventId),
      outcomeId: String(item.outcomeId),
      payload: item.payload && typeof item.payload === "object" ? clone(item.payload) : {},
      severity: Math.max(0, Number(item.severity) || 0),
    }));

  state.finances.netWorth = calculateNetWorth(state);
  return state;
}

export function migrateLegacyState(candidate) {
  if (candidate?.schemaVersion === 8) return validateState(candidate);
  const state = createDefaultState();
  const source = candidate && typeof candidate === "object" ? candidate : {};
  const checkedName = validateName(source.name);
  if (checkedName.ok) state.profile.name = checkedName.value;

  state.calendar.day = Math.max(1, Math.round(Number(source.day) || 1));
  state.calendar.age = Math.max(18, Math.round(Number(source.age) || 18));
  state.calendar.weekday = ((state.calendar.day - 1) % 7) + 1;
  state.finances.cash = Math.round(Number(source.cash) || state.finances.cash);
  STAT_KEYS.forEach((key) => {
    if (Number.isFinite(Number(source[key]))) state.stats[key] = clamp(source[key]);
  });

  if (source.relationships && typeof source.relationships === "object") {
    for (const [id, score] of Object.entries(source.relationships)) {
      if (!Number.isFinite(Number(score))) continue;
      state.relationships.people[id] = {
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1),
        type: id === "gogo" ? "Family" : "Contact",
        score: clamp(score),
      };
    }
  }

  const job = typeof source.job === "string" ? source.job : source.job?.id;
  if (job === "office") {
    state.career.active = true;
    state.career.pathId = "office";
    state.career.roleIndex = Math.max(0, Math.round(Number(source.level) || 0));
    state.career.role = ["Office Junior", "Administrator", "Team Coordinator", "Department Manager", "Executive Director"][Math.min(4, state.career.roleIndex)];
    state.career.performance = clamp(source.performance ?? 50);
    state.career.boss = clamp(50 + Number(source.bossFavor || 0));
    state.career.readiness = clamp(source.xp ?? 0);
    const count = Math.max(0, Math.min(3, Math.round(Number(source.warnings) || 0)));
    state.career.warnings = Array.from({ length: count }, (_, index) => ({
      id: "legacy-warning-" + (index + 1),
      day: state.calendar.day,
      reason: "Carried over from your previous save",
    }));
  } else if (job) {
    const mappedId = job === "wash" ? "car-wash" : job === "food" ? "buy-resell" : job;
    state.business.active = true;
    state.business.id = mappedId;
    state.business.title = ["Solo Owner", "Equipped Operator", "Employer", "Site Owner", "Multi-Site Founder"][
      Math.max(0, Math.min(4, Math.round(Number(source.level) || 0)))
    ];
    state.business.staff = Array.from(
      { length: Math.max(0, Math.round(Number(source.workers) || 0)) },
      (_, index) => ({ id: "legacy-staff-" + (index + 1), roleId: "helper", wage: 80 }),
    );
    state.business.premises = Array.from(
      { length: Math.max(0, Math.round(Number(source.expansions) || 0)) },
      (_, index) => ({ id: "legacy-premises-" + (index + 1), name: "Existing site" }),
    );
  }

  if (source.equipment && job) state.assets.ownedUpgradeIds.push(job + "-equipment");
  if (Number(source.assets) > 0) {
    state.assets.items.legacyAssets = {
      id: "legacyAssets",
      name: "Existing assets",
      value: Math.round(Number(source.assets)),
    };
  }
  state.finances.netWorth = calculateNetWorth(state);
  state.dailyState.day = state.calendar.day;
  return validateState(state);
}

export function saveGame(state, storage = globalThis.localStorage) {
  const validated = validateState(state);
  storage.setItem(SAVE_KEY_V8, JSON.stringify(validated));
  return validated;
}

export function loadGame(storage = globalThis.localStorage) {
  const current = storage.getItem(SAVE_KEY_V8);
  if (current !== null) {
    try {
      return { state: validateState(JSON.parse(current)), status: "loaded", recoveryMessage: "" };
    } catch {
      storage.setItem(CORRUPT_BACKUP_KEY, current);
      return {
        state: createDefaultState(),
        status: "corrupt",
        recoveryMessage: "We could not read your saved life. A backup was kept so you can start safely.",
      };
    }
  }

  for (const key of LEGACY_SAVE_KEYS) {
    const legacy = storage.getItem(key);
    if (legacy === null) continue;
    try {
      const state = migrateLegacyState(JSON.parse(legacy));
      storage.setItem(SAVE_KEY_V8, JSON.stringify(state));
      return { state, status: "migrated", recoveryMessage: "" };
    } catch {
      storage.setItem(CORRUPT_BACKUP_KEY, legacy);
      return {
        state: createDefaultState(),
        status: "corrupt",
        recoveryMessage: "We could not read your saved life. A backup was kept so you can start safely.",
      };
    }
  }
  return { state: createDefaultState(), status: "new", recoveryMessage: "" };
}
