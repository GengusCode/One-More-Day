import {
  JOB_OPPORTUNITIES,
  CAREER_FAMILIES,
  EMPLOYER_CULTURES,
} from "../data/jobs.js";
import { startCareer } from "./career.js";
import { startBusiness } from "./business.js";
import { scheduleDelayedEvent } from "./event-deck.js";

const clone = (value) => (
  typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value))
);

const INTERVIEW_CHOICES = Object.freeze([
  { id: "show-examples", label: "Use examples from real work", detail: "Show what you did, what changed and what you learned.", answerFit: 16 },
  { id: "connect-with-team", label: "Explain how you work with people", detail: "Make the answer about trust, communication and delivery.", answerFit: 11 },
  { id: "ask-good-question", label: "Ask one thoughtful question", detail: "Show that you understand the role before chasing the title.", answerFit: 10 },
  { id: "oversell", label: "Promise you can handle everything", detail: "Sound confident and hope they do not test the details.", answerFit: -25 },
]);

function stableNumber(input) {
  let hash = 2166136261;
  for (const character of String(input)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function hasActivePath(state) {
  return Boolean(state.career?.active || state.business?.active);
}

function studyOccupiesWorkPath(state) {
  return Boolean(
    state.education?.active
    && ["part-time", "paid-learnership"].includes(state.education.active.fundingId),
  );
}

function getFamily(id) {
  return CAREER_FAMILIES.find((family) => family.id === id) || null;
}

function getEmployer(id) {
  return EMPLOYER_CULTURES.find((culture) => culture.id === id)
    || EMPLOYER_CULTURES.find((culture) => culture.id === "neutral");
}

function completedResults(state) {
  return (state.education?.completed || []).filter((entry) => entry && typeof entry === "object");
}

function relevantExperience(state, familyId) {
  const stored = Math.max(0, Number(state.education?.accessModifiers?.experienceByField?.[familyId]) || 0);
  const previous = state.career?.familyId === familyId
    ? Math.max(0, Number(state.career?.experience) || 0)
    : 0;
  return Math.max(stored, previous);
}

function roleEligibility(state, family, role, roleIndex) {
  const knowledgeFloor = Math.max(20, Number(role.knowledge) - 15);
  const reputationFloor = Math.max(20, Number(role.reputation) - 15);
  const statReady = (Number(state.stats?.knowledge) || 0) >= knowledgeFloor
    && (Number(state.stats?.reputation) || 0) >= reputationFloor;
  if (roleIndex === 0) {
    return statReady
      ? { eligible: true, reason: "" }
      : { eligible: false, reason: "Build knowledge and reputation for this entry role." };
  }

  const completed = completedResults(state);
  const qualification = role.minQualifications.some((id) => (
    completed.some((entry) => entry.programmeId === id && ["pass", "distinction"].includes(entry.outcome))
  ));
  const experience = relevantExperience(state, family.id);
  const experiencePass = role.experienceAlternative && experience >= role.minExperience;
  if (!qualification && !experiencePass) {
    return {
      eligible: false,
      reason: role.experienceAlternative
        ? "Needs a relevant qualification or more practical experience."
        : "Needs a relevant qualification.",
    };
  }
  if (!statReady) {
    return { eligible: false, reason: "Build knowledge and reputation before applying." };
  }
  return { eligible: true, reason: "" };
}

function legacyEligibility(state, job) {
  if (job.restartOnly && !state.career?.dismissed && !state.business?.closed) {
    return { eligible: false, reason: "This is available after a path ends." };
  }
  const exam = Number(state.life?.examResult?.score) || 0;
  if (job.minExam && exam < job.minExam) return { eligible: false, reason: "Needs an exam score of " + job.minExam + "." };
  if (job.minKnowledge && state.stats.knowledge < job.minKnowledge) return { eligible: false, reason: "Build more knowledge first." };
  if (job.minCash && state.finances.cash < job.minCash) return { eligible: false, reason: "Needs R" + job.minCash + " startup cash." };
  return { eligible: true, reason: "" };
}

function careerOpenings(state) {
  const day = Math.max(1, Math.round(Number(state.calendar?.day) || 1));
  const windowId = Math.floor((day - 1) / 7);
  const seed = (state.profile?.name || "player") + ":" + windowId;
  const openings = [];

  for (const family of CAREER_FAMILIES) {
    family.roles.slice(0, 3).forEach((role, roleIndex) => {
      const employer = EMPLOYER_CULTURES[
        stableNumber(seed + ":" + family.id + ":" + role.id) % EMPLOYER_CULTURES.length
      ];
      const openingKey = family.id + ":" + role.id + ":" + employer.id;
      if (Number(state.career?.openingCooldowns?.[openingKey]) > day) return;
      const access = roleEligibility(state, family, role, roleIndex);
      openings.push({
        id: "opening-" + family.id + "-" + role.id + "-" + employer.id + "-w" + windowId,
        openingKey,
        icon: family.icon,
        title: role.name,
        type: "career",
        pathId: family.id,
        familyId: family.id,
        roleId: role.id,
        roleIndex,
        employerId: employer.id,
        employerTitle: employer.title,
        startingSalary: role.salary,
        windowId,
        eligible: access.eligible,
        reason: access.reason,
        detail: employer.title + " · R" + role.salary + " per workday",
      });
    });
  }

  return openings.sort((a, b) => (
    Number(b.eligible) - Number(a.eligible)
    || b.roleIndex - a.roleIndex
    || (stableNumber(seed + ":" + a.id) - stableNumber(seed + ":" + b.id))
  ));
}

function startupOpenings(state) {
  const restart = state.career?.dismissed || state.business?.closed;
  return JOB_OPPORTUNITIES
    .filter((job) => job.type === "business" && (!job.restartOnly || restart))
    .map((job) => ({ ...job, ...legacyEligibility(state, job) }))
    .sort((a, b) => Number(b.eligible) - Number(a.eligible) || a.id.localeCompare(b.id));
}

function addStableReferral(state, openings) {
  const person = Object.values(state.relationships?.people || {})
    .filter((entry) => ["friend", "mentor"].includes(String(entry?.type || "").toLowerCase()) && Number(entry.score) >= 75)
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))[0];
  const careerCards = openings.filter((opening) => opening.type === "career");
  if (!person || !careerCards.length) return openings;
  const windowId = Math.floor((Math.max(1, Number(state.calendar?.day) || 1) - 1) / 7);
  const selected = careerCards[
    stableNumber((state.profile?.name || "player") + ":" + person.id + ":" + windowId) % careerCards.length
  ];
  return openings.map((opening) => (
    opening.id === selected.id
      ? { ...opening, referralPersonId: person.id, referralName: person.name }
      : opening
  ));
}

