import { JOB_OPPORTUNITIES } from "../data/jobs.js";
import { startCareer } from "./career.js";
import { startBusiness } from "./business.js";
import { scheduleDelayedEvent } from "./event-deck.js";

const clone = (value) => (
  typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value))
);

function hasActivePath(state) {
  return Boolean(state.career?.active || state.business?.active);
}

function eligibility(state, job) {
  if (hasActivePath(state)) return { eligible: false, reason: "Finish your current path first." };
  if (job.restartOnly && !state.career?.dismissed && !state.business?.closed) {
    return { eligible: false, reason: "This is available after a path ends." };
  }
  const exam = Number(state.life?.examResult?.score) || 0;
  if (job.minExam && exam < job.minExam) return { eligible: false, reason: `Needs an exam score of ${job.minExam}.` };
  if (job.minKnowledge && state.stats.knowledge < job.minKnowledge) return { eligible: false, reason: "Build more knowledge first." };
  if (job.minCash && state.finances.cash < job.minCash) return { eligible: false, reason: `Needs R${job.minCash} startup cash.` };
  return { eligible: true, reason: "" };
}

export function getAvailableJobs(state) {
  if (state.life?.stage === "school-finale" || state.life?.ended || state.jobs?.activeApplicationId) return [];
  if (hasActivePath(state)) return [];
  const restart = state.career?.dismissed || state.business?.closed;
  const regular = JOB_OPPORTUNITIES.filter((job) => !job.restartOnly);
  const selectedStartup = regular
    .filter((job) => job.type === "business")
    [(Number(state.life?.examResult?.score) || 0) % 2];
  const candidates = [regular.find((job) => job.type === "career"), selectedStartup];
  if (restart) candidates.push(JOB_OPPORTUNITIES.find((job) => job.restartOnly));
  return candidates.filter(Boolean).slice(0, 3).map((job) => ({ ...job, ...eligibility(state, job) }));
}

export function applyForJob(state, jobId) {
  const job = getAvailableJobs(state).find((item) => item.id === jobId);
  if (!job || !job.eligible) return { state, ok: false, reason: job?.reason || "Opportunity unavailable." };
  const id = `application-${state.calendar.day}-${state.jobs.applications.length + 1}`;
  const application = { id, jobId, status: job.type === "business" ? "accepted" : "pending", dueDay: state.calendar.day + 1 };
  let next = clone(state);
  next.jobs.applications.push(application);
  next.jobs.activeApplicationId = id;

  if (job.type === "business") {
    next = startBusiness(next, job.pathId);
    next.jobs.applications = next.jobs.applications.map((item) => item.id === id ? { ...item, status: "accepted" } : item);
    next.jobs.activeApplicationId = null;
    next.dailyState.phase = "complete";
    next.dailyState.complete = true;
    next.dailyState.result = `You started ${job.title}. Tomorrow, the real work begins.`;
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

export function resolveJobApplication(state, applicationId) {
  const application = state.jobs?.applications?.find((item) => item.id === applicationId);
  if (!application || application.status !== "pending") return { state, resolved: false, accepted: false };
  const job = JOB_OPPORTUNITIES.find((item) => item.id === application.jobId);
  if (!job) return { state, resolved: false, accepted: false };
  const strength = (Number(state.life?.examResult?.score) || 0) + state.stats.knowledge + state.stats.reputation;
  const accepted = strength >= 105;
  let next = clone(state);
  next.jobs.applications = next.jobs.applications.map((item) => (
    item.id === applicationId ? { ...item, status: accepted ? "accepted" : "declined" } : item
  ));
  next.jobs.activeApplicationId = null;
  if (accepted) next = startCareer(next, job.pathId);
  next.jobs.lastResult = {
    applicationId,
    accepted,
    message: accepted ? `You got the ${job.title} role.` : `${job.title} said no this time. Another path is still open.`,
  };
  return { state: next, resolved: true, accepted };
}
