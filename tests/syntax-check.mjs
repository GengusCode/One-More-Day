import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SourceTextModule } from "node:vm";

const root = new URL("../", import.meta.url);
const visited = new Set();
const readme = await readFile(new URL("README.md", root), "utf8");

function localImports(source) {
  return [...source.matchAll(/(?:import|export)\s+(?:[^"']+?\s+from\s+)?["'](\.[^"']+)["']/g)]
    .map((match) => match[1]);
}

async function parseModule(file) {
  const key = file.href;
  if (visited.has(key)) return;
  visited.add(key);
  const source = await readFile(file, "utf8");
  new SourceTextModule(source, { identifier: file.pathname });
  await Promise.all(localImports(source).map((specifier) => parseModule(new URL(specifier, file))));
}

await parseModule(new URL("js/app.js", root));

assert.ok(visited.has(new URL("js/app.js", root).href));
assert.ok(visited.has(new URL("js/systems/day.js", root).href));
assert.ok(visited.has(new URL("js/minigames/tap-thief.js", root).href));
for (const modulePath of [
  "js/data/life.js",
  "js/data/jobs.js",
  "js/data/people.js",
  "js/systems/life.js",
  "js/systems/jobs.js",
  "js/systems/people.js",
  "js/systems/timeline.js",
  "js/ui/phone.js",
]) {
  assert.ok(visited.has(new URL(modulePath, root).href), modulePath);
}
assert.match(readme, /SA Edition v0\.9/);
console.log("production syntax: " + visited.size + " ES modules parsed");