export function getAvailableJobs(state, { limit = 3 } = {}) {
  if (state.life?.stage === "school-finale" || state.life?.ended) return [];
  if (state.jobs?.activeApplicationId || state.jobs?.pendingInterview) return [];
  if (hasActivePath(state) || studyOccupiesWorkPath(state)) return [];

  const safeLimit = Math.max(1, Math.min(30, Math.round(Number(limit) || 3)));
  const careers = careerOpenings(state);
  const startups = startupOpenings(state);
  let selected;
  if (safeLimit <= 3 && startups.length) {
    selected = [
      ...careers.filter((opening) => opening.eligible).slice(0, Math.max(1, safeLimit - 1)),
      startups[stableNumber((state.profile?.name || "player") + ":" + state.calendar.day) % startups.length],
    ].slice(0, safeLimit);
    if (selected.length < safeLimit) {
      selected.push(...careers.filter((opening) => !selected.some((item) => item.id === opening.id)).slice(0, safeLimit - selected.length));
    }
  } else {
    selected = [...careers, ...startups].slice(0, safeLimit);
  }
  return addStableReferral(state, selected);
}

function findOpening(state, openingId) {
  return getAvailableJobs(state, { limit: 30 }).find((opening) => opening.id === openingId) || null;
}

export function applyForJob(state, jobId) {
  const job = findOpening(state, jobId);
  if (!job || !job.eligible) {
    return { state, ok: false, reason: job?.reason || "Opportunity unavailable." };
  }

  const id = "application-" + state.calendar.day + "-" + (state.jobs.applications.length + 1);
  const application = {
    id,
    jobId,
    status: job.type === "business" ? "accepted" : "pending",
    dueDay: state.calendar.day + 1,
    opening: job.type === "career" ? {
      id: job.id,
      openingKey: job.openingKey,
      title: job.title,
      familyId: job.familyId,
      roleId: job.roleId,
      roleIndex: job.roleIndex,
      employerId: job.employerId,
      referralPersonId: job.referralPersonId || null,
    } : null,
  };
  let next = clone(state);
  next.jobs.applications.push(application);
  next.jobs.activeApplicationId = id;

  if (job.type === "business") {
    next = startBusiness(next, job.pathId);
    next.jobs.applications = next.jobs.applications.map((item) => (
      item.id === id ? { ...item, status: "accepted" } : item
    ));
    next.jobs.activeApplicationId = null;
    next.dailyState.phase = "complete";
    next.dailyState.complete = true;
    next.dailyState.result = "You started " + job.title + ". Tomorrow, the real work begins.";
    return { state: next, ok: true, status: "accepted", applicationId: id };
  }

  next = scheduleDelayedEvent(next, {
    dueDay: application.dueDay,
    eventId: "job-application",
    outcomeId: id,
    severity: 5,
    payload: { applicationId: id, highImpact: true },
  });
  next.dailyState.phase = "complete";
  next.dailyState.complete = true;
  next.dailyState.result = "Application sent. You should hear back tomorrow.";
  return { state: next, ok: true, status: "pending", applicationId: id };
}

