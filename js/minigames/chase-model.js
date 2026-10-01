const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function createChaseModel({
  sequence = [],
  durationMs = 25_000,
  laneChangeMs = 230,
} = {}) {
  return {
    sequence,
    durationMs,
    laneChangeMs,
    elapsedMs: 0,
    lane: 1,
    targetLane: 1,
    transitionMs: 0,
    queuedDirection: 0,
    phase: "running",
    result: null,
  };
}

export function requestLaneMove(model, direction) {
  const move = direction < 0 ? -1 : direction > 0 ? 1 : 0;
  if (!move || model.phase !== "running") return model;
  if (model.transitionMs > 0) {
    if (!model.queuedDirection) model.queuedDirection = move;
    return model;
  }
  const target = clamp(model.lane + move, 0, 2);
  if (target === model.lane) return model;
  model.targetLane = target;
  model.transitionMs = model.laneChangeMs;
  return model;
}

function playerLane(model) {
  if (model.transitionMs <= 0) return model.lane;
  const progress = 1 - model.transitionMs / model.laneChangeMs;
  return model.lane + (model.targetLane - model.lane) * progress * progress * (3 - 2 * progress);
}

function collides(model) {
  const lane = playerLane(model);
  return model.sequence.some((obstacle) => (
    obstacle.startMs <= model.elapsedMs
    && model.elapsedMs < obstacle.clearMs
    && Math.abs(obstacle.lane - lane) < 0.34
  ));
}

export function advanceChase(model, deltaMs) {
  if (model.phase !== "running") return model;
  const elapsed = Math.max(0, Number(deltaMs) || 0);
  model.elapsedMs = Math.min(model.durationMs, model.elapsedMs + elapsed);
  if (model.transitionMs > 0) {
    model.transitionMs = Math.max(0, model.transitionMs - elapsed);
    if (model.transitionMs === 0) {
      model.lane = model.targetLane;
      if (model.queuedDirection) {
        const queued = model.queuedDirection;
        model.queuedDirection = 0;
        requestLaneMove(model, queued);
      }
    }
  }
  if (collides(model)) {
    model.phase = "finished";
    model.result = { outcome: "escaped", reason: "collision", elapsedMs: model.elapsedMs };
    return model;
  }
  if (model.elapsedMs >= model.durationMs) {
    model.phase = "finished";
    model.result = { outcome: "caught", reason: "survived", elapsedMs: model.elapsedMs };
  }
  return model;
}

export function getChaseSnapshot(model) {
  const progress = model.transitionMs > 0 ? 1 - model.transitionMs / model.laneChangeMs : 1;
  return {
    phase: model.phase,
    lane: model.lane,
    targetLane: model.targetLane,
    laneProgress: progress,
    queuedDirection: model.queuedDirection,
    elapsedMs: model.elapsedMs,
    durationMs: model.durationMs,
    distance: Math.round(model.elapsedMs / model.durationMs * 100),
    visibleObstacles: model.sequence.filter(item => item.startMs - 1800 <= model.elapsedMs && model.elapsedMs < item.clearMs).map(item => ({
      ...item,
      depth: model.elapsedMs < item.startMs
        ? 0.83 * (model.elapsedMs - item.startMs + 1800) / 1800
        : 0.83 + 0.25 * (model.elapsedMs - item.startMs) / Math.max(1, item.clearMs - item.startMs),
    })),
    activeObstacles: model.sequence.filter((item) => item.startMs <= model.elapsedMs && model.elapsedMs < item.clearMs),
    result: model.result,
  };
}
