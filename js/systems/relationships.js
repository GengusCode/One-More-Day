const clone = (value) => (
  typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value))
);
const clamp = (value) => Math.max(0, Math.min(100, Number(value) || 0));

export function applyRelationshipEffects(state, effects = {}) {
  const next = clone(state);
  for (const [id, amount] of Object.entries(effects)) {
    const current = next.relationships.people[id] || {
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      type: "Contact",
      score: 50,
    };
    next.relationships.people[id] = {
      ...current,
      score: clamp(current.score + Number(amount || 0)),
    };
  }
  return next;
}

export function getRelationshipLabel(score) {
  const value = clamp(score);
  if (value >= 95) return "Unbreakable";
  if (value >= 80) return "Trusted";
  if (value >= 60) return "Close";
  if (value >= 40) return "Familiar";
  if (value >= 20) return "Fragile";
  return "Strained";
}

export function getRelationshipEventIds(state) {
  const people = Object.values(state.relationships.people || {});
  return people.filter((person) => person.score <= 30 || person.score >= 80).map((person) => person.id);
}
