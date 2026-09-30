import { createObstacleSequence } from "./chase-generator.js";
import { createChaseModel, requestLaneMove, advanceChase, getChaseSnapshot } from "./chase-model.js";

export function calculateCanvasSize({ width, height, devicePixelRatio = 1 }) {
  const dpr = Math.min(2, Math.max(1, Number(devicePixelRatio) || 1));
  const cssWidth = Math.max(1, Math.round(width));
  const cssHeight = Math.max(1, Math.round(height));
  return { cssWidth, cssHeight, pixelWidth: cssWidth * dpr, pixelHeight: cssHeight * dpr, dpr };
}

export function controlDirection(key) {
  const value = String(key || "").toLowerCase();
  if (value === "arrowleft" || value === "a") return -1;
  if (value === "arrowright" || value === "d") return 1;
  return 0;
}

function drawRunner(context, canvas, snapshot, profile, reducedMotion) {
  const width = canvas.width / (window.devicePixelRatio > 2 ? 2 : Math.max(1, window.devicePixelRatio || 1));
  const height = canvas.height / (window.devicePixelRatio > 2 ? 2 : Math.max(1, window.devicePixelRatio || 1));
  context.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
  context.clearRect(0, 0, width, height);
  const sky = context.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#5bc4e8");
  sky.addColorStop(0.48, "#b3d7c4");
  sky.addColorStop(0.49, "#554a3c");
  sky.addColorStop(1, "#171816");
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);
  const horizon = height * 0.34;
  context.fillStyle = "#31443b";
  context.fillRect(0, horizon - 24, width, 28);
  const roadTop = width * 0.29;
  const roadBottom = width * 0.05;
  context.fillStyle = "#2c2c2b";
  context.beginPath();
  context.moveTo(roadTop, horizon);
  context.lineTo(width - roadTop, horizon);
  context.lineTo(width - roadBottom, height);
  context.lineTo(roadBottom, height);
  context.closePath();
  context.fill();
  context.strokeStyle = "rgba(255,245,180,.8)";
  context.lineWidth = 2;
  for (const fraction of [1 / 3, 2 / 3]) {
    context.beginPath();
    context.moveTo(width * (0.5 + (fraction - .5) * .42), horizon);
    context.lineTo(width * (0.5 + (fraction - .5) * .9), height);
    context.stroke();
  }
  const laneX = (lane, depth) => width * 0.5 + (lane - 1) * (width * (.09 + depth * .23));
  const positionFor = (obstacle) => {
    const depth = Math.max(0, Math.min(1, (snapshot.elapsedMs - obstacle.startMs + 850) / 1_500));
    return { depth, x: laneX(obstacle.lane, depth), y: horizon + depth * (height - horizon) };
  };
  for (const obstacle of snapshot.activeObstacles) {
    const place = positionFor(obstacle);
    const size = 13 + place.depth * 34;
    const styles = {
      pothole: ["#16110e", "◼"],
      crate: ["#a96732", "▣"],
      trolley: ["#b7c4c2", "⌗"],
      pedestrian: ["#253b7d", "●"],
      "parked-taxi": ["#f1bd1e", "▰"],
      roadworks: ["#f06435", "▲"],
    };
    context.fillStyle = styles[obstacle.type][0];
    context.fillRect(place.x - size / 2, place.y - size / 2, size, size * .8);
    context.fillStyle = "#fff";
    context.font = Math.max(11, size * .65) + "px sans-serif";
    context.textAlign = "center";
    context.fillText(styles[obstacle.type][1], place.x, place.y + size * .23);
  }
  const runnerDepth = .83;
  const runnerX = laneX(snapshot.lane + (snapshot.targetLane - snapshot.lane) * snapshot.laneProgress, runnerDepth);
  const runnerY = horizon + runnerDepth * (height - horizon);
  context.fillStyle = profile.gender === "woman" ? "#ef5c8d" : profile.gender === "man" ? "#2467d6" : "#7750d1";
  context.beginPath();
  context.arc(runnerX, runnerY - 32, 11, 0, Math.PI * 2);
  context.fill();
  context.fillRect(runnerX - 11, runnerY - 19, 22, 31);
  context.fillStyle = "#1c1d1b";
  context.fillRect(runnerX - 12, runnerY + 10, 8, 19);
  context.fillRect(runnerX + 4, runnerY + 10, 8, 19);
  const thiefY = horizon + 35 + (snapshot.result?.outcome === "caught" ? 90 : 0);
  context.fillStyle = "#f2b14f";
  context.beginPath();
  context.arc(width * .5, thiefY - 10, 8, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#303031";
  context.fillRect(width * .5 - 8, thiefY, 16, 22);
  if (!reducedMotion && snapshot.result?.outcome === "escaped") {
    context.fillStyle = "rgba(255,108,92,.24)";
    context.fillRect(0, 0, width, height);
  }
}

