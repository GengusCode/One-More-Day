import {
  EDUCATION_PROGRAMMES,
  getProgrammeById,
} from "../data/education.js";

const BRIDGE_ID = "foundation-bridge";

function completedProgrammeIds(state) {
  return new Set((state.education?.completed || []).flatMap((entry) => {
    if (typeof entry === "string") return [entry];
    return typeof entry?.programmeId === "string" ? [entry.programmeId] : [];
  }));
}

function examScore(state) {
  const explicit = Number(state.life?.examResult?.score);
  if (Number.isFinite(explicit)) return Math.max(0, Math.min(100, explicit));
  return { strong: 80, pass: 60, developing: 40 }[state.life?.examResult?.band] || 40;
}

function relevantExperience(state, field) {
  const stored = Math.max(0, Number(state.education?.accessModifiers?.experienceByField?.[field]) || 0);
  const familyId = state.career?.familyId
    || (state.career?.pathId === "office" ? "business" : null);
  const career = state.career?.active && familyId === field
    ? Math.max(0, Number(state.career?.experience) || Number(state.career?.readiness) || 0)
    : 0;
  return stored + career;
}

function recoveryHint(key, requirement, hasBridge) {
  const hints = {
    minExam: hasBridge
      ? `Build relevant experience or improve your exam result to ${requirement}.`
      : `Complete the Foundation Bridge or improve your exam result to ${requirement}.`,
    minKnowledge: `Raise Knowledge to ${requirement} or gain relevant work experience.`,
    minHealth: `Recover Health to ${requirement} before starting this physical route.`,
    minEnergy: `Recover Energy to ${requirement} before starting this demanding route.`,
    minReputation: `Build Reputation to ${requirement} through reliable choices or work.`,
    minSocial: `Build Social to ${requirement} through people and community choices.`,
    minCash: `Save R${requirement.toLocaleString("en-ZA")} or gain relevant experience first.`,
  };
  return hints[key] || "Build your results or relevant experience, then try again.";
}

export function getStudyEligibility(state, programmeId) {
  const programme = getProgrammeById(programmeId);
  if (!programme) {
    return {
      eligible: false,
      reason: "That programme is no longer available.",
      unlockHint: "Choose another study route.",
    };
  }

  const stage = state.life?.stage;
  if (stage === "school-finale") {
    return {
      eligible: false,
      reason: "School is not finished yet.",
      unlockHint: "Complete your final school day first.",
    };
  }
  if (stage === "ended") {
    return {
      eligible: false,
      reason: "This life has ended.",
      unlockHint: "Start a new life to study again.",
    };
  }
  if (!state.dailyState?.complete) {
    return {
      eligible: false,
      reason: "Finish today's decision before enrolling.",
      unlockHint: "Complete the current day, then open Study again.",
    };
  }
  if (state.education?.active) {
    return {
      eligible: false,
      reason: "You already have an active programme.",
      unlockHint: "Finish or withdraw from it before starting another.",
    };
  }

  const requirements = programme.eligibility || {};
  const completed = completedProgrammeIds(state);
  const hasBridge = completed.has(BRIDGE_ID);
  const bridgeBonus = Math.max(0, Number(state.education?.accessModifiers?.bridgeBonus) || 0);
  const experience = relevantExperience(state, programme.field);

  if (requirements.prerequisiteId && !completed.has(requirements.prerequisiteId)) {
    const prerequisite = getProgrammeById(requirements.prerequisiteId);
    return {
      eligible: false,
      reason: "A prerequisite is still missing.",
      unlockHint: `Complete ${prerequisite?.title || "the required qualification"} first.`,
    };
  }

  const experiencePass = Number.isFinite(requirements.experienceAlternative)
    && experience >= requirements.experienceAlternative;
  const bridgeExperiencePass = Number.isFinite(requirements.bridgeExperienceAlternative)
    && hasBridge
    && experience >= requirements.bridgeExperienceAlternative;
  const bridgePass = Boolean(requirements.bridgeAlternative && hasBridge);
  if (experiencePass || bridgeExperiencePass || bridgePass) {
    return { eligible: true, reason: "", unlockHint: "" };
  }

  const values = {
    minExam: examScore(state) + bridgeBonus,
    minKnowledge: Number(state.stats?.knowledge) || 0,
    minHealth: Number(state.stats?.health) || 0,
    minEnergy: Number(state.stats?.energy) || 0,
    minReputation: Number(state.stats?.reputation) || 0,
    minSocial: Number(state.stats?.social) || 0,
    minCash: Number(state.finances?.cash) || 0,
  };
  const labels = {
    minExam: "Your current access result is below the entry level.",
    minKnowledge: "Your Knowledge is below the entry level.",
    minHealth: "Your Health is too low for this physical route.",
    minEnergy: "Your Energy is too low for this demanding route.",
    minReputation: "Your Reputation is below the entry level.",
    minSocial: "Your Social skill is below the entry level.",
    minCash: "You cannot yet cover the self-guided setup cost.",
  };

  for (const key of Object.keys(values)) {
    const required = Number(requirements[key]);
    if (!Number.isFinite(required) || values[key] >= required) continue;
    return {
      eligible: false,
      reason: labels[key],
      unlockHint: recoveryHint(key, required, hasBridge),
    };
  }

  return { eligible: true, reason: "", unlockHint: "" };
}

function availableFundingIds(state, programme) {
  const isWorking = Boolean(state.career?.active || state.business?.active);
  return programme.fundingIds.filter((fundingId) => {
    if (fundingId === "existing-work") return isWorking;
    if (fundingId === "part-time") return !isWorking;
    return true;
  });
}

export function getStudyOptions(state) {
  return EDUCATION_PROGRAMMES.map((programme) => {
    const eligibility = getStudyEligibility(state, programme.id);
    return {
      ...programme,
      ...eligibility,
      availableFundingIds: availableFundingIds(state, programme),
    };
  });
}
