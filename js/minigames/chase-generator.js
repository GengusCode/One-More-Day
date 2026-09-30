const TYPES = Object.freeze(["pothole", "crate", "trolley", "pedestrian", "parked-taxi", "roadworks"]);

export function createSeededRandom(seed = 1) {
  let value = (Number(seed) >>> 0) || 1;
  return () => {
    value += 0x6D2B79F5;
    let result = value;
    result = Math.imul(result ^ result >>> 15, result | 1);
    result ^= result + Math.imul(result ^ result >>> 7, result | 61);
    return ((result ^ result >>> 14) >>> 0) / 4294967296;
  };
}

export function createObstacleSequence({
  seed = 1,
  durationMs = 25_000,
  minObstacles = 6,
  maxObstacles = 8,
  laneChangeMs = 230,
} = {}) {
  const random = createSeededRandom(seed);
  const count = minObstacles + Math.floor(random() * (maxObstacles - minObstacles + 1));
  const first = Math.max(2_100, laneChangeMs * 4);
  const usable = Math.max(1, durationMs - first - 1_900);
  const gap = usable / Math.max(1, count - 1);
  const obstacles = [];
  let previousLane = 1;
  for (let index = 0; index < count; index += 1) {
    let lane = Math.floor(random() * 3);
    if (index > 0 && lane === previousLane && random() < 0.65) lane = (lane + 1 + Math.floor(random() * 2)) % 3;
    const startMs = Math.round(first + index * gap + (random() - 0.5) * Math.min(280, gap * 0.25));
    const clearMs = Math.min(durationMs - 500, startMs + 650 + Math.floor(random() * 260));
    obstacles.push({
      id: "obstacle-" + (index + 1),
      type: TYPES[Math.floor(random() * TYPES.length)],
      lane,
      startMs,
      clearMs,
      visualVariant: Math.floor(random() * 4),
    });
    previousLane = lane;
  }
  return obstacles.sort((a, b) => a.startMs - b.startMs);
}

export function getSafeLanes(sequence, timeMs) {
  const blocked = new Set(
    sequence.filter((obstacle) => obstacle.startMs <= timeMs && timeMs < obstacle.clearMs).map((obstacle) => obstacle.lane),
  );
  return [0, 1, 2].filter((lane) => !blocked.has(lane));
}

export function isSequenceReachable(sequence, { laneChangeMs = 230 } = {}) {
  let reachable = new Set([1]);
  const times = [...new Set(sequence.flatMap((obstacle) => [
    Math.max(0, obstacle.startMs - laneChangeMs),
    obstacle.startMs,
    obstacle.clearMs,
  ]))].sort((a, b) => a - b);
  let previousTime = 0;
  for (const time of times) {
    const moves = Math.max(0, Math.floor((time - previousTime) / laneChangeMs));
    for (let step = 0; step < moves; step += 1) {
      const expanded = new Set(reachable);
      for (const lane of reachable) {
        if (lane > 0) expanded.add(lane - 1);
        if (lane < 2) expanded.add(lane + 1);
      }
      reachable = expanded;
    }
    const safe = new Set(getSafeLanes(sequence, time + 1));
    reachable = new Set([...reachable].filter((lane) => safe.has(lane)));
    if (!reachable.size) return false;
    previousTime = time;
  }
  return true;
}
