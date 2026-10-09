const deepFreeze = (value) => {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
};

export const FUNDING_OPTIONS = deepFreeze([
  {
    id: "personal",
    title: "Pay yourself",
    icon: "💳",
    text: "Pay the course fee now and avoid study debt.",
  },
  {
    id: "bursary",
    title: "Apply for a bursary",
    icon: "🎓",
    text: "A fictional bursary application considers results, effort and need.",
  },
  {
    id: "study-loan",
    title: "Take a study loan",
    icon: "🏦",
    text: "Study now, then repay in instalments after the programme ends.",
  },
  {
    id: "existing-work",
    title: "Keep working",
    icon: "🧰",
    text: "Use current income while managing extra pressure and fatigue.",
  },
  {
    id: "part-time",
    title: "Work part-time",
    icon: "⏱️",
    text: "Earn a little on study days at the cost of energy.",
  },
  {
    id: "paid-learnership",
    title: "Paid learnership",
    icon: "🤝",
    text: "Train in a workplace and receive a small daily stipend.",
  },
]);

const strategyChoices = [
  {
    id: "focused-plan",
    label: "Build a strict study plan",
    detail: "Protect your study time and arrive prepared.",
    modifiers: { focus: 14, attendance: 5, integrity: 2 },
    effects: { stats: { energy: -6, knowledge: 3 } },
  },
  {
    id: "balanced-plan",
    label: "Balance study with earning",
    detail: "Keep money moving, even if progress is slower.",
    modifiers: { focus: 7, attendance: 1, experience: 3 },
    effects: { stats: { energy: -4, happiness: 2 } },
  },
  {
    id: "confidence-plan",
    label: "Back your current ability",
    detail: "Stay flexible and trust what you already know.",
    modifiers: { focus: 3, attendance: -2, integrity: 1, experience: 2 },
    effects: { stats: { energy: -2, happiness: 3 } },
  },
];

const assessmentChoices = [
  {
    id: "check-everything",
    label: "Check your work carefully",
    detail: "Use the full time and protect easy marks.",
    modifiers: { focus: 9, integrity: 4 },
    effects: { stats: { energy: -5, knowledge: 2 } },
  },
  {
    id: "ask-for-guidance",
    label: "Ask for legitimate guidance",
    detail: "Clarify the brief, then finish it yourself.",
    modifiers: { focus: 5, attendance: 3, integrity: 5 },
    effects: { stats: { social: 2, reputation: 1 } },
  },
  {
    id: "take-shortcut",
    label: "Use the answer that is going around",
    detail: "It could save time. It could also follow you.",
    modifiers: { focus: 12, integrity: -24 },
    effects: { stats: { energy: 2 } },
    risky: true,
  },
];

