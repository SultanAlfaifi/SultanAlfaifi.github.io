// Swap in a new portrait photo: drop it at public/assets/portrait/new-portrait.(jpg|jpeg|png|webp), then run `npm run portrait`.
// Produces a 960px square WebP, points data/portfolio.ts at it, and moves the source out of public/ into tmp/.
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = new URL("../", import.meta.url);
const folder = new URL("public/assets/portrait/", root);
const source = ["jpg", "jpeg", "png", "webp"]
  .map((extension) => new URL(`new-portrait.${extension}`, folder))
  .find((candidate) => existsSync(candidate));

if (!source) {
  throw new Error("No public/assets/portrait/new-portrait.(jpg|jpeg|png|webp) found.");
}

const output = new URL("sultan-alfaifi-photo.webp", folder);
// Read into memory so Windows does not keep the source locked when it is moved afterwards.
sharp.cache(false);
await sharp(readFileSync(source))
  .rotate()
  .resize(960, 960, { fit: "cover", position: sharp.strategy.attention })
  .webp({ quality: 84 })
  .toFile(fileURLToPath(output));

const dataFile = new URL("data/portfolio.ts", root);
const data = readFileSync(dataFile, "utf8");
const updated = data.replace(
  /(id: "portrait",[\s\S]*?color: )"\/assets\/portrait\/[^"]+"([\s\S]*?objectPosition: )"[^"]+"/,
  '$1"/assets/portrait/sultan-alfaifi-photo.webp"$2"50% 32%"'
);
if (updated === data) throw new Error("Could not update the portrait record in data/portfolio.ts.");
writeFileSync(dataFile, updated);

const archive = new URL("tmp/", root);
mkdirSync(archive, { recursive: true });
renameSync(source, new URL(`portrait-source-${Date.now()}${source.pathname.slice(source.pathname.lastIndexOf("."))}`, archive));
console.log("Portrait updated → /assets/portrait/sultan-alfaifi-photo.webp (source moved to tmp/).");
