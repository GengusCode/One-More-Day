const deepFreeze = (value) => {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
};

const role = (id, name, salary, minExperience, minQualifications, thresholds) => ({
  id,
  name,
  salary,
  minExperience,
  minQualifications,
  ...thresholds,
});

export const EMPLOYER_CULTURES = deepFreeze([
  { id: "neutral", title: "Steady workplace", preferredChoiceId: null, performanceBias: 0 },
  { id: "results-first", title: "Results-first workplace", preferredChoiceId: "show-results", performanceBias: 5 },
  { id: "people-first", title: "People-first workplace", preferredChoiceId: "back-team", coworkerBias: 6 },
  { id: "structured", title: "Structured workplace", preferredChoiceId: "show-plan", bossBias: 5 },
  { id: "innovative", title: "Innovative workplace", preferredChoiceId: "growth-idea", knowledgeBias: 5 },
]);

export const CAREER_FAMILIES = deepFreeze([
  {
    id: "trades",
    title: "Trades & Operations",
    icon: "🦺",
    roles: [
      role("trades-site-assistant", "Site Assistant", 170, 0, [], { performance: 68, knowledge: 42, reputation: 42, readiness: 58 }),
      role("trades-skilled-operator", "Skilled Operator", 250, 25, ["construction-skills-learnership"], { performance: 74, knowledge: 50, reputation: 48, readiness: 68 }),
      role("trades-artisan", "Artisan", 390, 70, ["electrical-trade-certificate"], { performance: 79, knowledge: 62, reputation: 55, readiness: 76 }),
      role("trades-site-supervisor", "Site Supervisor", 570, 140, ["electrical-trade-certificate"], { performance: 84, knowledge: 69, reputation: 64, readiness: 84 }),
      role("trades-operations-director", "Operations Director", 880, 250, ["electrical-trade-certificate"], { performance: 92, knowledge: 78, reputation: 74, readiness: 92 }),
    ],
  },
  {
    id: "technology",
    title: "Technology",
    icon: "💻",
    roles: [
      role("technology-support-trainee", "Support Trainee", 200, 0, [], { performance: 68, knowledge: 48, reputation: 42, readiness: 58 }),
      role("technology-junior-technician", "Junior Technician", 310, 25, ["digital-support-learnership", "self-taught-digital-certificate"], { performance: 75, knowledge: 58, reputation: 48, readiness: 68 }),
      role("technology-systems-specialist", "Systems Specialist", 470, 75, ["self-taught-digital-certificate", "computing-degree"], { performance: 80, knowledge: 70, reputation: 55, readiness: 77 }),
      role("technology-lead", "Technology Lead", 710, 150, ["computing-degree"], { performance: 85, knowledge: 78, reputation: 64, readiness: 85 }),
      role("technology-director", "Head of Technology", 1_080, 270, ["computing-degree"], { performance: 92, knowledge: 88, reputation: 74, readiness: 93 }),
    ],
  },
  {
    id: "business",
    title: "Business & Administration",
    icon: "💼",
    roles: [
      role("business-office-junior", "Office Junior", 180, 0, [], { performance: 72, knowledge: 52, reputation: 48, readiness: 66 }),
      role("business-administrator", "Administrator", 260, 30, ["office-admin-learnership"], { performance: 78, knowledge: 60, reputation: 55, readiness: 74 }),
      role("business-team-coordinator", "Team Coordinator", 380, 80, ["office-admin-learnership", "business-finance-diploma"], { performance: 81, knowledge: 67, reputation: 62, readiness: 79 }),
      role("business-department-manager", "Department Manager", 560, 150, ["business-finance-diploma"], { performance: 85, knowledge: 74, reputation: 70, readiness: 85 }),
      role("business-executive-director", "Executive Director", 850, 270, ["business-finance-diploma"], { performance: 93, knowledge: 84, reputation: 80, readiness: 94 }),
    ],
  },
  {
    id: "hospitality",
    title: "Hospitality & Tourism",
    icon: "🛎️",
    roles: [
      role("hospitality-service-assistant", "Service Assistant", 150, 0, [], { performance: 67, knowledge: 40, reputation: 48, readiness: 56 }),
      role("hospitality-senior-host", "Senior Host", 230, 25, ["hospitality-tourism-certificate"], { performance: 73, knowledge: 48, reputation: 56, readiness: 66 }),
      role("hospitality-shift-supervisor", "Shift Supervisor", 340, 70, ["hospitality-tourism-certificate"], { performance: 79, knowledge: 58, reputation: 64, readiness: 75 }),
      role("hospitality-venue-manager", "Venue Manager", 520, 140, ["hospitality-tourism-certificate"], { performance: 84, knowledge: 66, reputation: 72, readiness: 84 }),
      role("hospitality-director", "Hospitality Director", 800, 250, ["hospitality-tourism-certificate"], { performance: 92, knowledge: 76, reputation: 82, readiness: 93 }),
    ],
  },
  {
    id: "community",
    title: "Community & Public Service",
    icon: "🤲🏽",
    roles: [
      role("community-outreach-assistant", "Outreach Assistant", 160, 0, [], { performance: 68, knowledge: 42, reputation: 50, readiness: 58 }),
      role("community-project-coordinator", "Project Coordinator", 250, 30, ["foundation-bridge"], { performance: 74, knowledge: 54, reputation: 58, readiness: 68 }),
      role("community-programme-officer", "Programme Officer", 380, 80, ["community-development-degree"], { performance: 80, knowledge: 65, reputation: 67, readiness: 77 }),
      role("community-programme-manager", "Programme Manager", 570, 150, ["community-development-degree"], { performance: 85, knowledge: 73, reputation: 75, readiness: 85 }),
      role("community-director", "Community Director", 860, 270, ["community-development-degree"], { performance: 92, knowledge: 82, reputation: 84, readiness: 94 }),
    ],
  },
]);