const pressureByField = {
  general: {
    title: "Everything lands in the same week",
    text: "Home responsibilities and coursework both need you.",
    choices: [
      { id: "protect-deadline", label: "Protect the deadline", detail: "Explain the pressure at home and finish the task.", modifiers: { focus: 8, attendance: 3 }, effects: { stats: { energy: -7, reputation: 2 } } },
      { id: "help-home-first", label: "Help at home first", detail: "Carry the family load, then study late.", modifiers: { focus: -2, attendance: -3, integrity: 2 }, effects: { stats: { energy: -9, happiness: 3 } } },
      { id: "split-the-load", label: "Ask everyone to split the load", detail: "Turn one impossible evening into a shared plan.", modifiers: { focus: 4, attendance: 1 }, effects: { stats: { social: 3 } } },
    ],
  },
  business: {
    title: "The group figures do not balance",
    text: "Your teammates want to submit before anyone notices.",
    choices: [
      { id: "recheck-figures", label: "Recheck every figure", detail: "Slow the group down and find the mistake.", modifiers: { focus: 8, integrity: 5 }, effects: { stats: { energy: -6, knowledge: 2 } } },
      { id: "submit-anyway", label: "Submit it as it is", detail: "Meet the deadline and hope the marker is kind.", modifiers: { focus: -3, integrity: -5 }, effects: { stats: { energy: 2 } } },
      { id: "call-the-group", label: "Call a quick group meeting", detail: "Share the pressure and agree on a fix.", modifiers: { focus: 4, attendance: 2 }, effects: { stats: { social: 3 } } },
    ],
  },
  technology: {
    title: "The data bundle runs out",
    text: "Your practical upload is due before midnight.",
    choices: [
      { id: "buy-data", label: "Buy emergency data", detail: "Pay now and finish without excuses.", modifiers: { focus: 7, attendance: 4 }, effects: { cash: -75, stats: { energy: -3 } } },
      { id: "find-wifi", label: "Find free Wi-Fi", detail: "Travel across town and take your chances.", modifiers: { focus: 3, attendance: 1, experience: 2 }, effects: { stats: { energy: -8 } } },
      { id: "request-extension", label: "Explain and request an extension", detail: "Be honest before the deadline passes.", modifiers: { focus: -2, integrity: 5 }, effects: { stats: { reputation: 2 } } },
    ],
  },
  trades: {
    title: "The practical tool is missing",
    text: "The team is waiting and nobody wants the blame.",
    choices: [
      { id: "report-tool", label: "Report it immediately", detail: "Lose time, protect the workshop and document the problem.", modifiers: { focus: 3, integrity: 7 }, effects: { stats: { reputation: 3 } } },
      { id: "borrow-tool", label: "Borrow from the next bay", detail: "Keep working and return it before they notice.", modifiers: { experience: 5, integrity: -3 }, effects: { stats: { energy: -4 } } },
      { id: "improvise-tool", label: "Improvise carefully", detail: "Use your hands and judgement to keep moving.", modifiers: { experience: 7, focus: 2 }, effects: { stats: { health: -3, knowledge: 2 } } },
    ],
  },
  hospitality: {
    title: "A guest complains in front of everyone",
    text: "The shift leader is busy and the queue is growing.",
    choices: [
      { id: "listen-and-fix", label: "Listen, apologise and fix it", detail: "Own the moment without blaming the team.", modifiers: { focus: 4, experience: 5 }, effects: { stats: { social: 3, reputation: 2 } } },
      { id: "call-supervisor", label: "Call the supervisor", detail: "Escalate it and keep the queue moving.", modifiers: { attendance: 2, integrity: 3 }, effects: { stats: { reputation: 1 } } },
      { id: "push-back", label: "Tell them the policy is clear", detail: "Hold your ground and risk making the scene worse.", modifiers: { focus: 2, experience: 1 }, effects: { stats: { social: -4 } } },
    ],
  },
  community: {
    title: "Two community groups want the same venue",
    text: "Both insist their programme matters more.",
    choices: [
      { id: "mediate-groups", label: "Bring both groups together", detail: "Find a timetable everyone can live with.", modifiers: { focus: 5, experience: 5 }, effects: { stats: { social: 4, reputation: 2 } } },
      { id: "first-booking", label: "Honour the first booking", detail: "Use one clear rule and accept the disappointment.", modifiers: { integrity: 5, attendance: 2 }, effects: { stats: { reputation: 1 } } },
      { id: "promise-both", label: "Promise both groups a solution", detail: "Buy time now and work out the details later.", modifiers: { focus: -3, integrity: -5 }, effects: { stats: { social: 2 } } },
    ],
  },
};

export const STUDY_DECISION_SETS = deepFreeze(Object.fromEntries(
  Object.entries(pressureByField).map(([field, pressure]) => [field, {
    strategy: {
      icon: "🗓️",
      kicker: "YOUR STUDY PLAN",
      title: "How will you make this work?",
      text: "Pick the approach you can live with for the whole programme.",
      choices: strategyChoices,
    },
    pressure: { icon: "⚡", kicker: "PRESSURE TEST", ...pressure },
    assessment: {
      icon: "📝",
      kicker: "FINAL ASSESSMENT",
      title: "This is the work that counts",
      text: "One final choice can strengthen—or complicate—your result.",
      choices: assessmentChoices,
    },
  }]),
));