function createFallback(host, sequence, resolve) {
  const panel = document.createElement("section");
  panel.className = "chase-fallback";
  const heading = document.createElement("h2");
  heading.textContent = "Keep out of the thief's lane";
  const text = document.createElement("p");
  const controls = document.createElement("div");
  controls.className = "chase-controls";
  panel.append(heading, text, controls);
  host.replaceChildren(panel);
  let index = 0;
  let lane = 1;
  const show = () => {
    if (index >= sequence.length) return resolve({ outcome: "caught", reason: "survived", elapsedMs: 25_000 });
    const obstacle = sequence[index];
    text.textContent = "Obstacle ahead: choose a lane that is not " + ["left", "centre", "right"][obstacle.lane] + ".";
    controls.replaceChildren();
    for (const [label, target] of [["LEFT", 0], ["CENTRE", 1], ["RIGHT", 2]]) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "chase-button";
      button.textContent = label;
      button.addEventListener("click", () => {
        lane = target;
        if (lane === obstacle.lane) resolve({ outcome: "escaped", reason: "collision", elapsedMs: obstacle.startMs });
        else { index += 1; show(); }
      }, { once: true });
      controls.append(button);
    }
  };
  show();
}

export function start({
  host,
  seed = Date.now(),
  profile = { gender: "non-binary" },
  durationMs = 25_000,
  reducedMotion = false,
} = {}) {
  return new Promise((resolve) => {
    const sequence = createObstacleSequence({ seed, durationMs });
    const shell = document.createElement("section");
    shell.className = "chase-overlay";
    shell.setAttribute("role", "dialog");
    shell.setAttribute("aria-modal", "true");
    const title = document.createElement("h2");
    title.textContent = "CATCH THE THIEF";
    const status = document.createElement("p");
    status.className = "chase-status";
    status.textContent = "Swipe, use A/D or the lane buttons. One hit and he gets away.";
    const canvas = document.createElement("canvas");
    canvas.className = "chase-canvas";
    canvas.setAttribute("aria-label", "A three-lane chase. Avoid obstacles and catch the thief.");
    const controls = document.createElement("div");
    controls.className = "chase-controls";
    const left = document.createElement("button");
    const right = document.createElement("button");
    left.type = "button"; right.type = "button";
    left.className = "chase-button"; right.className = "chase-button";
    left.textContent = "← LEFT"; right.textContent = "RIGHT →";
    controls.append(left, right);
    shell.append(title, status, canvas, controls);
    host.replaceChildren(shell);
    const context = canvas.getContext("2d");
    if (!context) {
      createFallback(host, sequence, resolve);
      return;
    }
    const model = createChaseModel({ sequence, durationMs });
    let frame = 0;
    let previous = 0;
    let done = false;
    let paused = false;
    let countdownTimer = 0;
    let pointerStart = null;
    const finish = (result) => {
      if (done) return;
      done = true;
      cancelAnimationFrame(frame);
      clearInterval(countdownTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      left.removeEventListener("click", onLeft);
      right.removeEventListener("click", onRight);
      status.textContent = result.outcome === "caught" ? "You catch him and get your phone back!" : "He gets away through the crowd.";
      setTimeout(() => resolve({ ...result, seed }), reducedMotion ? 20 : 650);
    };
    const resize = () => {
      const rect = shell.getBoundingClientRect();
      const size = calculateCanvasSize({ width: Math.max(240, rect.width - 24), height: Math.max(300, Math.min(510, window.innerHeight * .58)), devicePixelRatio: window.devicePixelRatio });
      canvas.style.width = size.cssWidth + "px";
      canvas.style.height = size.cssHeight + "px";
      canvas.width = size.pixelWidth;
      canvas.height = size.pixelHeight;
    };
    const loop = (now) => {
      if (done || paused) return;
      if (!previous) previous = now;
      advanceChase(model, Math.min(50, now - previous));
      previous = now;
      const snapshot = getChaseSnapshot(model);
      drawRunner(context, canvas, snapshot, profile, reducedMotion);
      status.textContent = snapshot.result
        ? (snapshot.result.outcome === "caught" ? "You caught him!" : "Obstacle hit — he gets away.")
        : "DISTANCE " + snapshot.distance + "%";
      if (snapshot.result) finish(snapshot.result);
      else frame = requestAnimationFrame(loop);
    };
    const move = (direction) => requestLaneMove(model, direction);
    const onLeft = () => move(-1);
    const onRight = () => move(1);
    const onKey = (event) => {
      const direction = controlDirection(event.key);
      if (!direction) return;
      event.preventDefault();
      move(direction);
    };
    const onPointerDown = (event) => { pointerStart = event.clientX; };
    const onPointerUp = (event) => {
      if (pointerStart === null) return;
      const delta = event.clientX - pointerStart;
      pointerStart = null;
      if (Math.abs(delta) >= 26) move(delta < 0 ? -1 : 1);
    };
    const onVisibility = () => {
      if (document.hidden) {
        paused = true;
        cancelAnimationFrame(frame);
        status.textContent = "CHASE PAUSED";
      } else if (paused && !done) {
        let count = 3;
        status.textContent = "RESUMING IN " + count;
        clearInterval(countdownTimer);
        countdownTimer = setInterval(() => {
          count -= 1;
          if (count <= 0) {
            clearInterval(countdownTimer);
            paused = false;
            previous = 0;
            frame = requestAnimationFrame(loop);
          } else status.textContent = "RESUMING IN " + count;
        }, 1000);
      }
    };
    resize();
    window.addEventListener("resize", resize);
    left.addEventListener("click", onLeft);
    right.addEventListener("click", onRight);
    window.addEventListener("keydown", onKey);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    document.addEventListener("visibilitychange", onVisibility);
    left.focus?.({ preventScroll: true });
    frame = requestAnimationFrame(loop);
  });
}
