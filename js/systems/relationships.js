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

const CONTACTS = Object.freeze({
  "check-in": {label: "Check in", energy: 2, bond: 2, social: 1, happiness: 1},
  "catch-up": {label: "Catch up", energy: 8, bond: 6, social: 3, happiness: 2},
});

export function getContactOptions(state, personId) {
  const person = state.relationships.people[personId];
  return Object.entries(CONTACTS).map(([id, option]) => {
    const reason = !person ? "Contact unavailable." : state.life.ended ? "This life has ended."
      : state.life.stage === "school-finale" ? "Finish school first."
      : person.lastContactDay === state.calendar.day ? "Already contacted today."
      : state.stats.energy < option.energy ? "Not enough energy." : "";
    return {id, ...option, disabled: Boolean(reason), reason};
  });
}

export function contactPerson(state, personId, contactId) {
  const option = getContactOptions(state, personId).find(item => item.id === contactId);
  if (!option || option.disabled) return {ok: false, state, reason: option?.reason || "Choose a valid contact action."};
  const next = clone(state);
  const person = next.relationships.people[personId];
  const close = person.score >= 60;
  const day = state.calendar.day;
  const replies = contactId === "check-in" ? [
    "Thanks for checking in. It is good to hear from you.",
    "Today has been busy. I am glad you messaged.",
    close ? "You always know when I need a chat." : "Let us keep in touch.",
  ] : person.type === "mentor" ? [
    "We talk through your next step and make a practical plan.",
    "I share a lesson from a mistake I made when I was starting out.",
    "We catch up on your progress and what you want to learn next.",
  ] : person.type === "guardian" || person.type === "family" ? [
    "We catch up on home and the little things we have missed.",
    "We share a familiar memory and have a good laugh.",
    "I listen while you tell me how life has been going.",
  ] : [
    "We swap stories about the week and laugh at a small mishap.",
    "We talk about our plans and encourage each other.",
    close ? "The conversation feels easy. We should do this again." : "It is good getting to know you better.",
  ];
  const message = `${person.name}: ${replies[(day - 1) % replies.length]}`;
  person.score = clamp(person.score + option.bond);
  person.lastContactDay = day;
  person.lastReply = message;
  person.reaction = "appreciative";
  next.stats.energy = clamp(next.stats.energy - option.energy);
  next.stats.social = clamp(next.stats.social + option.social);
  next.stats.happiness = clamp(next.stats.happiness + option.happiness);
  return {ok: true, state: next, message};
}