export const JOB_OPPORTUNITIES = Object.freeze([
  Object.freeze({
    id: "office-trainee",
    title: "Office trainee",
    icon: "💼",
    type: "career",
    pathId: "office",
    minExam: 50,
    startingSalary: 180,
    minKnowledge: 30,
    detail: "Start small, learn the office, earn your way upward.",
  }),
  Object.freeze({
    id: "car-wash-startup",
    title: "Neighbourhood car wash",
    icon: "🫧",
    type: "business",
    pathId: "car-wash",
    minCash: 250,
    detail: "You do every job first. Equipment and staff can scale it.",
  }),
  Object.freeze({
    id: "resell-startup",
    minExam: 40,
    title: "Buy & resell hustle",
    icon: "📦",
    type: "business",
    pathId: "buy-resell",
    minCash: 300,
    detail: "Source carefully, sell smart and grow your stock.",
  }),
  Object.freeze({ id: "shop-assistant", title: "Shop assistant", icon: "🛒", type: "career", pathId: "retail", startingSalary: 125, detail: "An entry-level role. Start with lower pay and build skills for promotion." }),
  Object.freeze({ id: "moving-startup", title: "Local moving service", icon: "🛻", type: "business", pathId: "moving-service", minCash: 200, detail: "Start with small moving and carrying jobs. Physical work and careful budgeting matter." }),
  Object.freeze({ id: "logistics-clerk", title: "Logistics clerk", icon: "📋", type: "career", pathId: "logistics", minExam: 65, minKnowledge: 50, startingSalary: 200, detail: "Use planning and numeracy to manage stock and deliveries." }),
  Object.freeze({ id: "junior-analyst", title: "Junior analyst", icon: "📊", type: "career", pathId: "office", minExam: 85, minKnowledge: 70, startRoleIndex: 1, startingSalary: 260, detail: "A strong test result opens a better-paid starting role. Performance still matters." }),
  Object.freeze({
    id: "fresh-start",
    title: "Fresh-start moving service",
    icon: "🛻",
    type: "business",
    pathId: "moving-service",
    restartOnly: true,
    minCash: 0,
    detail: "A practical restart after a job or business ended.",
  }),
]);
