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

function drawPerson(context, x, feetY, scale, colour, time, reducedMotion) {
  const stride = reducedMotion ? 0.2 : Math.sin(time / 95);
  const bob = reducedMotion ? 0 : Math.abs(Math.sin(time / 95)) * 3 * scale;
  const y = feetY - bob;
  context.fillStyle = "rgba(0,0,0,.25)";
  context.beginPath(); context.arc(x, feetY + 2, 13 * scale, 0, Math.PI * 2); context.fill();
  const limb = (points, colour, thickness) => {
    context.strokeStyle = colour; context.lineWidth = thickness * scale; context.lineCap = "round";
    context.beginPath(); context.moveTo(x + points[0][0] * scale, y + points[0][1] * scale);
    for (const [px, py] of points.slice(1)) context.lineTo(x + px * scale, y + py * scale);
    context.stroke();
  };
  limb([[-5,-27],[-8 + stride * 9,-14],[-8 + stride * 13,0]], "#172332", 7);
  limb([[5,-27],[8 - stride * 9,-14],[8 - stride * 13,0]], "#172332", 7);
  limb([[-9,-48],[-17,-34 + stride * 8],[-10,-28 + stride * 8]], "#b87951", 6);
  limb([[9,-48],[17,-34 - stride * 8],[10,-28 - stride * 8]], "#b87951", 6);
  context.fillStyle = colour; context.fillRect(x - 11 * scale, y - 52 * scale, 22 * scale, 29 * scale);
  context.fillStyle = "#b87951";
  context.beginPath(); context.arc(x, y - 64 * scale, 10 * scale, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#20232b"; context.fillRect(x - 10 * scale, y - 73 * scale, 20 * scale, 7 * scale);
  context.fillStyle = "#f4f6f0";
  context.fillRect(x - (10 - stride * 13) * scale, y - 2 * scale, 10 * scale, 5 * scale);
  context.fillRect(x + (3 - stride * 13) * scale, y - 2 * scale, 10 * scale, 5 * scale);
}

function drawRunner(context, canvas, snapshot, profile, reducedMotion) {
  const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);
  const sky = context.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#5bc4e8"); sky.addColorStop(0.48, "#b3d7c4"); sky.addColorStop(1, "#171816");
  context.fillStyle = sky; context.fillRect(0, 0, width, height);
  const horizon = height * 0.28;
  context.fillStyle = "#536b59";
  for (let i = 0; i < 10; i++) context.fillRect(i * width / 10, horizon - 25 - (i % 3) * 14, width / 9, 45);
  context.fillStyle = "#30343a";
  context.beginPath(); context.moveTo(width * .29, horizon); context.lineTo(width * .71, horizon);
  context.lineTo(width * .95, height); context.lineTo(width * .05, height); context.closePath(); context.fill();
  const laneX = (lane, depth) => width * .5 + (lane - 1) * width * (.09 + depth * .23);
  const yAt = depth => horizon + depth * (height - horizon);
  context.strokeStyle = "#e7dbad"; context.lineWidth = 2; context.lineCap = "butt";
  const scroll = reducedMotion ? 0 : (snapshot.elapsedMs / 1100) % 1;
  for (let i = 0; i < 8; i++) {
    const depth = ((i + scroll) / 8) ** 1.6;
    for (const lane of [.5,1.5]) {
      context.beginPath(); context.moveTo(laneX(lane, depth), yAt(depth));
      context.lineTo(laneX(lane, Math.min(1,depth+.045)), yAt(Math.min(1,depth+.045))); context.stroke();
    }
  }
  const thiefDepth = .19 + snapshot.distance / 100 * .44;
  drawPerson(context, laneX(1,thiefDepth), yAt(thiefDepth), .35 + thiefDepth * .5, "#f2b14f", snapshot.elapsedMs + 60, reducedMotion);
  for (const obstacle of [...snapshot.visibleObstacles].sort((a,b)=>a.depth-b.depth)) {
    const depth = obstacle.depth;
    const x = laneX(obstacle.lane, depth), y = yAt(depth);
    const size = 12 + depth * 43;
    const blocked = snapshot.elapsedMs >= obstacle.startMs;
    context.fillStyle = blocked ? "rgba(255,65,60,.32)" : "rgba(255,190,65,.2)";
    context.fillRect(x-size*.8, y-size*.18, size*1.6, size*.36);
    if (obstacle.type === "pedestrian") {
      drawPerson(context,x,y,.25+depth*.55,"#886ac1",0,true);
    } else if (obstacle.type === "pothole") {
      context.fillStyle = "#131820";
      context.beginPath(); context.moveTo(x-size*.6,y); context.lineTo(x-size*.3,y-size*.2);
      context.lineTo(x+size*.5,y-size*.15); context.lineTo(x+size*.6,y+size*.1); context.closePath(); context.fill();
    } else if (obstacle.type === "roadworks") {
      context.fillStyle = "#ff783f";
      context.beginPath(); context.moveTo(x,y-size);context.lineTo(x-size*.45,y);context.lineTo(x+size*.45,y);context.closePath();context.fill();
      context.fillStyle="#fff";context.fillRect(x-size*.2,y-size*.45,size*.4,size*.13);
    } else {
      context.fillStyle = obstacle.type === "parked-taxi" ? "#f2cb46" : obstacle.type === "crate" ? "#a96732" : "#99b7bc";
      context.fillRect(x-size*.5,y-size*.8,size,size*.8);
      context.fillStyle = "#314b63";
      if(obstacle.type === "parked-taxi") context.fillRect(x-size*.35,y-size*.7,size*.7,size*.25);
      else {context.strokeStyle="#54412f";context.lineWidth=2;context.beginPath();context.moveTo(x-size*.4,y-size*.7);context.lineTo(x+size*.4,y-size*.1);context.stroke();}
      context.fillStyle="#121921";
      context.fillRect(x-size*.4,y-size*.07,size*.2,size*.15);context.fillRect(x+size*.2,y-size*.07,size*.2,size*.15);
    }
  }
  const progress = snapshot.laneProgress;
  const smooth = progress * progress * (3 - 2 * progress);
  const lane = snapshot.lane + (snapshot.targetLane - snapshot.lane) * smooth;
  const colour = profile.gender === "woman" ? "#ef5c8d" : profile.gender === "man" ? "#2467d6" : "#7750d1";
  drawPerson(context,laneX(lane,.83),yAt(.83),1,colour,snapshot.elapsedMs,reducedMotion);
  if (snapshot.result?.outcome === "escaped") {
    context.fillStyle = "rgba(255,108,92,.24)"; context.fillRect(0,0,width,height);
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
    const progress = document.createElement("progress");
    progress.className = "chase-progress";
    progress.max = 100;
    progress.value = 0;
    progress.setAttribute("aria-label", "Chase progress");
    shell.append(title, status, progress, canvas, controls);
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
      progress.value = snapshot.distance;
      const approaching = snapshot.visibleObstacles.find(item => item.startMs > snapshot.elapsedMs);
      status.textContent = snapshot.result
        ? (snapshot.result.outcome === "caught" ? "You caught him!" : "Obstacle hit — he gets away.")
        : "CHASE " + snapshot.distance + "%" + (approaching ? " · " + approaching.type.replaceAll("-", " ").toUpperCase() + " AHEAD: " + ["LEFT", "CENTRE", "RIGHT"][approaching.lane] : " · KEEP RUNNING");
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
