import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const file = (path) => new URL(path, root);

const index = await readFile(file("index.html"), "utf8");
const readme = await readFile(file("README.md"), "utf8");
const credits = await readFile(file("assets/credits.md"), "utf8");
const css = await readFile(file("v08-sa-edition.css"), "utf8");

assert.match(index, /type="module"\s+src="js\/app\.js"/);
assert.match(index, /href="v08-sa-edition\.css"/);
assert.doesNotMatch(index, /js\/life-game\.js/);
assert.doesNotMatch(index, /v07-playful\.css/);
assert.match(css, /assets\/cover\/south-african-minibus\.jpg/);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /min-width:320px/);
assert.match(credits, /Martinvl/);
assert.match(credits, /creativecommons\.org\/licenses\/by-sa\/4\.0/);
assert.match(readme, /SouthAfricanMinibus\.jpg/);
await access(file("assets/cover/south-african-minibus.jpg"));
const coverSize = (await stat(file("assets/cover/south-african-minibus.jpg"))).size;
assert.ok(coverSize > 100_000, "cover bytes: " + coverSize);

console.log("v08 smoke: production entry, cover credit and responsive contracts passed");
