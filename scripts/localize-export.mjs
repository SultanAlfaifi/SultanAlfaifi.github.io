// The App Router shares one root layout, so the static export renders <html lang="en"> for every route.
// Stamp the Arabic page with its real language and direction so crawlers and no-JS readers see it before hydration.
import { readFileSync, writeFileSync } from "node:fs";

const target = new URL("../out/ar/index.html", import.meta.url);
const html = readFileSync(target, "utf8");
const localized = html.replace(/<html lang="en"/, '<html lang="ar" dir="rtl"');

if (localized === html) {
  throw new Error("Could not localize out/ar/index.html: <html lang=\"en\"> not found.");
}

writeFileSync(target, localized);
console.log("Localized out/ar/index.html → lang=\"ar\" dir=\"rtl\"");