const programmes = [
  {
    id: "foundation-bridge",
    title: "Foundation Bridge",
    icon: "🌉",
    route: "bridging",
    field: "general",
    durationDays: 14,
    cost: 900,
    eligibility: {},
    fundingIds: ["personal", "bursary", "existing-work", "part-time"],
    careerUnlocks: [],
    description: "Strengthen your knowledge and improve access to tougher routes.",
  },
  {
    id: "office-admin-learnership",
    title: "Office Administration Learnership",
    icon: "🗂️",
    route: "learnership",
    field: "business",
    durationDays: 21,
    cost: 600,
    stipend: 120,
    eligibility: { minExam: 35 },
    fundingIds: ["paid-learnership", "bursary", "personal"],
    careerUnlocks: ["business:assistant"],
    description: "Learn workplace admin while building practical experience.",
  },
  {
    id: "digital-support-learnership",
    title: "Digital Support Learnership",
    icon: "🖥️",
    route: "learnership",
    field: "technology",
    durationDays: 21,
    cost: 750,
    stipend: 135,
    eligibility: { minKnowledge: 42, experienceAlternative: 15 },
    fundingIds: ["paid-learnership", "bursary", "personal"],
    careerUnlocks: ["technology:support-trainee"],
    description: "Build hands-on troubleshooting and customer-support skills.",
  },
  {
    id: "construction-skills-learnership",
    title: "Construction Skills Learnership",
    icon: "🧱",
    route: "learnership",
    field: "trades",
    durationDays: 21,
    cost: 650,
    stipend: 145,
    eligibility: { minHealth: 50, minEnergy: 45, experienceAlternative: 12 },
    fundingIds: ["paid-learnership", "bursary", "personal"],
    careerUnlocks: ["trades:site-learner"],
    description: "Train safely on practical building and site work.",
  },
  {
    id: "electrical-trade-certificate",
    title: "Electrical Trade Certificate",
    icon: "⚡",
    route: "occupational",
    field: "trades",
    durationDays: 30,
    cost: 3_800,
    eligibility: { minExam: 55, minKnowledge: 45, experienceAlternative: 25, bridgeExperienceAlternative: 15 },
    fundingIds: ["personal", "bursary", "study-loan", "existing-work", "part-time"],
    careerUnlocks: ["trades:artisan-learner"],
    description: "Develop technical knowledge for an electrical artisan path.",
  },
  {
    id: "hospitality-tourism-certificate",
    title: "Hospitality & Tourism Certificate",
    icon: "🛎️",
    route: "occupational",
    field: "hospitality",
    durationDays: 30,
    cost: 3_200,
    eligibility: { minExam: 45, minReputation: 45, socialAlternative: 55, experienceAlternative: 20 },
    fundingIds: ["personal", "bursary", "study-loan", "existing-work", "part-time"],
    careerUnlocks: ["hospitality:guest-service"],
    description: "Learn guest service, bookings and everyday operations.",
  },
  {
    id: "business-finance-diploma",
    title: "Business & Finance Diploma",
    icon: "📊",
    route: "diploma",
    field: "business",
    durationDays: 30,
    cost: 6_800,
    eligibility: { minExam: 60, minKnowledge: 50, experienceAlternative: 35, bridgeExperienceAlternative: 20 },
    fundingIds: ["personal", "bursary", "study-loan", "existing-work", "part-time"],
    careerUnlocks: ["business:coordinator", "business:analyst"],
    description: "Build practical business, budgeting and reporting skills.",
  },
  {
    id: "self-taught-digital-certificate",
    title: "Self-Taught Digital Certificate",
    icon: "💻",
    route: "self-taught",
    field: "technology",
    durationDays: 21,
    cost: 600,
    eligibility: { minCash: 600, experienceAlternative: 10 },
    fundingIds: ["personal", "existing-work", "part-time"],
    careerUnlocks: ["technology:digital-trainee"],
    description: "Build a small portfolio through guided independent projects.",
  },
  {
    id: "computing-degree",
    title: "Computing Degree",
    icon: "🧑🏽‍💻",
    route: "university-style",
    field: "technology",
    durationDays: 30,
    cost: 12_000,
    eligibility: { minExam: 75, minKnowledge: 65, bridgeExperienceAlternative: 30 },
    fundingIds: ["personal", "bursary", "study-loan", "existing-work", "part-time"],
    careerUnlocks: ["technology:junior-developer", "technology:specialist"],
    description: "A compressed university-style route into computing careers.",
  },
  {
    id: "community-development-degree",
    title: "Community Development Degree",
    icon: "🤲🏽",
    route: "university-style",
    field: "community",
    durationDays: 30,
    cost: 10_500,
    eligibility: { minExam: 70, minSocial: 55, minReputation: 50, bridgeAlternative: true },
    fundingIds: ["personal", "bursary", "study-loan", "existing-work", "part-time"],
    careerUnlocks: ["community:programme-officer", "community:development-practitioner"],
    description: "Learn to plan projects and work with communities and institutions.",
  },
];

export const EDUCATION_PROGRAMMES = deepFreeze(programmes.map((programme) => ({
  ...programme,
  decisions: STUDY_DECISION_SETS[programme.field] || STUDY_DECISION_SETS.general,
})));

const PROGRAMMES_BY_ID = new Map(EDUCATION_PROGRAMMES.map((programme) => [programme.id, programme]));

export function getProgrammeById(id) {
  return PROGRAMMES_BY_ID.get(id) || null;
}

export function getFundingById(id) {
  return FUNDING_OPTIONS.find((option) => option.id === id) || null;
}
