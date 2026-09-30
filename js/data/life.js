export const SCHOOL_STEPS = Object.freeze(["last-morning", "final-exam", "school-ends", "complete"]);

export const SCHOOL_DECISIONS = Object.freeze({
  "last-morning": Object.freeze({
    icon: "🎒",
    kicker: "LAST DAY OF SCHOOL",
    title: "The final bell is getting close",
    text: "Everyone is acting normal. Nobody feels normal.",
    choices: Object.freeze([
      { id: "revise-notes", label: "Check your notes one last time", detail: "Quiet focus before the noise.", effects: { stats: { knowledge: 5, energy: -4 }, relationships: { mentor: 3 } } },
      { id: "calm-friend", label: "Help your friend stop panicking", detail: "You can carry nerves together.", effects: { stats: { social: 4, happiness: 3 }, relationships: { friend: 6 } } },
      { id: "soak-it-in", label: "Enjoy the last school morning", detail: "One memory before everything changes.", effects: { stats: { happiness: 6, reputation: 2 }, relationships: { classmate: 3 } } },
    ]),
  }),
  "final-exam": Object.freeze({
    icon: "✍️",
    kicker: "FINAL EXAM",
    title: "Pens down will end an era",
    text: "The first question looks familiar. The clock does not care.",
    choices: Object.freeze([
      { id: "steady", label: "Work steadily from page one", detail: "Keep the rhythm and check your answers.", scoreBase: 54, effects: { stats: { energy: -8, knowledge: 2 } } },
      { id: "hard-first", label: "Attack the hardest questions", detail: "Risk time to chase the biggest marks.", scoreBase: 49, effects: { stats: { energy: -11, reputation: 2 } } },
      { id: "gut-feel", label: "Trust your first instinct", detail: "Move fast and never look back.", scoreBase: 45, effects: { stats: { energy: -5, happiness: 2 } } },
    ]),
  }),
  "school-ends": Object.freeze({
    icon: "🎓",
    kicker: "SCHOOL'S OUT",
    title: "The gate opens onto adult life",
    text: "One small choice decides how you leave this chapter.",
    choices: Object.freeze([
      { id: "thank-mentor", label: "Thank the teacher who pushed you", detail: "Some lessons were bigger than marks.", effects: { stats: { reputation: 4 }, relationships: { mentor: 8 } } },
      { id: "celebrate", label: "Celebrate with your people", detail: "Music, photos and one last uniform selfie.", effects: { stats: { social: 5, happiness: 7 }, relationships: { friend: 5, classmate: 3 } } },
      { id: "head-home", label: "Head home and plan quietly", detail: "Tomorrow needs a clear head.", effects: { stats: { energy: 7, knowledge: 2 }, relationships: { guardian: 4 } } },
    ]),
  }),
});

export const SCHOOL_COMPLETION_CASH = 650;