function legacyOpening(application) {
  const job = JOB_OPPORTUNITIES.find((entry) => entry.id === application.jobId && entry.type === "career");
  if (!job) return null;
  const familyId = job.pathId === "office" ? "business"
    : job.pathId === "retail" ? "hospitality"
      : job.pathId === "logistics" ? "trades"
        : job.pathId;
  const family = getFamily(familyId) || getFamily("business");
  const roleIndex = Math.max(0, Math.min(2, Number(job.startRoleIndex) || 0));
  return {
    id: job.id,
    openingKey: family.id + ":" + family.roles[roleIndex].id + ":neutral",
    title: job.title,
    familyId: family.id,
    roleId: family.roles[roleIndex].id,
    roleIndex,
    employerId: "neutral",
    referralPersonId: null,
  };
}

export function resolveJobApplication(state, applicationId) {
  const application = state.jobs?.applications?.find((item) => item.id === applicationId);
  if (!application || application.status !== "pending") {
    return { state, resolved: false, accepted: false, interviewScheduled: false };
  }
  const opening = application.opening || legacyOpening(application);
  let next = clone(state);
  if (!opening || !getFamily(opening.familyId)) {
    next.jobs.applications = next.jobs.applications.map((item) => (
      item.id === applicationId ? { ...item, status: "declined" } : item
    ));
    next.jobs.activeApplicationId = null;
    next.jobs.lastResult = {
      applicationId,
      accepted: false,
      message: "That opening expired. The Jobs app has fresh options.",
    };
    return { state: next, resolved: true, accepted: false, interviewScheduled: false };
  }

  const employer = getEmployer(opening.employerId);
  next.jobs.applications = next.jobs.applications.map((item) => (
    item.id === applicationId ? { ...item, status: "interview" } : item
  ));
  next.jobs.pendingInterview = {
    applicationId,
    openingId: opening.id,
    openingKey: opening.openingKey,
    title: opening.title,
    familyId: opening.familyId,
    roleId: opening.roleId,
    roleIndex: opening.roleIndex,
    employerId: employer.id,
    referralPersonId: opening.referralPersonId || null,
  };
  next.jobs.lastResult = {
    applicationId,
    accepted: false,
    interviewScheduled: true,
    message: opening.title + " invited you to a short interview.",
  };
  return { state: next, resolved: true, accepted: false, interviewScheduled: true };
}

function pendingRole(state) {
  const pending = state.jobs?.pendingInterview;
  const family = getFamily(pending?.familyId);
  const role = family?.roles?.find((entry) => entry.id === pending?.roleId);
  return { pending, family, role };
}

export function getInterviewDecision(state) {
  if (state.life?.ended || state.life?.stage === "ended") return null;
  const { pending, family, role } = pendingRole(state);
  if (!pending) return null;
  if (!family || !role) {
    return {
      icon: "⚠️",
      kicker: "INTERVIEW UPDATE",
      title: "This interview is unavailable",
      text: "Close the expired invitation and return to Jobs.",
      choices: [{ id: "close-invalid", label: "Close invitation", detail: "Your other progress will stay safe.", action: "RESOLVE_INTERVIEW" }],
    };
  }
  const employer = getEmployer(pending.employerId);
  return {
    icon: family.icon,
    kicker: "JOB INTERVIEW · " + employer.title.toUpperCase(),
    title: "Interview for " + role.name,
    text: pending.referralPersonId
      ? "Your reference opened the door. Your answer still decides what happens next."
      : "One clear answer can turn this application into a real opportunity.",
    choices: INTERVIEW_CHOICES.map((choice) => ({ ...choice, action: "RESOLVE_INTERVIEW" })),
  };
}

