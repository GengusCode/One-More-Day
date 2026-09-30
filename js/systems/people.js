import {
  PERSON_POOLS,
  PERSON_TYPES,
  STARTER_REACTIONS,
  STARTER_SCORES,
} from "../data/people.js";

function hashSeed(value) {
  let hash = 2166136261;
  for (const character of String(value || "one-more-day")) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededIndex(seed, salt, length) {
  const mixed = Math.imul(hashSeed(seed + ":" + salt), 1664525) + 1013904223;
  return (mixed >>> 0) % length;
}

export function createStarterPeople({ seed, profile = {} } = {}) {
  const stableSeed = String(seed || `${profile.name || "player"}:${profile.gender || "person"}`);
  return PERSON_TYPES.map((type) => {
    const pool = PERSON_POOLS[type];
    const picked = pool[seededIndex(stableSeed, type, pool.length)];
    const reactions = STARTER_REACTIONS[type];
    return {
      id: type,
      name: picked.name,
      type,
      score: STARTER_SCORES[type],
      trait: picked.trait,
      reaction: reactions[seededIndex(stableSeed, type + "-reaction", reactions.length)],
    };
  });
}

export function ensureStarterPeople(state, options = {}) {
  const existing = state?.relationships?.people;
  if (existing && Object.keys(existing).length > 0) return state;

  const next = typeof globalThis.structuredClone === "function"
    ? globalThis.structuredClone(state)
    : JSON.parse(JSON.stringify(state));
  next.relationships ||= { people: {} };
  next.relationships.people = Object.fromEntries(
    createStarterPeople({
      seed: options.seed || `${next.profile?.name}:${next.profile?.gender}`,
      profile: next.profile,
    }).map((person) => [person.id, person]),
  );
  return next;
}