export function resolveInterview(state, choiceId, { random = Math.random } = {}) {
  if (state.life?.ended || state.life?.stage === "ended") {
    return { state, ok: false, status: { accepted: false, reason: "life-ended" } };
  }
  if (studyOccupiesWorkPath(state)) {
    return { state, ok: false, status: { accepted: false, reason: "study-work-conflict" } };
  }
  const { pending, family, role } = pendingRole(state);
  if (!pending || !family || !role) {
    if (choiceId !== "close-invalid" || !state.jobs?.pendingInterview) {
      return { state, ok: false, status: { accepted: false, reason: "invalid-interview" } };
    }
    const next = clone(state);
    next.jobs.pendingInterview = null;
    next.jobs.activeApplicationId = null;
    next.jobs.lastResult = {
      applicationId: pending?.applicationId || null,
      accepted: false,
      message: "The expired interview was closed. You can apply again.",
    };
    return { state: next, ok: true, status: { accepted: false, reason: "invalid-closed" } };
  }

  const choice = INTERVIEW_CHOICES.find((entry) => entry.id === choiceId);
  if (!choice) return { state, ok: false, status: { accepted: false, reason: "invalid-choice" } };

  const access = roleEligibility(state, family, role, family.roles.indexOf(role));
  const relevantResults = completedResults(state).filter((result) => role.minQualifications.includes(result.programmeId));
  const qualificationBonus = relevantResults.some((result) => result.outcome === "distinction") ? 12
    : relevantResults.length ? 8 : 0;
  const experience = relevantExperience(state, family.id);
  const experienceBonus = Math.min(10, (experience / Math.max(1, role.minExperience || 20)) * 10);
  const reference = state.relationships?.people?.[pending.referralPersonId];
  const referenceBonus = Number(reference?.score) >= 75 ? 8 + Math.min(4, (Number(reference.score) - 75) * 0.15) : 0;
  const employer = getEmployer(pending.employerId);
  const cultureChoice = {
    "results-first": "show-examples",
    "people-first": "connect-with-team",
    structured: "ask-good-question",
    innovative: "ask-good-question",
  }[employer.id];
  const cultureBonus = cultureChoice === choiceId ? 5 : 0;
  const dismissalPenalty = state.career?.dismissed
    || state.career?.conductHistory?.some((entry) => entry.outcome === "dismissal")
    ? 8
    : 0;
  const score = (access.eligible ? 15 : -20)
    + (Number(state.life?.examResult?.score) || 0) * 0.1
    + (Number(state.stats?.knowledge) || 0) * 0.15
    + (Number(state.stats?.reputation) || 0) * 0.15
    + qualificationBonus
    + experienceBonus
    + referenceBonus
    + choice.answerFit
    + cultureBonus
    + (1 - Math.max(0, Math.min(1, Number(random()) || 0))) * 15
    - dismissalPenalty;
  const accepted = access.eligible && score >= 62;
  let next = clone(state);
  const record = {
    id: "interview-" + next.calendar.day + "-" + (next.career.interviewHistory.length + 1),
    type: "job",
    day: next.calendar.day,
    applicationId: pending.applicationId,
    openingId: pending.openingId,
    familyId: family.id,
    roleId: role.id,
    employerId: employer.id,
    choiceId,
    score: Math.round(score),
    outcome: accepted ? "accepted" : "declined",
  };

  if (accepted) {
    next = startCareer(next, family.id, {
      roleIndex: family.roles.indexOf(role),
      employerId: employer.id,
    });
  } else {
    next.career.openingCooldowns[pending.openingKey] = next.calendar.day + 7;
  }
  next.career.interviewHistory = [...next.career.interviewHistory, record].slice(-40);
  next.jobs.applications = next.jobs.applications.map((item) => (
    item.id === pending.applicationId ? { ...item, status: accepted ? "accepted" : "declined" } : item
  ));
  next.jobs.pendingInterview = null;
  next.jobs.activeApplicationId = null;
  next.jobs.lastResult = {
    applicationId: pending.applicationId,
    accepted,
    message: accepted
      ? "You got the " + role.name + " role."
      : role.name + " said no this time. Another opening is still available.",
  };
  return {
    state: next,
    ok: true,
    status: { accepted, reason: accepted ? "accepted" : "declined", score: Math.round(score) },
  };
}
